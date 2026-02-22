import { PrismaClient } from '@prisma/client';
import { createId } from '@giulio-leone/lib-shared';

export async function seedExerciseCatalog(prisma: PrismaClient, adminUserId: string) {
  const exerciseTypes = [
    { name: 'Strength', imageUrl: null },
    { name: 'Cardio', imageUrl: null },
    { name: 'Flexibility', imageUrl: null },
    { name: 'Balance', imageUrl: null },
  ];
  for (const t of exerciseTypes) {
    await prisma.exercise_types.upsert({
      where: { name: t.name },
      update: {},
      create: { id: createId(), ...t },
    });
  }

  const muscles = [
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
  ];
  for (const name of muscles) {
    await prisma.muscles.upsert({
      where: { name },
      update: {},
      create: { id: createId(), name, slug: name.toLowerCase().replace(/\s+/g, '-') },
    });
  }

  const bodyParts = ['Upper Body', 'Lower Body', 'Core', 'Full Body'];
  for (const name of bodyParts) {
    await prisma.body_parts.upsert({
      where: { name },
      update: {},
      create: { id: createId(), name, slug: name.toLowerCase().replace(/\s+/g, '-') },
    });
  }

  const equipments = [
    'Barbell',
    'Dumbbell',
    'Kettlebell',
    'Resistance Band',
    'Pull-up Bar',
    'Bench',
    'Cable Machine',
    'Bodyweight',
  ];
  for (const name of equipments) {
    await prisma.equipments.upsert({
      where: { name },
      update: {},
      create: { id: createId(), name, slug: name.toLowerCase().replace(/\s+/g, '-') },
    });
  }

  // Helper
  const idBy = async (
    table: 'muscles' | 'body_parts' | 'equipments' | 'exercise_types',
    name: string
  ) => {
    switch (table) {
      case 'muscles':
        return (await prisma.muscles.findUnique({ where: { name } }))!.id;
      case 'body_parts':
        return (await prisma.body_parts.findUnique({ where: { name } }))!.id;
      case 'equipments':
        return (await prisma.equipments.findUnique({ where: { name } }))!.id;
      case 'exercise_types':
        return (await prisma.exercise_types.findUnique({ where: { name } }))!.id;
    }
  };

  // Sample exercises
  const strengthTypeId = await idBy('exercise_types', 'Strength');
  const benchPressId = 'exr_bench_press_001';
  const chestId = await idBy('muscles', 'Chest');
  const tricepsId = await idBy('muscles', 'Triceps');
  const shouldersId = await idBy('muscles', 'Shoulders');
  const upperBody = await idBy('body_parts', 'Upper Body');
  const barbell = await idBy('equipments', 'Barbell');
  const bench = await idBy('equipments', 'Bench');

  await prisma.exercises.upsert({
    where: { id: benchPressId },
    update: {},
    create: {
      id: benchPressId,
      slug: 'bench-press',
      exerciseTypeId: strengthTypeId,
      overview: 'The bench press is a compound exercise that primarily targets the chest muscles.',
      keywords: ['press', 'chest', 'compound'],
      instructions: [
        'Lie flat on the bench with feet on the ground',
        'Grip the bar slightly wider than shoulder width',
        'Lower the bar to your chest with control',
        'Press the bar back up to starting position',
      ],
      exerciseTips: [
        'Keep your shoulder blades retracted',
        'Maintain a slight arch in your lower back',
        "Don't bounce the bar off your chest",
      ],
      variations: ['Incline Bench Press', 'Decline Bench Press', 'Close-Grip Bench Press'],
      approvalStatus: 'APPROVED',
      approvedAt: new Date(),
      approvedById: adminUserId,
      isUserGenerated: false,
      createdById: adminUserId,
      exercise_muscles: {
        create: [
          { muscleId: chestId, role: 'PRIMARY' },
          { muscleId: tricepsId, role: 'SECONDARY' },
          { muscleId: shouldersId, role: 'SECONDARY' },
        ],
      },
      exercise_body_parts: { create: [{ bodyPartId: upperBody }] },
      exercise_equipments: { create: [{ equipmentId: barbell }, { equipmentId: bench }] },
      updatedAt: new Date(),
    },
  });
}
