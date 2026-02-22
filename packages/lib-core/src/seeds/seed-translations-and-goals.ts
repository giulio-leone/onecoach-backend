import { PrismaClient } from '@prisma/client';
import { createId } from '@giulio-leone/lib-shared';

export async function seedTranslationsAndGoals(prisma: PrismaClient) {
  // ExerciseType - crea i tipi se non esistono
  const exerciseTypeTranslations: Record<string, Record<string, string>> = {
    Strength: { en: 'Strength', it: 'Forza' },
    Cardio: { en: 'Cardio', it: 'Cardio' },
    Flexibility: { en: 'Flexibility', it: 'Flessibilità' },
    Balance: { en: 'Balance', it: 'Equilibrio' },
  };
  for (const [typeName, translations] of Object.entries(exerciseTypeTranslations)) {
    // Crea il tipo se non esiste
    const type = await prisma.exercise_types.upsert({
      where: { name: typeName },
      update: {},
      create: {
        id: createId(),
        name: typeName,
        imageUrl: null,
      },
    });

    // Crea le traduzioni per ogni locale
    for (const [locale, name] of Object.entries(translations)) {
      await prisma.exercise_type_translations.upsert({
        where: { exerciseTypeId_locale: { exerciseTypeId: type.id, locale } },
        update: { name },
        create: {
          exerciseTypeId: type.id,
          locale,
          name,
          id: `ext_${type.id}_${locale}`,
          updatedAt: new Date(),
        },
      });
    }
  }

  // Muscles - crea i muscoli se non esistono
  const muscleTranslations: Record<string, Record<string, string>> = {
    Chest: { en: 'Chest', it: 'Petto' },
    Back: { en: 'Back', it: 'Schiena' },
    Shoulders: { en: 'Shoulders', it: 'Spalle' },
    Biceps: { en: 'Biceps', it: 'Bicipiti' },
    Triceps: { en: 'Triceps', it: 'Tricipiti' },
    Quadriceps: { en: 'Quadriceps', it: 'Quadricipiti' },
    Hamstrings: { en: 'Hamstrings', it: 'Ischiocrurali' },
    Glutes: { en: 'Glutes', it: 'Glutei' },
    Calves: { en: 'Calves', it: 'Polpacci' },
    Abs: { en: 'Abs', it: 'Addominali' },
    Forearms: { en: 'Forearms', it: 'Avambracci' },
  };
  for (const [muscleName, translations] of Object.entries(muscleTranslations)) {
    // Crea il muscolo se non esiste
    const muscle = await prisma.muscles.upsert({
      where: { name: muscleName },
      update: {},
      create: {
        id: createId(),
        name: muscleName,
        slug: muscleName.toLowerCase().replace(/\s+/g, '-'),
      },
    });

    // Crea le traduzioni per ogni locale
    for (const [locale, name] of Object.entries(translations)) {
      await prisma.muscle_translations.upsert({
        where: { muscleId_locale: { muscleId: muscle.id, locale } },
        update: { name },
        create: {
          muscleId: muscle.id,
          locale,
          name,
          id: `mt_${muscle.id}_${locale}`,
          updatedAt: new Date(),
        },
      });
    }
  }

  // BodyParts - crea le parti del corpo se non esistono
  const bodyPartTranslations: Record<string, Record<string, string>> = {
    'Upper Body': { en: 'Upper Body', it: 'Parte Superiore' },
    'Lower Body': { en: 'Lower Body', it: 'Parte Inferiore' },
    Core: { en: 'Core', it: 'Core' },
    'Full Body': { en: 'Full Body', it: 'Corpo Intero' },
  };
  for (const [bpName, translations] of Object.entries(bodyPartTranslations)) {
    // Crea la parte del corpo se non esiste
    const bp = await prisma.body_parts.upsert({
      where: { name: bpName },
      update: {},
      create: {
        id: createId(),
        name: bpName,
        slug: bpName.toLowerCase().replace(/\s+/g, '-'),
      },
    });

    // Crea le traduzioni per ogni locale
    for (const [locale, name] of Object.entries(translations)) {
      await prisma.body_part_translations.upsert({
        where: { bodyPartId_locale: { bodyPartId: bp.id, locale } },
        update: { name },
        create: {
          bodyPartId: bp.id,
          locale,
          name,
          id: `bpt_${bp.id}_${locale}`,
          updatedAt: new Date(),
        },
      });
    }
  }

  // Equipment - crea gli equipment se non esistono
  const equipmentTranslations: Record<string, Record<string, string>> = {
    Barbell: { en: 'Barbell', it: 'Bilanciere' },
    Dumbbell: { en: 'Dumbbell', it: 'Manubrio' },
    Kettlebell: { en: 'Kettlebell', it: 'Kettlebell' },
    'Resistance Band': { en: 'Resistance Band', it: 'Banda Elastica' },
    'Pull-up Bar': { en: 'Pull-up Bar', it: 'Sbarra per Trazioni' },
    Bench: { en: 'Bench', it: 'Panca' },
    'Cable Machine': { en: 'Cable Machine', it: 'Cavi' },
    Bodyweight: { en: 'Bodyweight', it: 'Corpo Libero' },
  };
  for (const [eqName, translations] of Object.entries(equipmentTranslations)) {
    // Crea l'equipment se non esiste
    const eq = await prisma.equipments.upsert({
      where: { name: eqName },
      update: {},
      create: {
        id: createId(),
        name: eqName,
        slug: eqName.toLowerCase().replace(/\s+/g, '-'),
      },
    });

    // Crea le traduzioni per ogni locale
    for (const [locale, name] of Object.entries(translations)) {
      await prisma.equipment_translations.upsert({
        where: { equipmentId_locale: { equipmentId: eq.id, locale } },
        update: { name },
        create: {
          equipmentId: eq.id,
          locale,
          name,
          id: `et_${eq.id}_${locale}`,
          updatedAt: new Date(),
        },
      });
    }
  }

  // Workout goals
  const workoutGoals = [
    {
      id: 'clx_goal_strength',
      name: 'STRENGTH',
      slug: 'strength',
      tr: { en: 'Strength', it: 'Forza' },
    },
    {
      id: 'clx_goal_hypertrophy',
      name: 'HYPERTROPHY',
      slug: 'hypertrophy',
      tr: { en: 'Hypertrophy', it: 'Ipertrofia' },
    },
    {
      id: 'clx_goal_endurance',
      name: 'ENDURANCE',
      slug: 'endurance',
      tr: { en: 'Endurance', it: 'Resistenza' },
    },
    {
      id: 'clx_goal_mobility',
      name: 'MOBILITY',
      slug: 'mobility',
      tr: { en: 'Mobility', it: 'Mobilità' },
    },
    {
      id: 'clx_goal_fitness',
      name: 'GENERAL_FITNESS',
      slug: 'general-fitness',
      tr: { en: 'General Fitness', it: 'Benessere generale' },
    },
  ];
  for (const g of workoutGoals) {
    await prisma.workout_goals.upsert({
      where: { id: g.id },
      update: { name: g.name, slug: g.slug },
      create: { id: g.id, name: g.name, slug: g.slug },
    });
    for (const [locale, name] of Object.entries(g.tr)) {
      await prisma.workout_goal_translations.upsert({
        where: { workoutGoalId_locale: { workoutGoalId: g.id, locale } },
        update: { name },
        create: {
          workoutGoalId: g.id,
          locale,
          name,
          id: `wgt_${g.id}_${locale}`,
          updatedAt: new Date(),
        },
      });
    }
  }

  // Nutrition goals
  const nutritionGoals = [
    {
      id: 'clx_ngoal_weightloss',
      name: 'WEIGHT_LOSS',
      slug: 'weight-loss',
      tr: { en: 'Weight Loss', it: 'Perdita di peso' },
    },
    {
      id: 'clx_ngoal_musclegain',
      name: 'MUSCLE_GAIN',
      slug: 'muscle-gain',
      tr: { en: 'Muscle Gain', it: 'Aumento massa muscolare' },
    },
    {
      id: 'clx_ngoal_maintenance',
      name: 'MAINTENANCE',
      slug: 'maintenance',
      tr: { en: 'Maintenance', it: 'Mantenimento' },
    },
    {
      id: 'clx_ngoal_performance',
      name: 'PERFORMANCE',
      slug: 'performance',
      tr: { en: 'Performance', it: 'Performance' },
    },
  ];
  for (const g of nutritionGoals) {
    await prisma.nutrition_goals.upsert({
      where: { id: g.id },
      update: { name: g.name, slug: g.slug },
      create: { id: g.id, name: g.name, slug: g.slug },
    });
    for (const [locale, name] of Object.entries(g.tr)) {
      await prisma.nutrition_goal_translations.upsert({
        where: { nutritionGoalId_locale: { nutritionGoalId: g.id, locale } },
        update: { name },
        create: { id: createId(), nutritionGoalId: g.id, locale, name, updatedAt: new Date() },
      });
    }
  }
}
