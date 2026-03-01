import { PrismaClient } from '@prisma/client';
import { createId } from '@giulio-leone/lib-shared';

import { EXERCISE_CATALOG } from './exercise-catalog-data';

const EXERCISE_TYPES = [
  { name: 'Strength', imageUrl: null },
  { name: 'Cardio', imageUrl: null },
  { name: 'Flexibility', imageUrl: null },
  { name: 'Balance', imageUrl: null },
] as const;

const MUSCLES = [
  'Chest',
  'Back',
  'Shoulders',
  'Biceps',
  'Triceps',
  'Quadriceps',
  'Hamstrings',
  'Glutes',
  'Calves',
  'Abs',
  'Forearms',
] as const;

const BODY_PARTS = ['Upper Body', 'Lower Body', 'Core', 'Full Body'] as const;

const EQUIPMENTS = [
  'Barbell',
  'Dumbbell',
  'Kettlebell',
  'Resistance Band',
  'Pull-up Bar',
  'Bench',
  'Cable Machine',
  'Bodyweight',
] as const;

const EXERCISE_TYPE_TRANSLATIONS: Record<string, { en: string; it: string }> = {
  Strength: { en: 'Strength', it: 'Forza' },
  Cardio: { en: 'Cardio', it: 'Cardio' },
  Flexibility: { en: 'Flexibility', it: 'Flessibilita' },
  Balance: { en: 'Balance', it: 'Equilibrio' },
};

const MUSCLE_TRANSLATIONS: Record<string, { en: string; it: string }> = {
  Chest: { en: 'Chest', it: 'Petto' },
  Back: { en: 'Back', it: 'Schiena' },
  Shoulders: { en: 'Shoulders', it: 'Spalle' },
  Biceps: { en: 'Biceps', it: 'Bicipiti' },
  Triceps: { en: 'Triceps', it: 'Tricipiti' },
  Quadriceps: { en: 'Quadriceps', it: 'Quadricipiti' },
  Hamstrings: { en: 'Hamstrings', it: 'Femorali' },
  Glutes: { en: 'Glutes', it: 'Glutei' },
  Calves: { en: 'Calves', it: 'Polpacci' },
  Abs: { en: 'Abs', it: 'Addominali' },
  Forearms: { en: 'Forearms', it: 'Avambracci' },
};

const BODY_PART_TRANSLATIONS: Record<string, { en: string; it: string }> = {
  'Upper Body': { en: 'Upper Body', it: 'Parte superiore' },
  'Lower Body': { en: 'Lower Body', it: 'Parte inferiore' },
  Core: { en: 'Core', it: 'Core' },
  'Full Body': { en: 'Full Body', it: 'Corpo intero' },
};

const EQUIPMENT_TRANSLATIONS: Record<string, { en: string; it: string }> = {
  Barbell: { en: 'Barbell', it: 'Bilanciere' },
  Dumbbell: { en: 'Dumbbell', it: 'Manubrio' },
  Kettlebell: { en: 'Kettlebell', it: 'Kettlebell' },
  'Resistance Band': { en: 'Resistance Band', it: 'Banda elastica' },
  'Pull-up Bar': { en: 'Pull-up Bar', it: 'Sbarra trazioni' },
  Bench: { en: 'Bench', it: 'Panca' },
  'Cable Machine': { en: 'Cable Machine', it: 'Macchina cavi' },
  Bodyweight: { en: 'Bodyweight', it: 'Corpo libero' },
};

function toStableExerciseId(slug: string): string {
  if (slug === 'bench-press') return 'exr_bench_press_001';
  return `exr_${slug.replace(/-/g, '_')}`;
}

