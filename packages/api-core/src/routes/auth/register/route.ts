/**
 * Register API Route
 *
 * Gestisce la registrazione di nuovi utenti
 */

import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@giulio-leone/lib-core';
import type { RegisterData } from '@giulio-leone/types';
import { AffiliateService } from '@giulio-leone/lib-marketplace';
import { InvitationService } from '@giulio-leone/lib-core/invitation.service';
import { ConsentService } from '@giulio-leone/lib-core/consent.service';
import { logError, mapErrorToApiResponse } from '@giulio-leone/lib-shared';

import { logger } from '@giulio-leone/lib-core';
export const dynamic = 'force-dynamic';

export async function POST(_req: Request): Promise<Response> {
  try {
    const body: RegisterData & { invitationCode?: string } = await _req.json();
    const { email, password, name, referralCode, invitationCode, privacyConsent, termsConsent } =
      body;

    // Validazione
    if (!email || !password) {
      return NextResponse.json({ error: 'Email e password richiesti' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'La password deve essere di almeno 8 caratteri' },
        { status: 400 }
      );
    }

    // Verifica che le policy obbligatorie siano pubblicate
    const policiesPublished = await ConsentService.areRequiredPoliciesPublished();
    if (!policiesPublished) {
      return NextResponse.json(
        { error: 'Le policy obbligatorie non sono ancora disponibili. Contattare il supporto.' },
        { status: 503 }
      );
    }

    // Validazione consensi obbligatori
    if (!privacyConsent || !termsConsent) {
      return NextResponse.json(
        {
          error:
            'È necessario accettare la Privacy Policy e i Termini e Condizioni per registrarsi',
        },
        { status: 400 }
      );
    }

    // Verifica se l'email esiste già
    const existingUser = await prisma.users.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Email già registrata' }, { status: 400 });
    }

    if (referralCode) {
      const validation = await AffiliateService.validateReferralCode(referralCode);

      if (!validation) {
        return NextResponse.json({ error: 'Referral code non valido' }, { status: 400 });
      }
    }

    // Validazione invito (se presente)
    if (invitationCode) {
      // Verifica che le registrazioni tramite invito siano abilitate
      const { decide } = await import('../../../flags');
      const isInvitationRegistrationEnabled = await decide('ENABLE_INVITATION_REGISTRATION');

      if (!isInvitationRegistrationEnabled) {
        return NextResponse.json(
          { error: 'Le registrazioni tramite invito sono attualmente disabilitate' },
          { status: 403 }
        );
      }

      const inviteValidation = await InvitationService.validateInvitation(invitationCode);
      if (!inviteValidation.isValid) {
        return NextResponse.json(
          { error: inviteValidation.error || 'Codice invito non valido' },
          { status: 400 }
        );
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crea utente con crediti di benvenuto
    const WELCOME_CREDITS = 100;

    const { generateUUID } = await import('@giulio-leone/lib-shared/id-generator');

    // Estrai IP e User-Agent dalla request per il tracciamento consensi
    const ipAddress =
      _req.headers.get('x-forwarded-for') || _req.headers.get('x-real-ip') || undefined;
    const userAgent = _req.headers.get('user-agent') || undefined;

    const user = await prisma.$transaction(async (tx) => {
      const userId = generateUUID(); // UUID required for Supabase Realtime compatibility
      const createdUser = await tx.users.create({
        data: {
          id: userId,
          email,
          password: hashedPassword,
          name: name || null,
          credits: WELCOME_CREDITS,
          role: 'USER',
          status: 'ACTIVE',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      const { createId } = await import('@giulio-leone/lib-shared/id-generator');

      await tx.credit_transactions.create({
        data: {
          id: createId(),
          userId: createdUser.id,
          amount: WELCOME_CREDITS,
          type: 'ADMIN_ADJUSTMENT',
          description: 'Crediti di benvenuto',
          balanceAfter: WELCOME_CREDITS,
          createdAt: new Date(),
        },
      });

      return createdUser;
    });

    // Salva i consensi
    try {
      await ConsentService.giveConsent({
        userId: user.id,
        policyType: 'PRIVACY',
        ipAddress,
        userAgent,
      });
      await ConsentService.giveConsent({
        userId: user.id,
        policyType: 'TERMS',
        ipAddress,
        userAgent,
      });
    } catch (consentError: unknown) {
      logger.error('Consent error:', consentError);
      // Rimuovi utente se il consenso non può essere salvato
      await prisma.users.delete({ where: { id: user.id } });
      return NextResponse.json(
        { error: 'Errore durante il salvataggio del consenso' },
        { status: 500 }
      );
    }

    let affiliateInfo: { creditReward?: number; referralApplied: boolean } | null = null;

    try {
      await AffiliateService.handlePostRegistration({
        userId: user.id,
        referralCode,
      });

      // Recupera informazioni sui crediti referral se applicato
      if (referralCode) {
        const program = await AffiliateService.getActiveProgram();
        if (program) {
          type LevelType = (typeof program.affiliate_program_levels)[number];
          affiliateInfo = {
            referralApplied: true,
            creditReward:
              program.affiliate_program_levels.find((l: LevelType) => l.level === 1)
                ?.creditReward ?? program.registrationCredit,
          };
        }
      }
    } catch (affiliateError: unknown) {
      logger.error('Affiliate post-registration error:', affiliateError);
      await prisma.users.delete({ where: { id: user.id } });

      const message =
        affiliateError instanceof Error
          ? affiliateError.message
          : 'Errore durante la registrazione affiliata';

      return NextResponse.json({ error: message }, { status: 400 });
    }

    // Usa l'invito se presente
    if (invitationCode) {
      try {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        await InvitationService.useInvitation(invitationCode, user.id);
      } catch (invitationError: unknown) {
        logger.error('Error using invitation:', invitationError);
        // Non blocchiamo la registrazione se l'uso dell'invito fallisce dopo la creazione utente,
        // ma logghiamo l'errore. Potremmo voler notificare l'admin.
      }
    }

    // Rimuovi password dalla risposta
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      {
        success: true,
        message: 'Registrazione completata con successo',
        user: userWithoutPassword,
        affiliateInfo,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    logError('Errore durante la registrazione', error);
    const { response, status } = mapErrorToApiResponse(error);
    return NextResponse.json(response, { status });
  }
}
