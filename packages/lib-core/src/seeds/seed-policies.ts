import { PolicyStatus, PrismaClient } from '@prisma/client';
import { createId } from '@giulio-leone/lib-shared';

export async function seedPolicies(prisma: PrismaClient, adminUserId: string) {
  const basePolicies = [
    {
      type: 'PRIVACY',
      slug: 'privacy-policy',
      title: 'Privacy Policy',
      metaDescription: 'Informativa sulla privacy di onecoach',
      content: '# Privacy Policy\n\nContenuto di default. Aggiorna dal pannello Admin.',
      status: 'PUBLISHED',
    },
    {
      type: 'TERMS',
      slug: 'terms-conditions',
      title: 'Termini e Condizioni',
      metaDescription: 'Termini e condizioni di servizio di onecoach',
      content: '# Termini e Condizioni\n\nContenuto di default. Aggiorna dal pannello Admin.',
      status: 'PUBLISHED',
    },
    {
      type: 'GDPR',
      slug: 'gdpr',
      title: 'GDPR',
      metaDescription: 'Conformità GDPR di onecoach',
      content: '# GDPR\n\nContenuto di default. Aggiorna dal pannello Admin.',
      status: 'PUBLISHED',
    },
    {
      type: 'CONTENT',
      slug: 'content-policy',
      title: 'Content Policy',
      metaDescription: 'Policy sui contenuti di onecoach',
      content: '# Content Policy\n\nContenuto di default. Aggiorna dal pannello Admin.',
      status: 'PUBLISHED',
    },
  ] as const;

  for (const p of basePolicies) {
    const policy = await prisma.policies.upsert({
      where: { type: p.type },
      update: {
        slug: p.slug,
        title: p.title,
        content: p.content,
        metaDescription: p.metaDescription,
        status: p.status as PolicyStatus,
        updatedAt: new Date(),
        updatedById: adminUserId,
        publishedAt: new Date(),
      },
      create: {
        id: createId(),
        slug: p.slug,
        type: p.type,
        title: p.title,
        content: p.content,
        metaDescription: p.metaDescription,
        status: p.status as PolicyStatus,
        version: 1,
        createdById: adminUserId,
        updatedById: adminUserId,
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    await prisma.policy_history.upsert({
      where: { policyId_version: { policyId: policy.id, version: 1 } },
      update: {
        title: policy.title,
        content: policy.content,
        status: policy.status,
        changeReason: 'Creazione iniziale',
      },
      create: {
        id: createId(),
        policyId: policy.id,
        version: 1,
        slug: policy.slug,
        type: policy.type,
        title: policy.title,
        content: policy.content,
        metaDescription: policy.metaDescription ?? undefined,
        status: policy.status,
        changedBy: adminUserId,
        changeReason: 'Creazione iniziale',
        createdAt: new Date(),
      },
    });
  }
}