export async function seedExerciseCatalog(prisma: PrismaClient, adminUserId: string) {
  for (const exerciseType of EXERCISE_TYPES) {
    await prisma.exercise_types.upsert({
      where: { name: exerciseType.name },
      update: {},
      create: { id: createId(), ...exerciseType },
    });
  }

  for (const name of MUSCLES) {
    await prisma.muscles.upsert({
      where: { name },
      update: {},
      create: { id: createId(), name, slug: name.toLowerCase().replace(/\s+/g, '-') },
    });
  }

  for (const name of BODY_PARTS) {
    await prisma.body_parts.upsert({
      where: { name },
      update: {},
      create: { id: createId(), name, slug: name.toLowerCase().replace(/\s+/g, '-') },
    });
  }

  for (const name of EQUIPMENTS) {
    await prisma.equipments.upsert({
      where: { name },
      update: {},
      create: { id: createId(), name, slug: name.toLowerCase().replace(/\s+/g, '-') },
    });
  }

  const [exerciseTypes, muscles, bodyParts, equipments] = await Promise.all([
    prisma.exercise_types.findMany({ select: { id: true, name: true } }),
    prisma.muscles.findMany({ select: { id: true, name: true } }),
    prisma.body_parts.findMany({ select: { id: true, name: true } }),
    prisma.equipments.findMany({ select: { id: true, name: true } }),
  ]);

  const exerciseTypeIdByName = new Map(exerciseTypes.map((row) => [row.name, row.id]));
  const muscleIdByName = new Map(muscles.map((row) => [row.name, row.id]));
  const bodyPartIdByName = new Map(bodyParts.map((row) => [row.name, row.id]));
  const equipmentIdByName = new Map(equipments.map((row) => [row.name, row.id]));

  for (const exerciseType of EXERCISE_TYPES) {
    const exerciseTypeId = exerciseTypeIdByName.get(exerciseType.name);
    if (!exerciseTypeId) continue;
    const labels = EXERCISE_TYPE_TRANSLATIONS[exerciseType.name] ?? {
      en: exerciseType.name,
      it: exerciseType.name,
    };

    for (const locale of ['en', 'it'] as const) {
      await prisma.exercise_type_translations.upsert({
        where: {
          exerciseTypeId_locale: { exerciseTypeId, locale },
        },
        update: {
          name: labels[locale],
          description: labels[locale],
          updatedAt: new Date(),
        },
        create: {
          id: createId(),
          exerciseTypeId,
          locale,
          name: labels[locale],
          description: labels[locale],
          updatedAt: new Date(),
        },
      });
    }
  }

  for (const muscle of MUSCLES) {
    const muscleId = muscleIdByName.get(muscle);
    if (!muscleId) continue;
    const labels = MUSCLE_TRANSLATIONS[muscle] ?? { en: muscle, it: muscle };

    for (const locale of ['en', 'it'] as const) {
      await prisma.muscle_translations.upsert({
        where: {
          muscleId_locale: { muscleId, locale },
        },
        update: {
          name: labels[locale],
          description: labels[locale],
          updatedAt: new Date(),
        },
        create: {
          id: createId(),
          muscleId,
          locale,
          name: labels[locale],
          description: labels[locale],
          updatedAt: new Date(),
        },
      });
    }
  }

  for (const bodyPart of BODY_PARTS) {
    const bodyPartId = bodyPartIdByName.get(bodyPart);
    if (!bodyPartId) continue;
    const labels = BODY_PART_TRANSLATIONS[bodyPart] ?? { en: bodyPart, it: bodyPart };

    for (const locale of ['en', 'it'] as const) {
      await prisma.body_part_translations.upsert({
        where: {
          bodyPartId_locale: { bodyPartId, locale },
        },
        update: {
          name: labels[locale],
          description: labels[locale],
          updatedAt: new Date(),
        },
        create: {
          id: createId(),
          bodyPartId,
          locale,
          name: labels[locale],
          description: labels[locale],
          updatedAt: new Date(),
        },
      });
    }
  }

  for (const equipment of EQUIPMENTS) {
    const equipmentId = equipmentIdByName.get(equipment);
    if (!equipmentId) continue;
    const labels = EQUIPMENT_TRANSLATIONS[equipment] ?? { en: equipment, it: equipment };

    for (const locale of ['en', 'it'] as const) {
      await prisma.equipment_translations.upsert({
        where: {
          equipmentId_locale: { equipmentId, locale },
        },
        update: {
          name: labels[locale],
          description: labels[locale],
          updatedAt: new Date(),
        },
        create: {
          id: createId(),
          equipmentId,
          locale,
          name: labels[locale],
          description: labels[locale],
          updatedAt: new Date(),
        },
      });
    }
  }

  for (const item of EXERCISE_CATALOG) {
    const exerciseId = toStableExerciseId(item.slug);
    const exerciseTypeId = exerciseTypeIdByName.get(item.type);

    if (!exerciseTypeId) {
      throw new Error(`[seedExerciseCatalog] Missing exercise type: ${item.type}`);
    }

    await prisma.exercises.upsert({
      where: { id: exerciseId },
      update: {
        slug: item.slug,
        exerciseTypeId,
        overview: item.overview,
        keywords: item.keywords,
        instructions: item.instructions,
        exerciseTips: item.exerciseTips,
        variations: item.variations,
        approvalStatus: 'APPROVED',
        approvedAt: new Date(),
        approvedById: adminUserId,
        isUserGenerated: false,
        createdById: adminUserId,
        updatedAt: new Date(),
      },
      create: {
        id: exerciseId,
        slug: item.slug,
        exerciseTypeId,
        overview: item.overview,
        keywords: item.keywords,
        instructions: item.instructions,
        exerciseTips: item.exerciseTips,
        variations: item.variations,
        approvalStatus: 'APPROVED',
        approvedAt: new Date(),
        approvedById: adminUserId,
        isUserGenerated: false,
        createdById: adminUserId,
        updatedAt: new Date(),
      },
    });

    await Promise.all([
      prisma.exercise_muscles.deleteMany({ where: { exerciseId } }),
      prisma.exercise_body_parts.deleteMany({ where: { exerciseId } }),
      prisma.exercise_equipments.deleteMany({ where: { exerciseId } }),
    ]);

    const muscleRelations = [
      ...item.primaryMuscles.map((name) => ({
        exerciseId,
        muscleId: muscleIdByName.get(name) ?? '',
        role: 'PRIMARY' as const,
      })),
      ...item.secondaryMuscles.map((name) => ({
        exerciseId,
        muscleId: muscleIdByName.get(name) ?? '',
        role: 'SECONDARY' as const,
      })),
    ].filter((row) => row.muscleId);

    if (muscleRelations.length > 0) {
      await prisma.exercise_muscles.createMany({
        data: muscleRelations,
        skipDuplicates: true,
      });
    }

    const bodyPartRelations = item.bodyParts
      .map((name) => ({
        exerciseId,
        bodyPartId: bodyPartIdByName.get(name) ?? '',
      }))
      .filter((row) => row.bodyPartId);

    if (bodyPartRelations.length > 0) {
      await prisma.exercise_body_parts.createMany({
        data: bodyPartRelations,
        skipDuplicates: true,
      });
    }

    const equipmentRelations = item.equipment
      .map((name) => ({
        exerciseId,
        equipmentId: equipmentIdByName.get(name) ?? '',
      }))
      .filter((row) => row.equipmentId);

    if (equipmentRelations.length > 0) {
      await prisma.exercise_equipments.createMany({
        data: equipmentRelations,
        skipDuplicates: true,
      });
    }

    for (const locale of ['en', 'it'] as const) {
      const trans = item.translations[locale];
      await prisma.exercise_translations.upsert({
        where: {
          exerciseId_locale: { exerciseId, locale },
        },
        update: {
          name: trans.name,
          shortName: trans.shortName,
          description: trans.description,
          searchTerms: trans.searchTerms,
          updatedAt: new Date(),
        },
        create: {
          id: createId(),
          exerciseId,
          locale,
          name: trans.name,
          shortName: trans.shortName,
          description: trans.description,
          searchTerms: trans.searchTerms,
          updatedAt: new Date(),
        },
      });
    }
  }
}
