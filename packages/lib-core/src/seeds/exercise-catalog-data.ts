export interface ExerciseSeedTranslation {
  name: string;
  shortName: string;
  description: string;
  searchTerms: string[];
}

export interface ExerciseSeedData {
  slug: string;
  type: 'Strength' | 'Cardio' | 'Flexibility' | 'Balance';
  primaryMuscles: string[];
  secondaryMuscles: string[];
  bodyParts: string[];
  equipment: string[];
  overview: string;
  keywords: string[];
  instructions: string[];
  exerciseTips: string[];
  variations: string[];
  translations: {
    en: ExerciseSeedTranslation;
    it: ExerciseSeedTranslation;
  };
  localized: {
    it: {
      instructions: string[];
      exerciseTips: string[];
      variations: string[];
    };
  };
}

export const EXERCISE_CATALOG: ExerciseSeedData[] = [
  {
    slug: 'bench-press',
    type: 'Strength',
    primaryMuscles: ['Chest'],
    secondaryMuscles: ['Triceps', 'Shoulders'],
    bodyParts: ['Upper Body'],
    equipment: ['Barbell', 'Bench'],
    overview: 'The bench press is a compound exercise that primarily targets the chest muscles.',
    keywords: ['bench', 'press', 'chest'],
    instructions: [
      'Lie flat on the bench with feet on the ground',
      'Grip the bar slightly wider than shoulder width',
      'Lower the bar to your chest with control',
      'Press the bar back up to starting position',
    ],
    exerciseTips: [
      'Keep your shoulder blades retracted',
      'Maintain a slight arch in your lower back',
      'Do not bounce the bar off your chest',
    ],
    variations: ['Incline Bench Press', 'Decline Bench Press', 'Close-Grip Bench Press'],
    translations: {
      en: {
        name: 'Bench Press',
        shortName: 'Bench Press',
        description:
          'The bench press is a compound exercise that primarily targets the chest muscles.',
        searchTerms: [
          'bench press',
          'panca piana',
          'bench',
          'press',
          'chest',
          'triceps',
          'shoulders',
        ],
      },
      it: {
        name: 'Panca piana',
        shortName: 'Panca piana',
        description:
          'La panca piana e un esercizio multiarticolare che allena principalmente i muscoli del petto.',
        searchTerms: [
          'bench press',
          'panca piana',
          'bench',
          'press',
          'chest',
          'triceps',
          'shoulders',
        ],
      },
    },
    localized: {
      it: {
        instructions: [
          'Sdraiati sulla panca con i piedi stabili a terra',
          'Impugna il bilanciere poco oltre la larghezza delle spalle',
          'Abbassa il bilanciere al petto in modo controllato',
          'Spingi il bilanciere verso l alto fino alla posizione iniziale',
        ],
        exerciseTips: [
          'Mantieni le scapole addotte durante tutto il movimento',
          'Conserva una lieve curva fisiologica nella zona lombare',
          'Evita di rimbalzare il bilanciere sul petto',
        ],
        variations: ['Panca inclinata', 'Panca declinata', 'Panca presa stretta'],
      },
    },
  },
  {
    slug: 'incline-bench-press',
    type: 'Strength',
    primaryMuscles: ['Chest'],
    secondaryMuscles: ['Shoulders', 'Triceps'],
    bodyParts: ['Upper Body'],
    equipment: ['Barbell', 'Bench'],
    overview:
      'Incline Bench Press is a strength exercise designed to improve force production and control while targeting chest.',
    keywords: ['incline', 'bench', 'press', 'chest'],
    instructions: [
      'Set up for Incline Bench Press with stable posture and braced core.',
      'Perform each rep with controlled tempo and full range of motion.',
      'Keep target muscles under tension while avoiding compensations.',
      'Finish the set preserving technique and controlled breathing.',
    ],
    exerciseTips: [
      'Keep core active and avoid momentum-driven reps.',
      'Use full range while maintaining joint alignment.',
      'Progress load only when technique is stable.',
    ],
    variations: [
      'Tempo Incline Bench Press',
      'Paused Incline Bench Press',
      'Controlled Incline Bench Press',
    ],
    translations: {
      en: {
        name: 'Incline Bench Press',
        shortName: 'Incline Bench Press',
        description:
          'Incline Bench Press is a strength exercise designed to improve force production and control while targeting chest.',
        searchTerms: [
          'incline bench press',
          'panca inclinata',
          'incline',
          'bench',
          'press',
          'chest',
          'shoulders',
          'triceps',
        ],
      },
      it: {
        name: 'Panca inclinata',
        shortName: 'Panca inclinata',
        description:
          'Panca inclinata e un esercizio di forza pensato per migliorare produzione di forza e controllo, con focus su chest.',
        searchTerms: [
          'incline bench press',
          'panca inclinata',
          'incline',
          'bench',
          'press',
          'chest',
          'shoulders',
          'triceps',
        ],
      },
    },
    localized: {
      it: {
        instructions: [
          'Imposta Incline Bench Press con postura stabile e core attivo.',
          'Esegui ogni ripetizione con tempo controllato e range completo.',
          'Mantieni tensione sui muscoli target evitando compensi.',
          'Concludi la serie mantenendo tecnica e respirazione controllata.',
        ],
        exerciseTips: [
          'Mantieni il core attivo ed evita ripetizioni con slancio.',
          'Usa range completo mantenendo allineamento articolare.',
          'Aumenta il carico solo con tecnica stabile.',
        ],
        variations: [
          'Panca inclinata tempo controllato',
          'Panca inclinata con pausa',
          'Panca inclinata eccentrica controllata',
        ],
      },
    },
  },
  {
    slug: 'dumbbell-fly',
    type: 'Strength',
    primaryMuscles: ['Chest'],
    secondaryMuscles: ['Shoulders'],
    bodyParts: ['Upper Body'],
    equipment: ['Dumbbell', 'Bench'],
    overview:
      'Dumbbell Fly is a strength exercise designed to improve force production and control while targeting chest.',
    keywords: ['dumbbell', 'fly', 'chest'],
    instructions: [
      'Set up for Dumbbell Fly with stable posture and braced core.',
      'Perform each rep with controlled tempo and full range of motion.',
      'Keep target muscles under tension while avoiding compensations.',
      'Finish the set preserving technique and controlled breathing.',
    ],
    exerciseTips: [
      'Keep core active and avoid momentum-driven reps.',
      'Use full range while maintaining joint alignment.',
      'Progress load only when technique is stable.',
    ],
    variations: ['Tempo Dumbbell Fly', 'Paused Dumbbell Fly', 'Controlled Dumbbell Fly'],
    translations: {
      en: {
        name: 'Dumbbell Fly',
        shortName: 'Dumbbell Fly',
        description:
          'Dumbbell Fly is a strength exercise designed to improve force production and control while targeting chest.',
        searchTerms: ['dumbbell fly', 'croci con manubri', 'dumbbell', 'fly', 'chest', 'shoulders'],
      },
      it: {
        name: 'Croci con manubri',
        shortName: 'Croci con manubri',
        description:
          'Croci con manubri e un esercizio di forza pensato per migliorare produzione di forza e controllo, con focus su chest.',
        searchTerms: ['dumbbell fly', 'croci con manubri', 'dumbbell', 'fly', 'chest', 'shoulders'],
      },
    },
    localized: {
      it: {
        instructions: [
          'Imposta Dumbbell Fly con postura stabile e core attivo.',
          'Esegui ogni ripetizione con tempo controllato e range completo.',
          'Mantieni tensione sui muscoli target evitando compensi.',
          'Concludi la serie mantenendo tecnica e respirazione controllata.',
        ],
        exerciseTips: [
          'Mantieni il core attivo ed evita ripetizioni con slancio.',
          'Usa range completo mantenendo allineamento articolare.',
          'Aumenta il carico solo con tecnica stabile.',
        ],
        variations: [
          'Croci con manubri tempo controllato',
          'Croci con manubri con pausa',
          'Croci con manubri eccentrica controllata',
        ],
      },
    },
  },
  {
    slug: 'cable-crossover',
    type: 'Strength',
    primaryMuscles: ['Chest'],
    secondaryMuscles: ['Shoulders'],
    bodyParts: ['Upper Body'],
    equipment: ['Cable Machine'],
    overview:
      'Cable Crossover is a strength exercise designed to improve force production and control while targeting chest.',
    keywords: ['cable', 'crossover', 'chest'],
    instructions: [
      'Set up for Cable Crossover with stable posture and braced core.',
      'Perform each rep with controlled tempo and full range of motion.',
      'Keep target muscles under tension while avoiding compensations.',
      'Finish the set preserving technique and controlled breathing.',
    ],
    exerciseTips: [
      'Keep core active and avoid momentum-driven reps.',
      'Use full range while maintaining joint alignment.',
      'Progress load only when technique is stable.',
    ],
    variations: ['Tempo Cable Crossover', 'Paused Cable Crossover', 'Controlled Cable Crossover'],
    translations: {
      en: {
        name: 'Cable Crossover',
        shortName: 'Cable Crossover',
        description:
          'Cable Crossover is a strength exercise designed to improve force production and control while targeting chest.',
        searchTerms: [
          'cable crossover',
          'croci ai cavi',
          'cable',
          'crossover',
          'chest',
          'shoulders',
        ],
      },
      it: {
        name: 'Croci ai cavi',
        shortName: 'Croci ai cavi',
        description:
          'Croci ai cavi e un esercizio di forza pensato per migliorare produzione di forza e controllo, con focus su chest.',
        searchTerms: [
          'cable crossover',
          'croci ai cavi',
          'cable',
          'crossover',
          'chest',
          'shoulders',
        ],
      },
    },
    localized: {
      it: {
        instructions: [
          'Imposta Cable Crossover con postura stabile e core attivo.',
          'Esegui ogni ripetizione con tempo controllato e range completo.',
          'Mantieni tensione sui muscoli target evitando compensi.',
          'Concludi la serie mantenendo tecnica e respirazione controllata.',
        ],
        exerciseTips: [
          'Mantieni il core attivo ed evita ripetizioni con slancio.',
          'Usa range completo mantenendo allineamento articolare.',
          'Aumenta il carico solo con tecnica stabile.',
        ],
        variations: [
          'Croci ai cavi tempo controllato',
          'Croci ai cavi con pausa',
          'Croci ai cavi eccentrica controllata',
        ],
      },
    },
  },
  {
    slug: 'push-up',
    type: 'Strength',
    primaryMuscles: ['Chest'],
    secondaryMuscles: ['Triceps', 'Shoulders'],
    bodyParts: ['Upper Body'],
    equipment: ['Bodyweight'],
    overview:
      'Push-Up is a strength exercise designed to improve force production and control while targeting chest.',
    keywords: ['push', 'up', 'chest'],
    instructions: [
      'Set up for Push-Up with stable posture and braced core.',
      'Perform each rep with controlled tempo and full range of motion.',
      'Keep target muscles under tension while avoiding compensations.',
      'Finish the set preserving technique and controlled breathing.',
    ],
    exerciseTips: [
      'Keep core active and avoid momentum-driven reps.',
      'Use full range while maintaining joint alignment.',
      'Progress load only when technique is stable.',
    ],
    variations: ['Tempo Push-Up', 'Paused Push-Up', 'Controlled Push-Up'],
    translations: {
      en: {
        name: 'Push-Up',
        shortName: 'Push-Up',
        description:
          'Push-Up is a strength exercise designed to improve force production and control while targeting chest.',
        searchTerms: ['push-up', 'piegamenti', 'push up', 'push', 'chest', 'triceps', 'shoulders'],
      },
      it: {
        name: 'Piegamenti',
        shortName: 'Piegamenti',
        description:
          'Piegamenti e un esercizio di forza pensato per migliorare produzione di forza e controllo, con focus su chest.',
        searchTerms: ['push-up', 'piegamenti', 'push up', 'push', 'chest', 'triceps', 'shoulders'],
      },
    },
    localized: {
      it: {
        instructions: [
          'Imposta Push-Up con postura stabile e core attivo.',
          'Esegui ogni ripetizione con tempo controllato e range completo.',
          'Mantieni tensione sui muscoli target evitando compensi.',
          'Concludi la serie mantenendo tecnica e respirazione controllata.',
        ],
        exerciseTips: [
          'Mantieni il core attivo ed evita ripetizioni con slancio.',
          'Usa range completo mantenendo allineamento articolare.',
          'Aumenta il carico solo con tecnica stabile.',
        ],
        variations: [
          'Piegamenti tempo controllato',
          'Piegamenti con pausa',
          'Piegamenti eccentrica controllata',
        ],
      },
    },
  },
  {
    slug: 'decline-bench-press',
    type: 'Strength',
    primaryMuscles: ['Chest'],
    secondaryMuscles: ['Triceps', 'Shoulders'],
    bodyParts: ['Upper Body'],
    equipment: ['Barbell', 'Bench'],
    overview:
      'Decline Bench Press is a strength exercise designed to improve force production and control while targeting chest.',
    keywords: ['decline', 'bench', 'press', 'chest'],
    instructions: [
      'Set up for Decline Bench Press with stable posture and braced core.',
      'Perform each rep with controlled tempo and full range of motion.',
      'Keep target muscles under tension while avoiding compensations.',
      'Finish the set preserving technique and controlled breathing.',
    ],
    exerciseTips: [
      'Keep core active and avoid momentum-driven reps.',
      'Use full range while maintaining joint alignment.',
      'Progress load only when technique is stable.',
    ],
    variations: [
      'Tempo Decline Bench Press',
      'Paused Decline Bench Press',
      'Controlled Decline Bench Press',
    ],
    translations: {
      en: {
        name: 'Decline Bench Press',
        shortName: 'Decline Bench Press',
        description:
          'Decline Bench Press is a strength exercise designed to improve force production and control while targeting chest.',
        searchTerms: [
          'decline bench press',
          'panca declinata',
          'decline',
          'bench',
          'press',
          'chest',
          'triceps',
          'shoulders',
        ],
      },
      it: {
        name: 'Panca declinata',
        shortName: 'Panca declinata',
        description:
          'Panca declinata e un esercizio di forza pensato per migliorare produzione di forza e controllo, con focus su chest.',
        searchTerms: [
          'decline bench press',
          'panca declinata',
          'decline',
          'bench',
          'press',
          'chest',
          'triceps',
          'shoulders',
        ],
      },
    },
    localized: {
      it: {
        instructions: [
          'Imposta Decline Bench Press con postura stabile e core attivo.',
          'Esegui ogni ripetizione con tempo controllato e range completo.',
          'Mantieni tensione sui muscoli target evitando compensi.',
          'Concludi la serie mantenendo tecnica e respirazione controllata.',
        ],
        exerciseTips: [
          'Mantieni il core attivo ed evita ripetizioni con slancio.',
          'Usa range completo mantenendo allineamento articolare.',
          'Aumenta il carico solo con tecnica stabile.',
        ],
        variations: [
          'Panca declinata tempo controllato',
          'Panca declinata con pausa',
          'Panca declinata eccentrica controllata',
        ],
      },
    },
  },
  {
    slug: 'chest-dip',
    type: 'Strength',
    primaryMuscles: ['Chest'],
    secondaryMuscles: ['Triceps', 'Shoulders'],
    bodyParts: ['Upper Body'],
    equipment: ['Bodyweight'],
    overview:
      'Chest Dip is a strength exercise designed to improve force production and control while targeting chest.',
    keywords: ['chest', 'dip'],
    instructions: [
      'Set up for Chest Dip with stable posture and braced core.',
      'Perform each rep with controlled tempo and full range of motion.',
      'Keep target muscles under tension while avoiding compensations.',
      'Finish the set preserving technique and controlled breathing.',
    ],
    exerciseTips: [
      'Keep core active and avoid momentum-driven reps.',
      'Use full range while maintaining joint alignment.',
      'Progress load only when technique is stable.',
    ],
    variations: ['Tempo Chest Dip', 'Paused Chest Dip', 'Controlled Chest Dip'],
    translations: {
      en: {
        name: 'Chest Dip',
        shortName: 'Chest Dip',
        description:
          'Chest Dip is a strength exercise designed to improve force production and control while targeting chest.',
        searchTerms: ['chest dip', 'dip al petto', 'chest', 'dip', 'triceps', 'shoulders'],
      },
      it: {
        name: 'Dip al petto',
        shortName: 'Dip al petto',
        description:
          'Dip al petto e un esercizio di forza pensato per migliorare produzione di forza e controllo, con focus su chest.',
        searchTerms: ['chest dip', 'dip al petto', 'chest', 'dip', 'triceps', 'shoulders'],
      },
    },
    localized: {
      it: {
        instructions: [
          'Imposta Chest Dip con postura stabile e core attivo.',
          'Esegui ogni ripetizione con tempo controllato e range completo.',
          'Mantieni tensione sui muscoli target evitando compensi.',
          'Concludi la serie mantenendo tecnica e respirazione controllata.',
        ],
        exerciseTips: [
          'Mantieni il core attivo ed evita ripetizioni con slancio.',
          'Usa range completo mantenendo allineamento articolare.',
          'Aumenta il carico solo con tecnica stabile.',
        ],
        variations: [
          'Dip al petto tempo controllato',
          'Dip al petto con pausa',
          'Dip al petto eccentrica controllata',
        ],
      },
    },
  },
  {
    slug: 'dumbbell-pullover',
    type: 'Strength',
    primaryMuscles: ['Chest'],
    secondaryMuscles: ['Back', 'Shoulders'],
    bodyParts: ['Upper Body'],
    equipment: ['Dumbbell', 'Bench'],
    overview:
      'Dumbbell Pullover is a strength exercise designed to improve force production and control while targeting chest.',
    keywords: ['dumbbell', 'pullover', 'chest'],
    instructions: [
      'Set up for Dumbbell Pullover with stable posture and braced core.',
      'Perform each rep with controlled tempo and full range of motion.',
      'Keep target muscles under tension while avoiding compensations.',
      'Finish the set preserving technique and controlled breathing.',
    ],
    exerciseTips: [
      'Keep core active and avoid momentum-driven reps.',
      'Use full range while maintaining joint alignment.',
      'Progress load only when technique is stable.',
    ],
    variations: [
      'Tempo Dumbbell Pullover',
      'Paused Dumbbell Pullover',
      'Controlled Dumbbell Pullover',
    ],
    translations: {
      en: {
        name: 'Dumbbell Pullover',
        shortName: 'Dumbbell Pullover',
        description:
          'Dumbbell Pullover is a strength exercise designed to improve force production and control while targeting chest.',
        searchTerms: [
          'dumbbell pullover',
          'pullover con manubrio',
          'dumbbell',
          'pullover',
          'chest',
          'back',
          'shoulders',
        ],
      },
      it: {
        name: 'Pullover con manubrio',
        shortName: 'Pullover con manubrio',
        description:
          'Pullover con manubrio e un esercizio di forza pensato per migliorare produzione di forza e controllo, con focus su chest.',
        searchTerms: [
          'dumbbell pullover',
          'pullover con manubrio',
          'dumbbell',
          'pullover',
          'chest',
          'back',
          'shoulders',
        ],
      },
    },
    localized: {
      it: {
        instructions: [
          'Imposta Dumbbell Pullover con postura stabile e core attivo.',
          'Esegui ogni ripetizione con tempo controllato e range completo.',
          'Mantieni tensione sui muscoli target evitando compensi.',
          'Concludi la serie mantenendo tecnica e respirazione controllata.',
        ],
        exerciseTips: [
          'Mantieni il core attivo ed evita ripetizioni con slancio.',
          'Usa range completo mantenendo allineamento articolare.',
          'Aumenta il carico solo con tecnica stabile.',
        ],
        variations: [
          'Pullover con manubrio tempo controllato',
          'Pullover con manubrio con pausa',
          'Pullover con manubrio eccentrica controllata',
        ],
      },
    },
  },
  {
    slug: 'deadlift',
    type: 'Strength',
    primaryMuscles: ['Back', 'Glutes', 'Hamstrings'],
    secondaryMuscles: ['Forearms', 'Quadriceps'],
    bodyParts: ['Full Body'],
    equipment: ['Barbell'],
    overview:
      'Deadlift is a strength exercise designed to improve force production and control while targeting back, glutes, hamstrings.',
    keywords: ['deadlift', 'back', 'glutes', 'hamstrings'],
    instructions: [
      'Set up for Deadlift with stable posture and braced core.',
      'Perform each rep with controlled tempo and full range of motion.',
      'Keep target muscles under tension while avoiding compensations.',
      'Finish the set preserving technique and controlled breathing.',
    ],
    exerciseTips: [
      'Keep core active and avoid momentum-driven reps.',
      'Use full range while maintaining joint alignment.',
      'Progress load only when technique is stable.',
    ],
    variations: ['Tempo Deadlift', 'Paused Deadlift', 'Controlled Deadlift'],
    translations: {
      en: {
        name: 'Deadlift',
        shortName: 'Deadlift',
        description:
          'Deadlift is a strength exercise designed to improve force production and control while targeting back, glutes, hamstrings.',
        searchTerms: [
          'deadlift',
          'stacco da terra',
          'back',
          'glutes',
          'hamstrings',
          'forearms',
          'quadriceps',
        ],
      },
      it: {
        name: 'Stacco da terra',
        shortName: 'Stacco da terra',
        description:
          'Stacco da terra e un esercizio di forza pensato per migliorare produzione di forza e controllo, con focus su back, glutes, hamstrings.',
        searchTerms: [
          'deadlift',
          'stacco da terra',
          'back',
          'glutes',
          'hamstrings',
          'forearms',
          'quadriceps',
        ],
      },
    },
    localized: {
      it: {
        instructions: [
          'Imposta Deadlift con postura stabile e core attivo.',
          'Esegui ogni ripetizione con tempo controllato e range completo.',
          'Mantieni tensione sui muscoli target evitando compensi.',
          'Concludi la serie mantenendo tecnica e respirazione controllata.',
        ],
        exerciseTips: [
          'Mantieni il core attivo ed evita ripetizioni con slancio.',
          'Usa range completo mantenendo allineamento articolare.',
          'Aumenta il carico solo con tecnica stabile.',
        ],
        variations: [
          'Stacco da terra tempo controllato',
          'Stacco da terra con pausa',
          'Stacco da terra eccentrica controllata',
        ],
      },
    },
  },
  {
    slug: 'barbell-row',
    type: 'Strength',
    primaryMuscles: ['Back'],
    secondaryMuscles: ['Biceps', 'Shoulders'],
    bodyParts: ['Upper Body'],
    equipment: ['Barbell'],
    overview:
      'Barbell Row is a strength exercise designed to improve force production and control while targeting back.',
    keywords: ['barbell', 'row', 'back'],
    instructions: [
      'Set up for Barbell Row with stable posture and braced core.',
      'Perform each rep with controlled tempo and full range of motion.',
      'Keep target muscles under tension while avoiding compensations.',
      'Finish the set preserving technique and controlled breathing.',
    ],
    exerciseTips: [
      'Keep core active and avoid momentum-driven reps.',
      'Use full range while maintaining joint alignment.',
      'Progress load only when technique is stable.',
    ],
    variations: ['Tempo Barbell Row', 'Paused Barbell Row', 'Controlled Barbell Row'],
    translations: {
      en: {
        name: 'Barbell Row',
        shortName: 'Barbell Row',
        description:
          'Barbell Row is a strength exercise designed to improve force production and control while targeting back.',
        searchTerms: [
          'barbell row',
          'rematore con bilanciere',
          'barbell',
          'row',
          'back',
          'biceps',
          'shoulders',
        ],
      },
      it: {
        name: 'Rematore con bilanciere',
        shortName: 'Rematore con bilanciere',
        description:
          'Rematore con bilanciere e un esercizio di forza pensato per migliorare produzione di forza e controllo, con focus su back.',
        searchTerms: [
          'barbell row',
          'rematore con bilanciere',
          'barbell',
          'row',
          'back',
          'biceps',
          'shoulders',
        ],
      },
    },
    localized: {
      it: {
        instructions: [
          'Imposta Barbell Row con postura stabile e core attivo.',
          'Esegui ogni ripetizione con tempo controllato e range completo.',
          'Mantieni tensione sui muscoli target evitando compensi.',
          'Concludi la serie mantenendo tecnica e respirazione controllata.',
        ],
        exerciseTips: [
          'Mantieni il core attivo ed evita ripetizioni con slancio.',
          'Usa range completo mantenendo allineamento articolare.',
          'Aumenta il carico solo con tecnica stabile.',
        ],
        variations: [
          'Rematore con bilanciere tempo controllato',
          'Rematore con bilanciere con pausa',
          'Rematore con bilanciere eccentrica controllata',
        ],
      },
    },
  },
  {
    slug: 'pull-up',
    type: 'Strength',
    primaryMuscles: ['Back'],
    secondaryMuscles: ['Biceps', 'Forearms'],
    bodyParts: ['Upper Body'],
    equipment: ['Pull-up Bar', 'Bodyweight'],
    overview:
      'Pull-Up is a strength exercise designed to improve force production and control while targeting back.',
    keywords: ['pull', 'up', 'back'],
    instructions: [
      'Set up for Pull-Up with stable posture and braced core.',
      'Perform each rep with controlled tempo and full range of motion.',
      'Keep target muscles under tension while avoiding compensations.',
      'Finish the set preserving technique and controlled breathing.',
    ],
    exerciseTips: [
      'Keep core active and avoid momentum-driven reps.',
      'Use full range while maintaining joint alignment.',
      'Progress load only when technique is stable.',
    ],
    variations: ['Tempo Pull-Up', 'Paused Pull-Up', 'Controlled Pull-Up'],
    translations: {
      en: {
        name: 'Pull-Up',
        shortName: 'Pull-Up',
        description:
          'Pull-Up is a strength exercise designed to improve force production and control while targeting back.',
        searchTerms: [
          'pull-up',
          'trazioni alla sbarra',
          'pull up',
          'pull',
          'back',
          'biceps',
          'forearms',
        ],
      },
      it: {
        name: 'Trazioni alla sbarra',
        shortName: 'Trazioni alla sbarra',
        description:
          'Trazioni alla sbarra e un esercizio di forza pensato per migliorare produzione di forza e controllo, con focus su back.',
        searchTerms: [
          'pull-up',
          'trazioni alla sbarra',
          'pull up',
          'pull',
          'back',
          'biceps',
          'forearms',
        ],
      },
    },
    localized: {
      it: {
        instructions: [
          'Imposta Pull-Up con postura stabile e core attivo.',
          'Esegui ogni ripetizione con tempo controllato e range completo.',
          'Mantieni tensione sui muscoli target evitando compensi.',
          'Concludi la serie mantenendo tecnica e respirazione controllata.',
        ],
        exerciseTips: [
          'Mantieni il core attivo ed evita ripetizioni con slancio.',
          'Usa range completo mantenendo allineamento articolare.',
          'Aumenta il carico solo con tecnica stabile.',
        ],
        variations: [
          'Trazioni alla sbarra tempo controllato',
          'Trazioni alla sbarra con pausa',
          'Trazioni alla sbarra eccentrica controllata',
        ],
      },
    },
  },
  {
    slug: 'lat-pulldown',
    type: 'Strength',
    primaryMuscles: ['Back'],
    secondaryMuscles: ['Biceps'],
    bodyParts: ['Upper Body'],
    equipment: ['Cable Machine'],
    overview:
      'Lat Pulldown is a strength exercise designed to improve force production and control while targeting back.',
    keywords: ['lat', 'pulldown', 'back'],
    instructions: [
      'Set up for Lat Pulldown with stable posture and braced core.',
      'Perform each rep with controlled tempo and full range of motion.',
      'Keep target muscles under tension while avoiding compensations.',
      'Finish the set preserving technique and controlled breathing.',
    ],
    exerciseTips: [
      'Keep core active and avoid momentum-driven reps.',
      'Use full range while maintaining joint alignment.',
      'Progress load only when technique is stable.',
    ],
    variations: ['Tempo Lat Pulldown', 'Paused Lat Pulldown', 'Controlled Lat Pulldown'],
    translations: {
      en: {
        name: 'Lat Pulldown',
        shortName: 'Lat Pulldown',
        description:
          'Lat Pulldown is a strength exercise designed to improve force production and control while targeting back.',
        searchTerms: ['lat pulldown', 'lat machine', 'lat', 'pulldown', 'back', 'biceps'],
      },
      it: {
        name: 'Lat machine',
        shortName: 'Lat machine',
        description:
          'Lat machine e un esercizio di forza pensato per migliorare produzione di forza e controllo, con focus su back.',
        searchTerms: ['lat pulldown', 'lat machine', 'lat', 'pulldown', 'back', 'biceps'],
      },
    },
    localized: {
      it: {
        instructions: [
          'Imposta Lat Pulldown con postura stabile e core attivo.',
          'Esegui ogni ripetizione con tempo controllato e range completo.',
          'Mantieni tensione sui muscoli target evitando compensi.',
          'Concludi la serie mantenendo tecnica e respirazione controllata.',
        ],
        exerciseTips: [
          'Mantieni il core attivo ed evita ripetizioni con slancio.',
          'Usa range completo mantenendo allineamento articolare.',
          'Aumenta il carico solo con tecnica stabile.',
        ],
        variations: [
          'Lat machine tempo controllato',
          'Lat machine con pausa',
          'Lat machine eccentrica controllata',
        ],
      },
    },
  },
  {
    slug: 'seated-row',
    type: 'Strength',
    primaryMuscles: ['Back'],
    secondaryMuscles: ['Biceps', 'Shoulders'],
    bodyParts: ['Upper Body'],
    equipment: ['Cable Machine'],
    overview:
      'Seated Row is a strength exercise designed to improve force production and control while targeting back.',
    keywords: ['seated', 'row', 'back'],
    instructions: [
      'Set up for Seated Row with stable posture and braced core.',
      'Perform each rep with controlled tempo and full range of motion.',
      'Keep target muscles under tension while avoiding compensations.',
      'Finish the set preserving technique and controlled breathing.',
    ],
    exerciseTips: [
      'Keep core active and avoid momentum-driven reps.',
      'Use full range while maintaining joint alignment.',
      'Progress load only when technique is stable.',
    ],
    variations: ['Tempo Seated Row', 'Paused Seated Row', 'Controlled Seated Row'],
    translations: {
      en: {
        name: 'Seated Row',
        shortName: 'Seated Row',
        description:
          'Seated Row is a strength exercise designed to improve force production and control while targeting back.',
        searchTerms: [
          'seated row',
          'rematore da seduto',
          'seated',
          'row',
          'back',
          'biceps',
          'shoulders',
        ],
      },
      it: {
        name: 'Rematore da seduto',
        shortName: 'Rematore da seduto',
        description:
          'Rematore da seduto e un esercizio di forza pensato per migliorare produzione di forza e controllo, con focus su back.',
        searchTerms: [
          'seated row',
          'rematore da seduto',
          'seated',
          'row',
          'back',
          'biceps',
          'shoulders',
        ],
      },
    },
    localized: {
      it: {
        instructions: [
          'Imposta Seated Row con postura stabile e core attivo.',
          'Esegui ogni ripetizione con tempo controllato e range completo.',
          'Mantieni tensione sui muscoli target evitando compensi.',
          'Concludi la serie mantenendo tecnica e respirazione controllata.',
        ],
        exerciseTips: [
          'Mantieni il core attivo ed evita ripetizioni con slancio.',
          'Usa range completo mantenendo allineamento articolare.',
          'Aumenta il carico solo con tecnica stabile.',
        ],
        variations: [
          'Rematore da seduto tempo controllato',
          'Rematore da seduto con pausa',
          'Rematore da seduto eccentrica controllata',
        ],
      },
    },
  },
  {
    slug: 't-bar-row',
    type: 'Strength',
    primaryMuscles: ['Back'],
    secondaryMuscles: ['Biceps'],
    bodyParts: ['Upper Body'],
    equipment: ['Barbell'],
    overview:
      'T-Bar Row is a strength exercise designed to improve force production and control while targeting back.',
    keywords: ['t', 'bar', 'row', 'back'],
    instructions: [
      'Set up for T-Bar Row with stable posture and braced core.',
      'Perform each rep with controlled tempo and full range of motion.',
      'Keep target muscles under tension while avoiding compensations.',
      'Finish the set preserving technique and controlled breathing.',
    ],
    exerciseTips: [
      'Keep core active and avoid momentum-driven reps.',
      'Use full range while maintaining joint alignment.',
      'Progress load only when technique is stable.',
    ],
    variations: ['Tempo T-Bar Row', 'Paused T-Bar Row', 'Controlled T-Bar Row'],
    translations: {
      en: {
        name: 'T-Bar Row',
        shortName: 'T-Bar Row',
        description:
          'T-Bar Row is a strength exercise designed to improve force production and control while targeting back.',
        searchTerms: ['t-bar row', 'rematore t-bar', 't bar row', 'bar', 'row', 'back', 'biceps'],
      },
      it: {
        name: 'Rematore T-Bar',
        shortName: 'Rematore T-Bar',
        description:
          'Rematore T-Bar e un esercizio di forza pensato per migliorare produzione di forza e controllo, con focus su back.',
        searchTerms: ['t-bar row', 'rematore t-bar', 't bar row', 'bar', 'row', 'back', 'biceps'],
      },
    },
    localized: {
      it: {
        instructions: [
          'Imposta T-Bar Row con postura stabile e core attivo.',
          'Esegui ogni ripetizione con tempo controllato e range completo.',
          'Mantieni tensione sui muscoli target evitando compensi.',
          'Concludi la serie mantenendo tecnica e respirazione controllata.',
        ],
        exerciseTips: [
          'Mantieni il core attivo ed evita ripetizioni con slancio.',
          'Usa range completo mantenendo allineamento articolare.',
          'Aumenta il carico solo con tecnica stabile.',
        ],
        variations: [
          'Rematore T-Bar tempo controllato',
          'Rematore T-Bar con pausa',
          'Rematore T-Bar eccentrica controllata',
        ],
      },
    },
  },
  {
    slug: 'single-arm-dumbbell-row',
    type: 'Strength',
    primaryMuscles: ['Back'],
    secondaryMuscles: ['Biceps', 'Forearms'],
    bodyParts: ['Upper Body'],
    equipment: ['Dumbbell', 'Bench'],
    overview:
      'Single-Arm Dumbbell Row is a strength exercise designed to improve force production and control while targeting back.',
    keywords: ['single', 'arm', 'dumbbell', 'row', 'back'],
    instructions: [
      'Set up for Single-Arm Dumbbell Row with stable posture and braced core.',
      'Perform each rep with controlled tempo and full range of motion.',
      'Keep target muscles under tension while avoiding compensations.',
      'Finish the set preserving technique and controlled breathing.',
    ],
    exerciseTips: [
      'Keep core active and avoid momentum-driven reps.',
      'Use full range while maintaining joint alignment.',
      'Progress load only when technique is stable.',
    ],
    variations: [
      'Tempo Single-Arm Dumbbell Row',
      'Paused Single-Arm Dumbbell Row',
      'Controlled Single-Arm Dumbbell Row',
    ],
    translations: {
      en: {
        name: 'Single-Arm Dumbbell Row',
        shortName: 'Single-Arm Dumbbell Row',
        description:
          'Single-Arm Dumbbell Row is a strength exercise designed to improve force production and control while targeting back.',
        searchTerms: [
          'single-arm dumbbell row',
          'rematore manubrio unilaterale',
          'single arm dumbbell row',
          'single',
          'arm',
          'dumbbell',
          'row',
          'back',
          'biceps',
          'forearms',
        ],
      },
      it: {
        name: 'Rematore manubrio unilaterale',
        shortName: 'Rematore manubrio unilateral',
        description:
          'Rematore manubrio unilaterale e un esercizio di forza pensato per migliorare produzione di forza e controllo, con focus su back.',
        searchTerms: [
          'single-arm dumbbell row',
          'rematore manubrio unilaterale',
          'single arm dumbbell row',
          'single',
          'arm',
          'dumbbell',
          'row',
          'back',
          'biceps',
          'forearms',
        ],
      },
    },
    localized: {
      it: {
        instructions: [
          'Imposta Single-Arm Dumbbell Row con postura stabile e core attivo.',
          'Esegui ogni ripetizione con tempo controllato e range completo.',
          'Mantieni tensione sui muscoli target evitando compensi.',
          'Concludi la serie mantenendo tecnica e respirazione controllata.',
        ],
        exerciseTips: [
          'Mantieni il core attivo ed evita ripetizioni con slancio.',
          'Usa range completo mantenendo allineamento articolare.',
          'Aumenta il carico solo con tecnica stabile.',
        ],
        variations: [
          'Rematore manubrio unilaterale tempo controllato',
          'Rematore manubrio unilaterale con pausa',
          'Rematore manubrio unilaterale eccentrica controllata',
        ],
      },
    },
  },
  {
    slug: 'face-pull',
    type: 'Strength',
    primaryMuscles: ['Shoulders', 'Back'],
    secondaryMuscles: ['Forearms'],
    bodyParts: ['Upper Body'],
    equipment: ['Cable Machine'],
    overview:
      'Face Pull is a strength exercise designed to improve force production and control while targeting shoulders, back.',
    keywords: ['face', 'pull', 'shoulders', 'back'],
    instructions: [
      'Set up for Face Pull with stable posture and braced core.',
      'Perform each rep with controlled tempo and full range of motion.',
      'Keep target muscles under tension while avoiding compensations.',
      'Finish the set preserving technique and controlled breathing.',
    ],
    exerciseTips: [
      'Keep core active and avoid momentum-driven reps.',
      'Use full range while maintaining joint alignment.',
      'Progress load only when technique is stable.',
    ],
    variations: ['Tempo Face Pull', 'Paused Face Pull', 'Controlled Face Pull'],
    translations: {
      en: {
        name: 'Face Pull',
        shortName: 'Face Pull',
        description:
          'Face Pull is a strength exercise designed to improve force production and control while targeting shoulders, back.',
        searchTerms: ['face pull', 'face', 'pull', 'shoulders', 'back', 'forearms'],
      },
      it: {
        name: 'Face pull',
        shortName: 'Face pull',
        description:
          'Face pull e un esercizio di forza pensato per migliorare produzione di forza e controllo, con focus su shoulders, back.',
        searchTerms: ['face pull', 'face', 'pull', 'shoulders', 'back', 'forearms'],
      },
    },
    localized: {
      it: {
        instructions: [
          'Imposta Face Pull con postura stabile e core attivo.',
          'Esegui ogni ripetizione con tempo controllato e range completo.',
          'Mantieni tensione sui muscoli target evitando compensi.',
          'Concludi la serie mantenendo tecnica e respirazione controllata.',
        ],
        exerciseTips: [
          'Mantieni il core attivo ed evita ripetizioni con slancio.',
          'Usa range completo mantenendo allineamento articolare.',
          'Aumenta il carico solo con tecnica stabile.',
        ],
        variations: [
          'Face pull tempo controllato',
          'Face pull con pausa',
          'Face pull eccentrica controllata',
        ],
      },
    },
  },
  {
    slug: 'overhead-press',
    type: 'Strength',
    primaryMuscles: ['Shoulders'],
    secondaryMuscles: ['Triceps'],
    bodyParts: ['Upper Body'],
    equipment: ['Barbell'],
    overview:
      'Overhead Press is a strength exercise designed to improve force production and control while targeting shoulders.',
    keywords: ['overhead', 'press', 'shoulders'],
    instructions: [
      'Set up for Overhead Press with stable posture and braced core.',
      'Perform each rep with controlled tempo and full range of motion.',
      'Keep target muscles under tension while avoiding compensations.',
      'Finish the set preserving technique and controlled breathing.',
    ],
    exerciseTips: [
      'Keep core active and avoid momentum-driven reps.',
      'Use full range while maintaining joint alignment.',
      'Progress load only when technique is stable.',
    ],
    variations: ['Tempo Overhead Press', 'Paused Overhead Press', 'Controlled Overhead Press'],
    translations: {
      en: {
        name: 'Overhead Press',
        shortName: 'Overhead Press',
        description:
          'Overhead Press is a strength exercise designed to improve force production and control while targeting shoulders.',
        searchTerms: [
          'overhead press',
          'military press',
          'overhead',
          'press',
          'shoulders',
          'triceps',
        ],
      },
      it: {
        name: 'Military press',
        shortName: 'Military press',
        description:
          'Military press e un esercizio di forza pensato per migliorare produzione di forza e controllo, con focus su shoulders.',
        searchTerms: [
          'overhead press',
          'military press',
          'overhead',
          'press',
          'shoulders',
          'triceps',
        ],
      },
    },
    localized: {
      it: {
        instructions: [
          'Imposta Overhead Press con postura stabile e core attivo.',
          'Esegui ogni ripetizione con tempo controllato e range completo.',
          'Mantieni tensione sui muscoli target evitando compensi.',
          'Concludi la serie mantenendo tecnica e respirazione controllata.',
        ],
        exerciseTips: [
          'Mantieni il core attivo ed evita ripetizioni con slancio.',
          'Usa range completo mantenendo allineamento articolare.',
          'Aumenta il carico solo con tecnica stabile.',
        ],
        variations: [
          'Military press tempo controllato',
          'Military press con pausa',
          'Military press eccentrica controllata',
        ],
      },
    },
  },
  {
    slug: 'lateral-raise',
    type: 'Strength',
    primaryMuscles: ['Shoulders'],
    secondaryMuscles: ['Forearms'],
    bodyParts: ['Upper Body'],
    equipment: ['Dumbbell'],
    overview:
      'Lateral Raise is a strength exercise designed to improve force production and control while targeting shoulders.',
    keywords: ['lateral', 'raise', 'shoulders'],
    instructions: [
      'Set up for Lateral Raise with stable posture and braced core.',
      'Perform each rep with controlled tempo and full range of motion.',
      'Keep target muscles under tension while avoiding compensations.',
      'Finish the set preserving technique and controlled breathing.',
    ],
    exerciseTips: [
      'Keep core active and avoid momentum-driven reps.',
      'Use full range while maintaining joint alignment.',
      'Progress load only when technique is stable.',
    ],
    variations: ['Tempo Lateral Raise', 'Paused Lateral Raise', 'Controlled Lateral Raise'],
    translations: {
      en: {
        name: 'Lateral Raise',
        shortName: 'Lateral Raise',
        description:
          'Lateral Raise is a strength exercise designed to improve force production and control while targeting shoulders.',
        searchTerms: [
          'lateral raise',
          'alzate laterali',
          'lateral',
          'raise',
          'shoulders',
          'forearms',
        ],
      },
      it: {
        name: 'Alzate laterali',
        shortName: 'Alzate laterali',
        description:
          'Alzate laterali e un esercizio di forza pensato per migliorare produzione di forza e controllo, con focus su shoulders.',
        searchTerms: [
          'lateral raise',
          'alzate laterali',
          'lateral',
          'raise',
          'shoulders',
          'forearms',
        ],
      },
    },
    localized: {
      it: {
        instructions: [
          'Imposta Lateral Raise con postura stabile e core attivo.',
          'Esegui ogni ripetizione con tempo controllato e range completo.',
          'Mantieni tensione sui muscoli target evitando compensi.',
          'Concludi la serie mantenendo tecnica e respirazione controllata.',
        ],
        exerciseTips: [
          'Mantieni il core attivo ed evita ripetizioni con slancio.',
          'Usa range completo mantenendo allineamento articolare.',
          'Aumenta il carico solo con tecnica stabile.',
        ],
        variations: [
          'Alzate laterali tempo controllato',
          'Alzate laterali con pausa',
          'Alzate laterali eccentrica controllata',
        ],
      },
    },
  },
  {
    slug: 'front-raise',
    type: 'Strength',
    primaryMuscles: ['Shoulders'],
    secondaryMuscles: ['Forearms'],
    bodyParts: ['Upper Body'],
    equipment: ['Dumbbell'],
    overview:
      'Front Raise is a strength exercise designed to improve force production and control while targeting shoulders.',
    keywords: ['front', 'raise', 'shoulders'],
    instructions: [
      'Set up for Front Raise with stable posture and braced core.',
      'Perform each rep with controlled tempo and full range of motion.',
      'Keep target muscles under tension while avoiding compensations.',
      'Finish the set preserving technique and controlled breathing.',
    ],
    exerciseTips: [
      'Keep core active and avoid momentum-driven reps.',
      'Use full range while maintaining joint alignment.',
      'Progress load only when technique is stable.',
    ],
    variations: ['Tempo Front Raise', 'Paused Front Raise', 'Controlled Front Raise'],
    translations: {
      en: {
        name: 'Front Raise',
        shortName: 'Front Raise',
        description:
          'Front Raise is a strength exercise designed to improve force production and control while targeting shoulders.',
        searchTerms: ['front raise', 'alzate frontali', 'front', 'raise', 'shoulders', 'forearms'],
      },
      it: {
        name: 'Alzate frontali',
        shortName: 'Alzate frontali',
        description:
          'Alzate frontali e un esercizio di forza pensato per migliorare produzione di forza e controllo, con focus su shoulders.',
        searchTerms: ['front raise', 'alzate frontali', 'front', 'raise', 'shoulders', 'forearms'],
      },
    },
    localized: {
      it: {
        instructions: [
          'Imposta Front Raise con postura stabile e core attivo.',
          'Esegui ogni ripetizione con tempo controllato e range completo.',
          'Mantieni tensione sui muscoli target evitando compensi.',
          'Concludi la serie mantenendo tecnica e respirazione controllata.',
        ],
        exerciseTips: [
          'Mantieni il core attivo ed evita ripetizioni con slancio.',
          'Usa range completo mantenendo allineamento articolare.',
          'Aumenta il carico solo con tecnica stabile.',
        ],
        variations: [
          'Alzate frontali tempo controllato',
          'Alzate frontali con pausa',
          'Alzate frontali eccentrica controllata',
        ],
      },
    },
  },
  {
    slug: 'reverse-fly',
    type: 'Strength',
    primaryMuscles: ['Shoulders', 'Back'],
    secondaryMuscles: ['Forearms'],
    bodyParts: ['Upper Body'],
    equipment: ['Dumbbell', 'Bench'],
    overview:
      'Reverse Fly is a strength exercise designed to improve force production and control while targeting shoulders, back.',
    keywords: ['reverse', 'fly', 'shoulders', 'back'],
    instructions: [
      'Set up for Reverse Fly with stable posture and braced core.',
      'Perform each rep with controlled tempo and full range of motion.',
      'Keep target muscles under tension while avoiding compensations.',
      'Finish the set preserving technique and controlled breathing.',
    ],
    exerciseTips: [
      'Keep core active and avoid momentum-driven reps.',
      'Use full range while maintaining joint alignment.',
      'Progress load only when technique is stable.',
    ],
    variations: ['Tempo Reverse Fly', 'Paused Reverse Fly', 'Controlled Reverse Fly'],
    translations: {
      en: {
        name: 'Reverse Fly',
        shortName: 'Reverse Fly',
        description:
          'Reverse Fly is a strength exercise designed to improve force production and control while targeting shoulders, back.',
        searchTerms: [
          'reverse fly',
          'alzate posteriori',
          'reverse',
          'fly',
          'shoulders',
          'back',
          'forearms',
        ],
      },
      it: {
        name: 'Alzate posteriori',
        shortName: 'Alzate posteriori',
        description:
          'Alzate posteriori e un esercizio di forza pensato per migliorare produzione di forza e controllo, con focus su shoulders, back.',
        searchTerms: [
          'reverse fly',
          'alzate posteriori',
          'reverse',
          'fly',
          'shoulders',
          'back',
          'forearms',
        ],
      },
    },
    localized: {
      it: {
        instructions: [
          'Imposta Reverse Fly con postura stabile e core attivo.',
          'Esegui ogni ripetizione con tempo controllato e range completo.',
          'Mantieni tensione sui muscoli target evitando compensi.',
          'Concludi la serie mantenendo tecnica e respirazione controllata.',
        ],
        exerciseTips: [
          'Mantieni il core attivo ed evita ripetizioni con slancio.',
          'Usa range completo mantenendo allineamento articolare.',
          'Aumenta il carico solo con tecnica stabile.',
        ],
        variations: [
          'Alzate posteriori tempo controllato',
          'Alzate posteriori con pausa',
          'Alzate posteriori eccentrica controllata',
        ],
      },
    },
  },
  {
    slug: 'arnold-press',
    type: 'Strength',
    primaryMuscles: ['Shoulders'],
    secondaryMuscles: ['Triceps'],
    bodyParts: ['Upper Body'],
    equipment: ['Dumbbell', 'Bench'],
    overview:
      'Arnold Press is a strength exercise designed to improve force production and control while targeting shoulders.',
    keywords: ['arnold', 'press', 'shoulders'],
    instructions: [
      'Set up for Arnold Press with stable posture and braced core.',
      'Perform each rep with controlled tempo and full range of motion.',
      'Keep target muscles under tension while avoiding compensations.',
      'Finish the set preserving technique and controlled breathing.',
    ],
    exerciseTips: [
      'Keep core active and avoid momentum-driven reps.',
      'Use full range while maintaining joint alignment.',
      'Progress load only when technique is stable.',
    ],
    variations: ['Tempo Arnold Press', 'Paused Arnold Press', 'Controlled Arnold Press'],
    translations: {
      en: {
        name: 'Arnold Press',
        shortName: 'Arnold Press',
        description:
          'Arnold Press is a strength exercise designed to improve force production and control while targeting shoulders.',
        searchTerms: ['arnold press', 'arnold', 'press', 'shoulders', 'triceps'],
      },
      it: {
        name: 'Arnold press',
        shortName: 'Arnold press',
        description:
          'Arnold press e un esercizio di forza pensato per migliorare produzione di forza e controllo, con focus su shoulders.',
        searchTerms: ['arnold press', 'arnold', 'press', 'shoulders', 'triceps'],
      },
    },
    localized: {
      it: {
        instructions: [
          'Imposta Arnold Press con postura stabile e core attivo.',
          'Esegui ogni ripetizione con tempo controllato e range completo.',
          'Mantieni tensione sui muscoli target evitando compensi.',
          'Concludi la serie mantenendo tecnica e respirazione controllata.',
        ],
        exerciseTips: [
          'Mantieni il core attivo ed evita ripetizioni con slancio.',
          'Usa range completo mantenendo allineamento articolare.',
          'Aumenta il carico solo con tecnica stabile.',
        ],
        variations: [
          'Arnold press tempo controllato',
          'Arnold press con pausa',
          'Arnold press eccentrica controllata',
        ],
      },
    },
  },
  {
    slug: 'upright-row',
    type: 'Strength',
    primaryMuscles: ['Shoulders'],
    secondaryMuscles: ['Back', 'Biceps'],
    bodyParts: ['Upper Body'],
    equipment: ['Barbell'],
    overview:
      'Upright Row is a strength exercise designed to improve force production and control while targeting shoulders.',
    keywords: ['upright', 'row', 'shoulders'],
    instructions: [
      'Set up for Upright Row with stable posture and braced core.',
      'Perform each rep with controlled tempo and full range of motion.',
      'Keep target muscles under tension while avoiding compensations.',
      'Finish the set preserving technique and controlled breathing.',
    ],
    exerciseTips: [
      'Keep core active and avoid momentum-driven reps.',
      'Use full range while maintaining joint alignment.',
      'Progress load only when technique is stable.',
    ],
    variations: ['Tempo Upright Row', 'Paused Upright Row', 'Controlled Upright Row'],
    translations: {
      en: {
        name: 'Upright Row',
        shortName: 'Upright Row',
        description:
          'Upright Row is a strength exercise designed to improve force production and control while targeting shoulders.',
        searchTerms: [
          'upright row',
          'tirate al mento',
          'upright',
          'row',
          'shoulders',
          'back',
          'biceps',
        ],
      },
      it: {
        name: 'Tirate al mento',
        shortName: 'Tirate al mento',
        description:
          'Tirate al mento e un esercizio di forza pensato per migliorare produzione di forza e controllo, con focus su shoulders.',
        searchTerms: [
          'upright row',
          'tirate al mento',
          'upright',
          'row',
          'shoulders',
          'back',
          'biceps',
        ],
      },
    },
    localized: {
      it: {
        instructions: [
          'Imposta Upright Row con postura stabile e core attivo.',
          'Esegui ogni ripetizione con tempo controllato e range completo.',
          'Mantieni tensione sui muscoli target evitando compensi.',
          'Concludi la serie mantenendo tecnica e respirazione controllata.',
        ],
        exerciseTips: [
          'Mantieni il core attivo ed evita ripetizioni con slancio.',
          'Usa range completo mantenendo allineamento articolare.',
          'Aumenta il carico solo con tecnica stabile.',
        ],
        variations: [
          'Tirate al mento tempo controllato',
          'Tirate al mento con pausa',
          'Tirate al mento eccentrica controllata',
        ],
      },
    },
  },
  {
    slug: 'cable-lateral-raise',
    type: 'Strength',
    primaryMuscles: ['Shoulders'],
    secondaryMuscles: ['Forearms'],
    bodyParts: ['Upper Body'],
    equipment: ['Cable Machine'],
    overview:
      'Cable Lateral Raise is a strength exercise designed to improve force production and control while targeting shoulders.',
    keywords: ['cable', 'lateral', 'raise', 'shoulders'],
    instructions: [
      'Set up for Cable Lateral Raise with stable posture and braced core.',
      'Perform each rep with controlled tempo and full range of motion.',
      'Keep target muscles under tension while avoiding compensations.',
      'Finish the set preserving technique and controlled breathing.',
    ],
    exerciseTips: [
      'Keep core active and avoid momentum-driven reps.',
      'Use full range while maintaining joint alignment.',
      'Progress load only when technique is stable.',
    ],
    variations: [
      'Tempo Cable Lateral Raise',
      'Paused Cable Lateral Raise',
      'Controlled Cable Lateral Raise',
    ],
    translations: {
      en: {
        name: 'Cable Lateral Raise',
        shortName: 'Cable Lateral Raise',
        description:
          'Cable Lateral Raise is a strength exercise designed to improve force production and control while targeting shoulders.',
        searchTerms: [
          'cable lateral raise',
          'alzate laterali ai cavi',
          'cable',
          'lateral',
          'raise',
          'shoulders',
          'forearms',
        ],
      },
      it: {
        name: 'Alzate laterali ai cavi',
        shortName: 'Alzate laterali ai cavi',
        description:
          'Alzate laterali ai cavi e un esercizio di forza pensato per migliorare produzione di forza e controllo, con focus su shoulders.',
        searchTerms: [
          'cable lateral raise',
          'alzate laterali ai cavi',
          'cable',
          'lateral',
          'raise',
          'shoulders',
          'forearms',
        ],
      },
    },
    localized: {
      it: {
        instructions: [
          'Imposta Cable Lateral Raise con postura stabile e core attivo.',
          'Esegui ogni ripetizione con tempo controllato e range completo.',
          'Mantieni tensione sui muscoli target evitando compensi.',
          'Concludi la serie mantenendo tecnica e respirazione controllata.',
        ],
        exerciseTips: [
          'Mantieni il core attivo ed evita ripetizioni con slancio.',
          'Usa range completo mantenendo allineamento articolare.',
          'Aumenta il carico solo con tecnica stabile.',
        ],
        variations: [
          'Alzate laterali ai cavi tempo controllato',
          'Alzate laterali ai cavi con pausa',
          'Alzate laterali ai cavi eccentrica controllata',
        ],
      },
    },
  },
  {
    slug: 'dumbbell-shoulder-press',
    type: 'Strength',
    primaryMuscles: ['Shoulders'],
    secondaryMuscles: ['Triceps'],
    bodyParts: ['Upper Body'],
    equipment: ['Dumbbell', 'Bench'],
    overview:
      'Dumbbell Shoulder Press is a strength exercise designed to improve force production and control while targeting shoulders.',
    keywords: ['dumbbell', 'shoulder', 'press', 'shoulders'],
    instructions: [
      'Set up for Dumbbell Shoulder Press with stable posture and braced core.',
      'Perform each rep with controlled tempo and full range of motion.',
      'Keep target muscles under tension while avoiding compensations.',
      'Finish the set preserving technique and controlled breathing.',
    ],
    exerciseTips: [
      'Keep core active and avoid momentum-driven reps.',
      'Use full range while maintaining joint alignment.',
      'Progress load only when technique is stable.',
    ],
    variations: [
      'Tempo Dumbbell Shoulder Press',
      'Paused Dumbbell Shoulder Press',
      'Controlled Dumbbell Shoulder Press',
    ],
    translations: {
      en: {
        name: 'Dumbbell Shoulder Press',
        shortName: 'Dumbbell Shoulder Press',
        description:
          'Dumbbell Shoulder Press is a strength exercise designed to improve force production and control while targeting shoulders.',
        searchTerms: [
          'dumbbell shoulder press',
          'shoulder press manubri',
          'dumbbell',
          'shoulder',
          'press',
          'shoulders',
          'triceps',
        ],
      },
      it: {
        name: 'Shoulder press manubri',
        shortName: 'Shoulder press manubri',
        description:
          'Shoulder press manubri e un esercizio di forza pensato per migliorare produzione di forza e controllo, con focus su shoulders.',
        searchTerms: [
          'dumbbell shoulder press',
          'shoulder press manubri',
          'dumbbell',
          'shoulder',
          'press',
          'shoulders',
          'triceps',
        ],
      },
    },
    localized: {
      it: {
        instructions: [
          'Imposta Dumbbell Shoulder Press con postura stabile e core attivo.',
          'Esegui ogni ripetizione con tempo controllato e range completo.',
          'Mantieni tensione sui muscoli target evitando compensi.',
          'Concludi la serie mantenendo tecnica e respirazione controllata.',
        ],
        exerciseTips: [
          'Mantieni il core attivo ed evita ripetizioni con slancio.',
          'Usa range completo mantenendo allineamento articolare.',
          'Aumenta il carico solo con tecnica stabile.',
        ],
        variations: [
          'Shoulder press manubri tempo controllato',
          'Shoulder press manubri con pausa',
          'Shoulder press manubri eccentrica controllata',
        ],
      },
    },
  },
  {
    slug: 'barbell-curl',
    type: 'Strength',
    primaryMuscles: ['Biceps'],
    secondaryMuscles: ['Forearms'],
    bodyParts: ['Upper Body'],
    equipment: ['Barbell'],
    overview:
      'Barbell Curl is a strength exercise designed to improve force production and control while targeting biceps.',
    keywords: ['barbell', 'curl', 'biceps'],
    instructions: [
      'Set up for Barbell Curl with stable posture and braced core.',
      'Perform each rep with controlled tempo and full range of motion.',
      'Keep target muscles under tension while avoiding compensations.',
      'Finish the set preserving technique and controlled breathing.',
    ],
    exerciseTips: [
      'Keep core active and avoid momentum-driven reps.',
      'Use full range while maintaining joint alignment.',
      'Progress load only when technique is stable.',
    ],
    variations: ['Tempo Barbell Curl', 'Paused Barbell Curl', 'Controlled Barbell Curl'],
    translations: {
      en: {
        name: 'Barbell Curl',
        shortName: 'Barbell Curl',
        description:
          'Barbell Curl is a strength exercise designed to improve force production and control while targeting biceps.',
        searchTerms: [
          'barbell curl',
          'curl con bilanciere',
          'barbell',
          'curl',
          'biceps',
          'forearms',
        ],
      },
      it: {
        name: 'Curl con bilanciere',
        shortName: 'Curl con bilanciere',
        description:
          'Curl con bilanciere e un esercizio di forza pensato per migliorare produzione di forza e controllo, con focus su biceps.',
        searchTerms: [
          'barbell curl',
          'curl con bilanciere',
          'barbell',
          'curl',
          'biceps',
          'forearms',
        ],
      },
    },
    localized: {
      it: {
        instructions: [
          'Imposta Barbell Curl con postura stabile e core attivo.',
          'Esegui ogni ripetizione con tempo controllato e range completo.',
          'Mantieni tensione sui muscoli target evitando compensi.',
          'Concludi la serie mantenendo tecnica e respirazione controllata.',
        ],
        exerciseTips: [
          'Mantieni il core attivo ed evita ripetizioni con slancio.',
          'Usa range completo mantenendo allineamento articolare.',
          'Aumenta il carico solo con tecnica stabile.',
        ],
        variations: [
          'Curl con bilanciere tempo controllato',
          'Curl con bilanciere con pausa',
          'Curl con bilanciere eccentrica controllata',
        ],
      },
    },
  },
  {
    slug: 'dumbbell-curl',
    type: 'Strength',
    primaryMuscles: ['Biceps'],
    secondaryMuscles: ['Forearms'],
    bodyParts: ['Upper Body'],
    equipment: ['Dumbbell'],
    overview:
      'Dumbbell Curl is a strength exercise designed to improve force production and control while targeting biceps.',
    keywords: ['dumbbell', 'curl', 'biceps'],
    instructions: [
      'Set up for Dumbbell Curl with stable posture and braced core.',
      'Perform each rep with controlled tempo and full range of motion.',
      'Keep target muscles under tension while avoiding compensations.',
      'Finish the set preserving technique and controlled breathing.',
    ],
    exerciseTips: [
      'Keep core active and avoid momentum-driven reps.',
      'Use full range while maintaining joint alignment.',
      'Progress load only when technique is stable.',
    ],
    variations: ['Tempo Dumbbell Curl', 'Paused Dumbbell Curl', 'Controlled Dumbbell Curl'],
    translations: {
      en: {
        name: 'Dumbbell Curl',
        shortName: 'Dumbbell Curl',
        description:
          'Dumbbell Curl is a strength exercise designed to improve force production and control while targeting biceps.',
        searchTerms: [
          'dumbbell curl',
          'curl con manubri',
          'dumbbell',
          'curl',
          'biceps',
          'forearms',
        ],
      },
      it: {
        name: 'Curl con manubri',
        shortName: 'Curl con manubri',
        description:
          'Curl con manubri e un esercizio di forza pensato per migliorare produzione di forza e controllo, con focus su biceps.',
        searchTerms: [
          'dumbbell curl',
          'curl con manubri',
          'dumbbell',
          'curl',
          'biceps',
          'forearms',
        ],
      },
    },
    localized: {
      it: {
        instructions: [
          'Imposta Dumbbell Curl con postura stabile e core attivo.',
          'Esegui ogni ripetizione con tempo controllato e range completo.',
          'Mantieni tensione sui muscoli target evitando compensi.',
          'Concludi la serie mantenendo tecnica e respirazione controllata.',
        ],
        exerciseTips: [
          'Mantieni il core attivo ed evita ripetizioni con slancio.',
          'Usa range completo mantenendo allineamento articolare.',
          'Aumenta il carico solo con tecnica stabile.',
        ],
        variations: [
          'Curl con manubri tempo controllato',
          'Curl con manubri con pausa',
          'Curl con manubri eccentrica controllata',
        ],
      },
    },
  },
  {
    slug: 'hammer-curl',
    type: 'Strength',
    primaryMuscles: ['Biceps', 'Forearms'],
    secondaryMuscles: [],
    bodyParts: ['Upper Body'],
    equipment: ['Dumbbell'],
    overview:
      'Hammer Curl is a strength exercise designed to improve force production and control while targeting biceps, forearms.',
    keywords: ['hammer', 'curl', 'biceps', 'forearms'],
    instructions: [
      'Set up for Hammer Curl with stable posture and braced core.',
      'Perform each rep with controlled tempo and full range of motion.',
      'Keep target muscles under tension while avoiding compensations.',
      'Finish the set preserving technique and controlled breathing.',
    ],
    exerciseTips: [
      'Keep core active and avoid momentum-driven reps.',
      'Use full range while maintaining joint alignment.',
      'Progress load only when technique is stable.',
    ],
    variations: ['Tempo Hammer Curl', 'Paused Hammer Curl', 'Controlled Hammer Curl'],
    translations: {
      en: {
        name: 'Hammer Curl',
        shortName: 'Hammer Curl',
        description:
          'Hammer Curl is a strength exercise designed to improve force production and control while targeting biceps, forearms.',
        searchTerms: ['hammer curl', 'hammer', 'curl', 'biceps', 'forearms'],
      },
      it: {
        name: 'Hammer curl',
        shortName: 'Hammer curl',
        description:
          'Hammer curl e un esercizio di forza pensato per migliorare produzione di forza e controllo, con focus su biceps, forearms.',
        searchTerms: ['hammer curl', 'hammer', 'curl', 'biceps', 'forearms'],
      },
    },
    localized: {
      it: {
        instructions: [
          'Imposta Hammer Curl con postura stabile e core attivo.',
          'Esegui ogni ripetizione con tempo controllato e range completo.',
          'Mantieni tensione sui muscoli target evitando compensi.',
          'Concludi la serie mantenendo tecnica e respirazione controllata.',
        ],
        exerciseTips: [
          'Mantieni il core attivo ed evita ripetizioni con slancio.',
          'Usa range completo mantenendo allineamento articolare.',
          'Aumenta il carico solo con tecnica stabile.',
        ],
        variations: [
          'Hammer curl tempo controllato',
          'Hammer curl con pausa',
          'Hammer curl eccentrica controllata',
        ],
      },
    },
  },
  {
    slug: 'preacher-curl',
    type: 'Strength',
    primaryMuscles: ['Biceps'],
    secondaryMuscles: ['Forearms'],
    bodyParts: ['Upper Body'],
    equipment: ['Barbell', 'Bench'],
    overview:
      'Preacher Curl is a strength exercise designed to improve force production and control while targeting biceps.',
    keywords: ['preacher', 'curl', 'biceps'],
    instructions: [
      'Set up for Preacher Curl with stable posture and braced core.',
      'Perform each rep with controlled tempo and full range of motion.',
      'Keep target muscles under tension while avoiding compensations.',
      'Finish the set preserving technique and controlled breathing.',
    ],
    exerciseTips: [
      'Keep core active and avoid momentum-driven reps.',
      'Use full range while maintaining joint alignment.',
      'Progress load only when technique is stable.',
    ],
    variations: ['Tempo Preacher Curl', 'Paused Preacher Curl', 'Controlled Preacher Curl'],
    translations: {
      en: {
        name: 'Preacher Curl',
        shortName: 'Preacher Curl',
        description:
          'Preacher Curl is a strength exercise designed to improve force production and control while targeting biceps.',
        searchTerms: [
          'preacher curl',
          'curl panca scott',
          'preacher',
          'curl',
          'biceps',
          'forearms',
        ],
      },
      it: {
        name: 'Curl panca Scott',
        shortName: 'Curl panca Scott',
        description:
          'Curl panca Scott e un esercizio di forza pensato per migliorare produzione di forza e controllo, con focus su biceps.',
        searchTerms: [
          'preacher curl',
          'curl panca scott',
          'preacher',
          'curl',
          'biceps',
          'forearms',
        ],
      },
    },
    localized: {
      it: {
        instructions: [
          'Imposta Preacher Curl con postura stabile e core attivo.',
          'Esegui ogni ripetizione con tempo controllato e range completo.',
          'Mantieni tensione sui muscoli target evitando compensi.',
          'Concludi la serie mantenendo tecnica e respirazione controllata.',
        ],
        exerciseTips: [
          'Mantieni il core attivo ed evita ripetizioni con slancio.',
          'Usa range completo mantenendo allineamento articolare.',
          'Aumenta il carico solo con tecnica stabile.',
        ],
        variations: [
          'Curl panca Scott tempo controllato',
          'Curl panca Scott con pausa',
          'Curl panca Scott eccentrica controllata',
        ],
      },
    },
  },
  {
    slug: 'concentration-curl',
    type: 'Strength',
    primaryMuscles: ['Biceps'],
    secondaryMuscles: ['Forearms'],
    bodyParts: ['Upper Body'],
    equipment: ['Dumbbell', 'Bench'],
    overview:
      'Concentration Curl is a strength exercise designed to improve force production and control while targeting biceps.',
    keywords: ['concentration', 'curl', 'biceps'],
    instructions: [
      'Set up for Concentration Curl with stable posture and braced core.',
      'Perform each rep with controlled tempo and full range of motion.',
      'Keep target muscles under tension while avoiding compensations.',
      'Finish the set preserving technique and controlled breathing.',
    ],
    exerciseTips: [
      'Keep core active and avoid momentum-driven reps.',
      'Use full range while maintaining joint alignment.',
      'Progress load only when technique is stable.',
    ],
    variations: [
      'Tempo Concentration Curl',
      'Paused Concentration Curl',
      'Controlled Concentration Curl',
    ],
    translations: {
      en: {
        name: 'Concentration Curl',
        shortName: 'Concentration Curl',
        description:
          'Concentration Curl is a strength exercise designed to improve force production and control while targeting biceps.',
        searchTerms: [
          'concentration curl',
          'curl di concentrazione',
          'concentration',
          'curl',
          'biceps',
          'forearms',
        ],
      },
      it: {
        name: 'Curl di concentrazione',
        shortName: 'Curl di concentrazione',
        description:
          'Curl di concentrazione e un esercizio di forza pensato per migliorare produzione di forza e controllo, con focus su biceps.',
        searchTerms: [
          'concentration curl',
          'curl di concentrazione',
          'concentration',
          'curl',
          'biceps',
          'forearms',
        ],
      },
    },
    localized: {
      it: {
        instructions: [
          'Imposta Concentration Curl con postura stabile e core attivo.',
          'Esegui ogni ripetizione con tempo controllato e range completo.',
          'Mantieni tensione sui muscoli target evitando compensi.',
          'Concludi la serie mantenendo tecnica e respirazione controllata.',
        ],
        exerciseTips: [
          'Mantieni il core attivo ed evita ripetizioni con slancio.',
          'Usa range completo mantenendo allineamento articolare.',
          'Aumenta il carico solo con tecnica stabile.',
        ],
        variations: [
          'Curl di concentrazione tempo controllato',
          'Curl di concentrazione con pausa',
          'Curl di concentrazione eccentrica controllata',
        ],
      },
    },
  },
  {
    slug: 'tricep-pushdown',
    type: 'Strength',
    primaryMuscles: ['Triceps'],
    secondaryMuscles: ['Shoulders'],
    bodyParts: ['Upper Body'],
    equipment: ['Cable Machine'],
    overview:
      'Tricep Pushdown is a strength exercise designed to improve force production and control while targeting triceps.',
    keywords: ['tricep', 'pushdown', 'triceps'],
    instructions: [
      'Set up for Tricep Pushdown with stable posture and braced core.',
      'Perform each rep with controlled tempo and full range of motion.',
      'Keep target muscles under tension while avoiding compensations.',
      'Finish the set preserving technique and controlled breathing.',
    ],
    exerciseTips: [
      'Keep core active and avoid momentum-driven reps.',
      'Use full range while maintaining joint alignment.',
      'Progress load only when technique is stable.',
    ],
    variations: ['Tempo Tricep Pushdown', 'Paused Tricep Pushdown', 'Controlled Tricep Pushdown'],
    translations: {
      en: {
        name: 'Tricep Pushdown',
        shortName: 'Tricep Pushdown',
        description:
          'Tricep Pushdown is a strength exercise designed to improve force production and control while targeting triceps.',
        searchTerms: [
          'tricep pushdown',
          'pushdown tricipiti',
          'tricep',
          'pushdown',
          'triceps',
          'shoulders',
        ],
      },
      it: {
        name: 'Pushdown tricipiti',
        shortName: 'Pushdown tricipiti',
        description:
          'Pushdown tricipiti e un esercizio di forza pensato per migliorare produzione di forza e controllo, con focus su triceps.',
        searchTerms: [
          'tricep pushdown',
          'pushdown tricipiti',
          'tricep',
          'pushdown',
          'triceps',
          'shoulders',
        ],
      },
    },
    localized: {
      it: {
        instructions: [
          'Imposta Tricep Pushdown con postura stabile e core attivo.',
          'Esegui ogni ripetizione con tempo controllato e range completo.',
          'Mantieni tensione sui muscoli target evitando compensi.',
          'Concludi la serie mantenendo tecnica e respirazione controllata.',
        ],
        exerciseTips: [
          'Mantieni il core attivo ed evita ripetizioni con slancio.',
          'Usa range completo mantenendo allineamento articolare.',
          'Aumenta il carico solo con tecnica stabile.',
        ],
        variations: [
          'Pushdown tricipiti tempo controllato',
          'Pushdown tricipiti con pausa',
          'Pushdown tricipiti eccentrica controllata',
        ],
      },
    },
  },
  {
    slug: 'skull-crusher',
    type: 'Strength',
    primaryMuscles: ['Triceps'],
    secondaryMuscles: ['Shoulders'],
    bodyParts: ['Upper Body'],
    equipment: ['Barbell', 'Bench'],
    overview:
      'Skull Crusher is a strength exercise designed to improve force production and control while targeting triceps.',
    keywords: ['skull', 'crusher', 'triceps'],
    instructions: [
      'Set up for Skull Crusher with stable posture and braced core.',
      'Perform each rep with controlled tempo and full range of motion.',
      'Keep target muscles under tension while avoiding compensations.',
      'Finish the set preserving technique and controlled breathing.',
    ],
    exerciseTips: [
      'Keep core active and avoid momentum-driven reps.',
      'Use full range while maintaining joint alignment.',
      'Progress load only when technique is stable.',
    ],
    variations: ['Tempo Skull Crusher', 'Paused Skull Crusher', 'Controlled Skull Crusher'],
    translations: {
      en: {
        name: 'Skull Crusher',
        shortName: 'Skull Crusher',
        description:
          'Skull Crusher is a strength exercise designed to improve force production and control while targeting triceps.',
        searchTerms: ['skull crusher', 'french press', 'skull', 'crusher', 'triceps', 'shoulders'],
      },
      it: {
        name: 'French press',
        shortName: 'French press',
        description:
          'French press e un esercizio di forza pensato per migliorare produzione di forza e controllo, con focus su triceps.',
        searchTerms: ['skull crusher', 'french press', 'skull', 'crusher', 'triceps', 'shoulders'],
      },
    },
    localized: {
      it: {
        instructions: [
          'Imposta Skull Crusher con postura stabile e core attivo.',
          'Esegui ogni ripetizione con tempo controllato e range completo.',
          'Mantieni tensione sui muscoli target evitando compensi.',
          'Concludi la serie mantenendo tecnica e respirazione controllata.',
        ],
        exerciseTips: [
          'Mantieni il core attivo ed evita ripetizioni con slancio.',
          'Usa range completo mantenendo allineamento articolare.',
          'Aumenta il carico solo con tecnica stabile.',
        ],
        variations: [
          'French press tempo controllato',
          'French press con pausa',
          'French press eccentrica controllata',
        ],
      },
    },
  },
  {
    slug: 'overhead-tricep-extension',
    type: 'Strength',
    primaryMuscles: ['Triceps'],
    secondaryMuscles: ['Shoulders'],
    bodyParts: ['Upper Body'],
    equipment: ['Dumbbell'],
    overview:
      'Overhead Tricep Extension is a strength exercise designed to improve force production and control while targeting triceps.',
    keywords: ['overhead', 'tricep', 'extension', 'triceps'],
    instructions: [
      'Set up for Overhead Tricep Extension with stable posture and braced core.',
      'Perform each rep with controlled tempo and full range of motion.',
      'Keep target muscles under tension while avoiding compensations.',
      'Finish the set preserving technique and controlled breathing.',
    ],
    exerciseTips: [
      'Keep core active and avoid momentum-driven reps.',
      'Use full range while maintaining joint alignment.',
      'Progress load only when technique is stable.',
    ],
    variations: [
      'Tempo Overhead Tricep Extension',
      'Paused Overhead Tricep Extension',
      'Controlled Overhead Tricep Extension',
    ],
    translations: {
      en: {
        name: 'Overhead Tricep Extension',
        shortName: 'Overhead Tricep Extension',
        description:
          'Overhead Tricep Extension is a strength exercise designed to improve force production and control while targeting triceps.',
        searchTerms: [
          'overhead tricep extension',
          'estensione tricipiti sopra la testa',
          'overhead',
          'tricep',
          'extension',
          'triceps',
          'shoulders',
        ],
      },
      it: {
        name: 'Estensione tricipiti sopra la testa',
        shortName: 'Estensione tricipiti sopra l',
        description:
          'Estensione tricipiti sopra la testa e un esercizio di forza pensato per migliorare produzione di forza e controllo, con focus su triceps.',
        searchTerms: [
          'overhead tricep extension',
          'estensione tricipiti sopra la testa',
          'overhead',
          'tricep',
          'extension',
          'triceps',
          'shoulders',
        ],
      },
    },
    localized: {
      it: {
        instructions: [
          'Imposta Overhead Tricep Extension con postura stabile e core attivo.',
          'Esegui ogni ripetizione con tempo controllato e range completo.',
          'Mantieni tensione sui muscoli target evitando compensi.',
          'Concludi la serie mantenendo tecnica e respirazione controllata.',
        ],
        exerciseTips: [
          'Mantieni il core attivo ed evita ripetizioni con slancio.',
          'Usa range completo mantenendo allineamento articolare.',
          'Aumenta il carico solo con tecnica stabile.',
        ],
        variations: [
          'Estensione tricipiti sopra la testa tempo controllato',
          'Estensione tricipiti sopra la testa con pausa',
          'Estensione tricipiti sopra la testa eccentrica controllata',
        ],
      },
    },
  },
  {
    slug: 'close-grip-bench-press',
    type: 'Strength',
    primaryMuscles: ['Triceps'],
    secondaryMuscles: ['Chest', 'Shoulders'],
    bodyParts: ['Upper Body'],
    equipment: ['Barbell', 'Bench'],
    overview:
      'Close-Grip Bench Press is a strength exercise designed to improve force production and control while targeting triceps.',
    keywords: ['close', 'grip', 'bench', 'press', 'triceps'],
    instructions: [
      'Set up for Close-Grip Bench Press with stable posture and braced core.',
      'Perform each rep with controlled tempo and full range of motion.',
      'Keep target muscles under tension while avoiding compensations.',
      'Finish the set preserving technique and controlled breathing.',
    ],
    exerciseTips: [
      'Keep core active and avoid momentum-driven reps.',
      'Use full range while maintaining joint alignment.',
      'Progress load only when technique is stable.',
    ],
    variations: [
      'Tempo Close-Grip Bench Press',
      'Paused Close-Grip Bench Press',
      'Controlled Close-Grip Bench Press',
    ],
    translations: {
      en: {
        name: 'Close-Grip Bench Press',
        shortName: 'Close-Grip Bench Press',
        description:
          'Close-Grip Bench Press is a strength exercise designed to improve force production and control while targeting triceps.',
        searchTerms: [
          'close-grip bench press',
          'panca presa stretta',
          'close grip bench press',
          'close',
          'grip',
          'bench',
          'press',
          'triceps',
          'chest',
          'shoulders',
        ],
      },
      it: {
        name: 'Panca presa stretta',
        shortName: 'Panca presa stretta',
        description:
          'Panca presa stretta e un esercizio di forza pensato per migliorare produzione di forza e controllo, con focus su triceps.',
        searchTerms: [
          'close-grip bench press',
          'panca presa stretta',
          'close grip bench press',
          'close',
          'grip',
          'bench',
          'press',
          'triceps',
          'chest',
          'shoulders',
        ],
      },
    },
    localized: {
      it: {
        instructions: [
          'Imposta Close-Grip Bench Press con postura stabile e core attivo.',
          'Esegui ogni ripetizione con tempo controllato e range completo.',
          'Mantieni tensione sui muscoli target evitando compensi.',
          'Concludi la serie mantenendo tecnica e respirazione controllata.',
        ],
        exerciseTips: [
          'Mantieni il core attivo ed evita ripetizioni con slancio.',
          'Usa range completo mantenendo allineamento articolare.',
          'Aumenta il carico solo con tecnica stabile.',
        ],
        variations: [
          'Panca presa stretta tempo controllato',
          'Panca presa stretta con pausa',
          'Panca presa stretta eccentrica controllata',
        ],
      },
    },
  },
  {
    slug: 'tricep-dip',
    type: 'Strength',
    primaryMuscles: ['Triceps'],
    secondaryMuscles: ['Shoulders', 'Chest'],
    bodyParts: ['Upper Body'],
    equipment: ['Bodyweight'],
    overview:
      'Tricep Dip is a strength exercise designed to improve force production and control while targeting triceps.',
    keywords: ['tricep', 'dip', 'triceps'],
    instructions: [
      'Set up for Tricep Dip with stable posture and braced core.',
      'Perform each rep with controlled tempo and full range of motion.',
      'Keep target muscles under tension while avoiding compensations.',
      'Finish the set preserving technique and controlled breathing.',
    ],
    exerciseTips: [
      'Keep core active and avoid momentum-driven reps.',
      'Use full range while maintaining joint alignment.',
      'Progress load only when technique is stable.',
    ],
    variations: ['Tempo Tricep Dip', 'Paused Tricep Dip', 'Controlled Tricep Dip'],
    translations: {
      en: {
        name: 'Tricep Dip',
        shortName: 'Tricep Dip',
        description:
          'Tricep Dip is a strength exercise designed to improve force production and control while targeting triceps.',
        searchTerms: [
          'tricep dip',
          'dip tricipiti',
          'tricep',
          'dip',
          'triceps',
          'shoulders',
          'chest',
        ],
      },
      it: {
        name: 'Dip tricipiti',
        shortName: 'Dip tricipiti',
        description:
          'Dip tricipiti e un esercizio di forza pensato per migliorare produzione di forza e controllo, con focus su triceps.',
        searchTerms: [
          'tricep dip',
          'dip tricipiti',
          'tricep',
          'dip',
          'triceps',
          'shoulders',
          'chest',
        ],
      },
    },
    localized: {
      it: {
        instructions: [
          'Imposta Tricep Dip con postura stabile e core attivo.',
          'Esegui ogni ripetizione con tempo controllato e range completo.',
          'Mantieni tensione sui muscoli target evitando compensi.',
          'Concludi la serie mantenendo tecnica e respirazione controllata.',
        ],
        exerciseTips: [
          'Mantieni il core attivo ed evita ripetizioni con slancio.',
          'Usa range completo mantenendo allineamento articolare.',
          'Aumenta il carico solo con tecnica stabile.',
        ],
        variations: [
          'Dip tricipiti tempo controllato',
          'Dip tricipiti con pausa',
          'Dip tricipiti eccentrica controllata',
        ],
      },
    },
  },
  {
    slug: 'squat',
    type: 'Strength',
    primaryMuscles: ['Quadriceps'],
    secondaryMuscles: ['Glutes', 'Hamstrings'],
    bodyParts: ['Lower Body'],
    equipment: ['Barbell'],
    overview:
      'Squat is a strength exercise designed to improve force production and control while targeting quadriceps.',
    keywords: ['squat', 'quadriceps'],
    instructions: [
      'Set up for Squat with stable posture and braced core.',
      'Perform each rep with controlled tempo and full range of motion.',
      'Keep target muscles under tension while avoiding compensations.',
      'Finish the set preserving technique and controlled breathing.',
    ],
    exerciseTips: [
      'Keep core active and avoid momentum-driven reps.',
      'Use full range while maintaining joint alignment.',
      'Progress load only when technique is stable.',
    ],
    variations: ['Tempo Squat', 'Paused Squat', 'Controlled Squat'],
    translations: {
      en: {
        name: 'Squat',
        shortName: 'Squat',
        description:
          'Squat is a strength exercise designed to improve force production and control while targeting quadriceps.',
        searchTerms: ['squat', 'quadriceps', 'glutes', 'hamstrings'],
      },
      it: {
        name: 'Squat',
        shortName: 'Squat',
        description:
          'Squat e un esercizio di forza pensato per migliorare produzione di forza e controllo, con focus su quadriceps.',
        searchTerms: ['squat', 'quadriceps', 'glutes', 'hamstrings'],
      },
    },
    localized: {
      it: {
        instructions: [
          'Imposta Squat con postura stabile e core attivo.',
          'Esegui ogni ripetizione con tempo controllato e range completo.',
          'Mantieni tensione sui muscoli target evitando compensi.',
          'Concludi la serie mantenendo tecnica e respirazione controllata.',
        ],
        exerciseTips: [
          'Mantieni il core attivo ed evita ripetizioni con slancio.',
          'Usa range completo mantenendo allineamento articolare.',
          'Aumenta il carico solo con tecnica stabile.',
        ],
        variations: ['Squat tempo controllato', 'Squat con pausa', 'Squat eccentrica controllata'],
      },
    },
  },
  {
    slug: 'front-squat',
    type: 'Strength',
    primaryMuscles: ['Quadriceps'],
    secondaryMuscles: ['Abs', 'Glutes'],
    bodyParts: ['Lower Body'],
    equipment: ['Barbell'],
    overview:
      'Front Squat is a strength exercise designed to improve force production and control while targeting quadriceps.',
    keywords: ['front', 'squat', 'quadriceps'],
    instructions: [
      'Set up for Front Squat with stable posture and braced core.',
      'Perform each rep with controlled tempo and full range of motion.',
      'Keep target muscles under tension while avoiding compensations.',
      'Finish the set preserving technique and controlled breathing.',
    ],
    exerciseTips: [
      'Keep core active and avoid momentum-driven reps.',
      'Use full range while maintaining joint alignment.',
      'Progress load only when technique is stable.',
    ],
    variations: ['Tempo Front Squat', 'Paused Front Squat', 'Controlled Front Squat'],
    translations: {
      en: {
        name: 'Front Squat',
        shortName: 'Front Squat',
        description:
          'Front Squat is a strength exercise designed to improve force production and control while targeting quadriceps.',
        searchTerms: ['front squat', 'front', 'squat', 'quadriceps', 'abs', 'glutes'],
      },
      it: {
        name: 'Front squat',
        shortName: 'Front squat',
        description:
          'Front squat e un esercizio di forza pensato per migliorare produzione di forza e controllo, con focus su quadriceps.',
        searchTerms: ['front squat', 'front', 'squat', 'quadriceps', 'abs', 'glutes'],
      },
    },
    localized: {
      it: {
        instructions: [
          'Imposta Front Squat con postura stabile e core attivo.',
          'Esegui ogni ripetizione con tempo controllato e range completo.',
          'Mantieni tensione sui muscoli target evitando compensi.',
          'Concludi la serie mantenendo tecnica e respirazione controllata.',
        ],
        exerciseTips: [
          'Mantieni il core attivo ed evita ripetizioni con slancio.',
          'Usa range completo mantenendo allineamento articolare.',
          'Aumenta il carico solo con tecnica stabile.',
        ],
        variations: [
          'Front squat tempo controllato',
          'Front squat con pausa',
          'Front squat eccentrica controllata',
        ],
      },
    },
  },
  {
    slug: 'leg-press',
    type: 'Strength',
    primaryMuscles: ['Quadriceps'],
    secondaryMuscles: ['Glutes', 'Hamstrings'],
    bodyParts: ['Lower Body'],
    equipment: ['Cable Machine'],
    overview:
      'Leg Press is a strength exercise designed to improve force production and control while targeting quadriceps.',
    keywords: ['leg', 'press', 'quadriceps'],
    instructions: [
      'Set up for Leg Press with stable posture and braced core.',
      'Perform each rep with controlled tempo and full range of motion.',
      'Keep target muscles under tension while avoiding compensations.',
      'Finish the set preserving technique and controlled breathing.',
    ],
    exerciseTips: [
      'Keep core active and avoid momentum-driven reps.',
      'Use full range while maintaining joint alignment.',
      'Progress load only when technique is stable.',
    ],
    variations: ['Tempo Leg Press', 'Paused Leg Press', 'Controlled Leg Press'],
    translations: {
      en: {
        name: 'Leg Press',
        shortName: 'Leg Press',
        description:
          'Leg Press is a strength exercise designed to improve force production and control while targeting quadriceps.',
        searchTerms: ['leg press', 'leg', 'press', 'quadriceps', 'glutes', 'hamstrings'],
      },
      it: {
        name: 'Leg press',
        shortName: 'Leg press',
        description:
          'Leg press e un esercizio di forza pensato per migliorare produzione di forza e controllo, con focus su quadriceps.',
        searchTerms: ['leg press', 'leg', 'press', 'quadriceps', 'glutes', 'hamstrings'],
      },
    },
    localized: {
      it: {
        instructions: [
          'Imposta Leg Press con postura stabile e core attivo.',
          'Esegui ogni ripetizione con tempo controllato e range completo.',
          'Mantieni tensione sui muscoli target evitando compensi.',
          'Concludi la serie mantenendo tecnica e respirazione controllata.',
        ],
        exerciseTips: [
          'Mantieni il core attivo ed evita ripetizioni con slancio.',
          'Usa range completo mantenendo allineamento articolare.',
          'Aumenta il carico solo con tecnica stabile.',
        ],
        variations: [
          'Leg press tempo controllato',
          'Leg press con pausa',
          'Leg press eccentrica controllata',
        ],
      },
    },
  },
  {
    slug: 'leg-extension',
    type: 'Strength',
    primaryMuscles: ['Quadriceps'],
    secondaryMuscles: [],
    bodyParts: ['Lower Body'],
    equipment: ['Cable Machine'],
    overview:
      'Leg Extension is a strength exercise designed to improve force production and control while targeting quadriceps.',
    keywords: ['leg', 'extension', 'quadriceps'],
    instructions: [
      'Set up for Leg Extension with stable posture and braced core.',
      'Perform each rep with controlled tempo and full range of motion.',
      'Keep target muscles under tension while avoiding compensations.',
      'Finish the set preserving technique and controlled breathing.',
    ],
    exerciseTips: [
      'Keep core active and avoid momentum-driven reps.',
      'Use full range while maintaining joint alignment.',
      'Progress load only when technique is stable.',
    ],
    variations: ['Tempo Leg Extension', 'Paused Leg Extension', 'Controlled Leg Extension'],
    translations: {
      en: {
        name: 'Leg Extension',
        shortName: 'Leg Extension',
        description:
          'Leg Extension is a strength exercise designed to improve force production and control while targeting quadriceps.',
        searchTerms: ['leg extension', 'leg', 'extension', 'quadriceps'],
      },
      it: {
        name: 'Leg extension',
        shortName: 'Leg extension',
        description:
          'Leg extension e un esercizio di forza pensato per migliorare produzione di forza e controllo, con focus su quadriceps.',
        searchTerms: ['leg extension', 'leg', 'extension', 'quadriceps'],
      },
    },
    localized: {
      it: {
        instructions: [
          'Imposta Leg Extension con postura stabile e core attivo.',
          'Esegui ogni ripetizione con tempo controllato e range completo.',
          'Mantieni tensione sui muscoli target evitando compensi.',
          'Concludi la serie mantenendo tecnica e respirazione controllata.',
        ],
        exerciseTips: [
          'Mantieni il core attivo ed evita ripetizioni con slancio.',
          'Usa range completo mantenendo allineamento articolare.',
          'Aumenta il carico solo con tecnica stabile.',
        ],
        variations: [
          'Leg extension tempo controllato',
          'Leg extension con pausa',
          'Leg extension eccentrica controllata',
        ],
      },
    },
  },
  {
    slug: 'bulgarian-split-squat',
    type: 'Strength',
    primaryMuscles: ['Quadriceps'],
    secondaryMuscles: ['Glutes', 'Hamstrings'],
    bodyParts: ['Lower Body'],
    equipment: ['Dumbbell', 'Bench'],
    overview:
      'Bulgarian Split Squat is a strength exercise designed to improve force production and control while targeting quadriceps.',
    keywords: ['bulgarian', 'split', 'squat', 'quadriceps'],
    instructions: [
      'Set up for Bulgarian Split Squat with stable posture and braced core.',
      'Perform each rep with controlled tempo and full range of motion.',
      'Keep target muscles under tension while avoiding compensations.',
      'Finish the set preserving technique and controlled breathing.',
    ],
    exerciseTips: [
      'Keep core active and avoid momentum-driven reps.',
      'Use full range while maintaining joint alignment.',
      'Progress load only when technique is stable.',
    ],
    variations: [
      'Tempo Bulgarian Split Squat',
      'Paused Bulgarian Split Squat',
      'Controlled Bulgarian Split Squat',
    ],
    translations: {
      en: {
        name: 'Bulgarian Split Squat',
        shortName: 'Bulgarian Split Squat',
        description:
          'Bulgarian Split Squat is a strength exercise designed to improve force production and control while targeting quadriceps.',
        searchTerms: [
          'bulgarian split squat',
          'bulgarian',
          'split',
          'squat',
          'quadriceps',
          'glutes',
          'hamstrings',
        ],
      },
      it: {
        name: 'Bulgarian split squat',
        shortName: 'Bulgarian split squat',
        description:
          'Bulgarian split squat e un esercizio di forza pensato per migliorare produzione di forza e controllo, con focus su quadriceps.',
        searchTerms: [
          'bulgarian split squat',
          'bulgarian',
          'split',
          'squat',
          'quadriceps',
          'glutes',
          'hamstrings',
        ],
      },
    },
    localized: {
      it: {
        instructions: [
          'Imposta Bulgarian Split Squat con postura stabile e core attivo.',
          'Esegui ogni ripetizione con tempo controllato e range completo.',
          'Mantieni tensione sui muscoli target evitando compensi.',
          'Concludi la serie mantenendo tecnica e respirazione controllata.',
        ],
        exerciseTips: [
          'Mantieni il core attivo ed evita ripetizioni con slancio.',
          'Usa range completo mantenendo allineamento articolare.',
          'Aumenta il carico solo con tecnica stabile.',
        ],
        variations: [
          'Bulgarian split squat tempo controllato',
          'Bulgarian split squat con pausa',
          'Bulgarian split squat eccentrica controllata',
        ],
      },
    },
  },
  {
    slug: 'hack-squat',
    type: 'Strength',
    primaryMuscles: ['Quadriceps'],
    secondaryMuscles: ['Glutes'],
    bodyParts: ['Lower Body'],
    equipment: ['Cable Machine'],
    overview:
      'Hack Squat is a strength exercise designed to improve force production and control while targeting quadriceps.',
    keywords: ['hack', 'squat', 'quadriceps'],
    instructions: [
      'Set up for Hack Squat with stable posture and braced core.',
      'Perform each rep with controlled tempo and full range of motion.',
      'Keep target muscles under tension while avoiding compensations.',
      'Finish the set preserving technique and controlled breathing.',
    ],
    exerciseTips: [
      'Keep core active and avoid momentum-driven reps.',
      'Use full range while maintaining joint alignment.',
      'Progress load only when technique is stable.',
    ],
    variations: ['Tempo Hack Squat', 'Paused Hack Squat', 'Controlled Hack Squat'],
    translations: {
      en: {
        name: 'Hack Squat',
        shortName: 'Hack Squat',
        description:
          'Hack Squat is a strength exercise designed to improve force production and control while targeting quadriceps.',
        searchTerms: ['hack squat', 'hack', 'squat', 'quadriceps', 'glutes'],
      },
      it: {
        name: 'Hack squat',
        shortName: 'Hack squat',
        description:
          'Hack squat e un esercizio di forza pensato per migliorare produzione di forza e controllo, con focus su quadriceps.',
        searchTerms: ['hack squat', 'hack', 'squat', 'quadriceps', 'glutes'],
      },
    },
    localized: {
      it: {
        instructions: [
          'Imposta Hack Squat con postura stabile e core attivo.',
          'Esegui ogni ripetizione con tempo controllato e range completo.',
          'Mantieni tensione sui muscoli target evitando compensi.',
          'Concludi la serie mantenendo tecnica e respirazione controllata.',
        ],
        exerciseTips: [
          'Mantieni il core attivo ed evita ripetizioni con slancio.',
          'Usa range completo mantenendo allineamento articolare.',
          'Aumenta il carico solo con tecnica stabile.',
        ],
        variations: [
          'Hack squat tempo controllato',
          'Hack squat con pausa',
          'Hack squat eccentrica controllata',
        ],
      },
    },
  },
  {
    slug: 'goblet-squat',
    type: 'Strength',
    primaryMuscles: ['Quadriceps'],
    secondaryMuscles: ['Glutes', 'Abs'],
    bodyParts: ['Lower Body'],
    equipment: ['Dumbbell'],
    overview:
      'Goblet Squat is a strength exercise designed to improve force production and control while targeting quadriceps.',
    keywords: ['goblet', 'squat', 'quadriceps'],
    instructions: [
      'Set up for Goblet Squat with stable posture and braced core.',
      'Perform each rep with controlled tempo and full range of motion.',
      'Keep target muscles under tension while avoiding compensations.',
      'Finish the set preserving technique and controlled breathing.',
    ],
    exerciseTips: [
      'Keep core active and avoid momentum-driven reps.',
      'Use full range while maintaining joint alignment.',
      'Progress load only when technique is stable.',
    ],
    variations: ['Tempo Goblet Squat', 'Paused Goblet Squat', 'Controlled Goblet Squat'],
    translations: {
      en: {
        name: 'Goblet Squat',
        shortName: 'Goblet Squat',
        description:
          'Goblet Squat is a strength exercise designed to improve force production and control while targeting quadriceps.',
        searchTerms: ['goblet squat', 'goblet', 'squat', 'quadriceps', 'glutes', 'abs'],
      },
      it: {
        name: 'Goblet squat',
        shortName: 'Goblet squat',
        description:
          'Goblet squat e un esercizio di forza pensato per migliorare produzione di forza e controllo, con focus su quadriceps.',
        searchTerms: ['goblet squat', 'goblet', 'squat', 'quadriceps', 'glutes', 'abs'],
      },
    },
    localized: {
      it: {
        instructions: [
          'Imposta Goblet Squat con postura stabile e core attivo.',
          'Esegui ogni ripetizione con tempo controllato e range completo.',
          'Mantieni tensione sui muscoli target evitando compensi.',
          'Concludi la serie mantenendo tecnica e respirazione controllata.',
        ],
        exerciseTips: [
          'Mantieni il core attivo ed evita ripetizioni con slancio.',
          'Usa range completo mantenendo allineamento articolare.',
          'Aumenta il carico solo con tecnica stabile.',
        ],
        variations: [
          'Goblet squat tempo controllato',
          'Goblet squat con pausa',
          'Goblet squat eccentrica controllata',
        ],
      },
    },
  },
  {
    slug: 'walking-lunge',
    type: 'Strength',
    primaryMuscles: ['Quadriceps'],
    secondaryMuscles: ['Glutes', 'Hamstrings'],
    bodyParts: ['Lower Body'],
    equipment: ['Dumbbell'],
    overview:
      'Walking Lunge is a strength exercise designed to improve force production and control while targeting quadriceps.',
    keywords: ['walking', 'lunge', 'quadriceps'],
    instructions: [
      'Set up for Walking Lunge with stable posture and braced core.',
      'Perform each rep with controlled tempo and full range of motion.',
      'Keep target muscles under tension while avoiding compensations.',
      'Finish the set preserving technique and controlled breathing.',
    ],
    exerciseTips: [
      'Keep core active and avoid momentum-driven reps.',
      'Use full range while maintaining joint alignment.',
      'Progress load only when technique is stable.',
    ],
    variations: ['Tempo Walking Lunge', 'Paused Walking Lunge', 'Controlled Walking Lunge'],
    translations: {
      en: {
        name: 'Walking Lunge',
        shortName: 'Walking Lunge',
        description:
          'Walking Lunge is a strength exercise designed to improve force production and control while targeting quadriceps.',
        searchTerms: [
          'walking lunge',
          'affondi camminati',
          'walking',
          'lunge',
          'quadriceps',
          'glutes',
          'hamstrings',
        ],
      },
      it: {
        name: 'Affondi camminati',
        shortName: 'Affondi camminati',
        description:
          'Affondi camminati e un esercizio di forza pensato per migliorare produzione di forza e controllo, con focus su quadriceps.',
        searchTerms: [
          'walking lunge',
          'affondi camminati',
          'walking',
          'lunge',
          'quadriceps',
          'glutes',
          'hamstrings',
        ],
      },
    },
    localized: {
      it: {
        instructions: [
          'Imposta Walking Lunge con postura stabile e core attivo.',
          'Esegui ogni ripetizione con tempo controllato e range completo.',
          'Mantieni tensione sui muscoli target evitando compensi.',
          'Concludi la serie mantenendo tecnica e respirazione controllata.',
        ],
        exerciseTips: [
          'Mantieni il core attivo ed evita ripetizioni con slancio.',
          'Usa range completo mantenendo allineamento articolare.',
          'Aumenta il carico solo con tecnica stabile.',
        ],
        variations: [
          'Affondi camminati tempo controllato',
          'Affondi camminati con pausa',
          'Affondi camminati eccentrica controllata',
        ],
      },
    },
  },
  {
    slug: 'romanian-deadlift',
    type: 'Strength',
    primaryMuscles: ['Hamstrings'],
    secondaryMuscles: ['Glutes', 'Back'],
    bodyParts: ['Lower Body'],
    equipment: ['Barbell'],
    overview:
      'Romanian Deadlift is a strength exercise designed to improve force production and control while targeting hamstrings.',
    keywords: ['romanian', 'deadlift', 'hamstrings'],
    instructions: [
      'Set up for Romanian Deadlift with stable posture and braced core.',
      'Perform each rep with controlled tempo and full range of motion.',
      'Keep target muscles under tension while avoiding compensations.',
      'Finish the set preserving technique and controlled breathing.',
    ],
    exerciseTips: [
      'Keep core active and avoid momentum-driven reps.',
      'Use full range while maintaining joint alignment.',
      'Progress load only when technique is stable.',
    ],
    variations: [
      'Tempo Romanian Deadlift',
      'Paused Romanian Deadlift',
      'Controlled Romanian Deadlift',
    ],
    translations: {
      en: {
        name: 'Romanian Deadlift',
        shortName: 'Romanian Deadlift',
        description:
          'Romanian Deadlift is a strength exercise designed to improve force production and control while targeting hamstrings.',
        searchTerms: [
          'romanian deadlift',
          'stacco rumeno',
          'romanian',
          'deadlift',
          'hamstrings',
          'glutes',
          'back',
        ],
      },
      it: {
        name: 'Stacco rumeno',
        shortName: 'Stacco rumeno',
        description:
          'Stacco rumeno e un esercizio di forza pensato per migliorare produzione di forza e controllo, con focus su hamstrings.',
        searchTerms: [
          'romanian deadlift',
          'stacco rumeno',
          'romanian',
          'deadlift',
          'hamstrings',
          'glutes',
          'back',
        ],
      },
    },
    localized: {
      it: {
        instructions: [
          'Imposta Romanian Deadlift con postura stabile e core attivo.',
          'Esegui ogni ripetizione con tempo controllato e range completo.',
          'Mantieni tensione sui muscoli target evitando compensi.',
          'Concludi la serie mantenendo tecnica e respirazione controllata.',
        ],
        exerciseTips: [
          'Mantieni il core attivo ed evita ripetizioni con slancio.',
          'Usa range completo mantenendo allineamento articolare.',
          'Aumenta il carico solo con tecnica stabile.',
        ],
        variations: [
          'Stacco rumeno tempo controllato',
          'Stacco rumeno con pausa',
          'Stacco rumeno eccentrica controllata',
        ],
      },
    },
  },
  {
    slug: 'leg-curl',
    type: 'Strength',
    primaryMuscles: ['Hamstrings'],
    secondaryMuscles: ['Calves'],
    bodyParts: ['Lower Body'],
    equipment: ['Cable Machine'],
    overview:
      'Leg Curl is a strength exercise designed to improve force production and control while targeting hamstrings.',
    keywords: ['leg', 'curl', 'hamstrings'],
    instructions: [
      'Set up for Leg Curl with stable posture and braced core.',
      'Perform each rep with controlled tempo and full range of motion.',
      'Keep target muscles under tension while avoiding compensations.',
      'Finish the set preserving technique and controlled breathing.',
    ],
    exerciseTips: [
      'Keep core active and avoid momentum-driven reps.',
      'Use full range while maintaining joint alignment.',
      'Progress load only when technique is stable.',
    ],
    variations: ['Tempo Leg Curl', 'Paused Leg Curl', 'Controlled Leg Curl'],
    translations: {
      en: {
        name: 'Leg Curl',
        shortName: 'Leg Curl',
        description:
          'Leg Curl is a strength exercise designed to improve force production and control while targeting hamstrings.',
        searchTerms: ['leg curl', 'leg', 'curl', 'hamstrings', 'calves'],
      },
      it: {
        name: 'Leg curl',
        shortName: 'Leg curl',
        description:
          'Leg curl e un esercizio di forza pensato per migliorare produzione di forza e controllo, con focus su hamstrings.',
        searchTerms: ['leg curl', 'leg', 'curl', 'hamstrings', 'calves'],
      },
    },
    localized: {
      it: {
        instructions: [
          'Imposta Leg Curl con postura stabile e core attivo.',
          'Esegui ogni ripetizione con tempo controllato e range completo.',
          'Mantieni tensione sui muscoli target evitando compensi.',
          'Concludi la serie mantenendo tecnica e respirazione controllata.',
        ],
        exerciseTips: [
          'Mantieni il core attivo ed evita ripetizioni con slancio.',
          'Usa range completo mantenendo allineamento articolare.',
          'Aumenta il carico solo con tecnica stabile.',
        ],
        variations: [
          'Leg curl tempo controllato',
          'Leg curl con pausa',
          'Leg curl eccentrica controllata',
        ],
      },
    },
  },
  {
    slug: 'nordic-curl',
    type: 'Strength',
    primaryMuscles: ['Hamstrings'],
    secondaryMuscles: ['Glutes'],
    bodyParts: ['Lower Body'],
    equipment: ['Bodyweight'],
    overview:
      'Nordic Curl is a strength exercise designed to improve force production and control while targeting hamstrings.',
    keywords: ['nordic', 'curl', 'hamstrings'],
    instructions: [
      'Set up for Nordic Curl with stable posture and braced core.',
      'Perform each rep with controlled tempo and full range of motion.',
      'Keep target muscles under tension while avoiding compensations.',
      'Finish the set preserving technique and controlled breathing.',
    ],
    exerciseTips: [
      'Keep core active and avoid momentum-driven reps.',
      'Use full range while maintaining joint alignment.',
      'Progress load only when technique is stable.',
    ],
    variations: ['Tempo Nordic Curl', 'Paused Nordic Curl', 'Controlled Nordic Curl'],
    translations: {
      en: {
        name: 'Nordic Curl',
        shortName: 'Nordic Curl',
        description:
          'Nordic Curl is a strength exercise designed to improve force production and control while targeting hamstrings.',
        searchTerms: ['nordic curl', 'nordic', 'curl', 'hamstrings', 'glutes'],
      },
      it: {
        name: 'Nordic curl',
        shortName: 'Nordic curl',
        description:
          'Nordic curl e un esercizio di forza pensato per migliorare produzione di forza e controllo, con focus su hamstrings.',
        searchTerms: ['nordic curl', 'nordic', 'curl', 'hamstrings', 'glutes'],
      },
    },
    localized: {
      it: {
        instructions: [
          'Imposta Nordic Curl con postura stabile e core attivo.',
          'Esegui ogni ripetizione con tempo controllato e range completo.',
          'Mantieni tensione sui muscoli target evitando compensi.',
          'Concludi la serie mantenendo tecnica e respirazione controllata.',
        ],
        exerciseTips: [
          'Mantieni il core attivo ed evita ripetizioni con slancio.',
          'Usa range completo mantenendo allineamento articolare.',
          'Aumenta il carico solo con tecnica stabile.',
        ],
        variations: [
          'Nordic curl tempo controllato',
          'Nordic curl con pausa',
          'Nordic curl eccentrica controllata',
        ],
      },
    },
  },
  {
    slug: 'good-morning',
    type: 'Strength',
    primaryMuscles: ['Hamstrings', 'Back'],
    secondaryMuscles: ['Glutes'],
    bodyParts: ['Lower Body'],
    equipment: ['Barbell'],
    overview:
      'Good Morning is a strength exercise designed to improve force production and control while targeting hamstrings, back.',
    keywords: ['good', 'morning', 'hamstrings', 'back'],
    instructions: [
      'Set up for Good Morning with stable posture and braced core.',
      'Perform each rep with controlled tempo and full range of motion.',
      'Keep target muscles under tension while avoiding compensations.',
      'Finish the set preserving technique and controlled breathing.',
    ],
    exerciseTips: [
      'Keep core active and avoid momentum-driven reps.',
      'Use full range while maintaining joint alignment.',
      'Progress load only when technique is stable.',
    ],
    variations: ['Tempo Good Morning', 'Paused Good Morning', 'Controlled Good Morning'],
    translations: {
      en: {
        name: 'Good Morning',
        shortName: 'Good Morning',
        description:
          'Good Morning is a strength exercise designed to improve force production and control while targeting hamstrings, back.',
        searchTerms: ['good morning', 'good', 'morning', 'hamstrings', 'back', 'glutes'],
      },
      it: {
        name: 'Good morning',
        shortName: 'Good morning',
        description:
          'Good morning e un esercizio di forza pensato per migliorare produzione di forza e controllo, con focus su hamstrings, back.',
        searchTerms: ['good morning', 'good', 'morning', 'hamstrings', 'back', 'glutes'],
      },
    },
    localized: {
      it: {
        instructions: [
          'Imposta Good Morning con postura stabile e core attivo.',
          'Esegui ogni ripetizione con tempo controllato e range completo.',
          'Mantieni tensione sui muscoli target evitando compensi.',
          'Concludi la serie mantenendo tecnica e respirazione controllata.',
        ],
        exerciseTips: [
          'Mantieni il core attivo ed evita ripetizioni con slancio.',
          'Usa range completo mantenendo allineamento articolare.',
          'Aumenta il carico solo con tecnica stabile.',
        ],
        variations: [
          'Good morning tempo controllato',
          'Good morning con pausa',
          'Good morning eccentrica controllata',
        ],
      },
    },
  },
  {
    slug: 'stiff-leg-deadlift',
    type: 'Strength',
    primaryMuscles: ['Hamstrings'],
    secondaryMuscles: ['Glutes', 'Back'],
    bodyParts: ['Lower Body'],
    equipment: ['Barbell'],
    overview:
      'Stiff-Leg Deadlift is a strength exercise designed to improve force production and control while targeting hamstrings.',
    keywords: ['stiff', 'leg', 'deadlift', 'hamstrings'],
    instructions: [
      'Set up for Stiff-Leg Deadlift with stable posture and braced core.',
      'Perform each rep with controlled tempo and full range of motion.',
      'Keep target muscles under tension while avoiding compensations.',
      'Finish the set preserving technique and controlled breathing.',
    ],
    exerciseTips: [
      'Keep core active and avoid momentum-driven reps.',
      'Use full range while maintaining joint alignment.',
      'Progress load only when technique is stable.',
    ],
    variations: [
      'Tempo Stiff-Leg Deadlift',
      'Paused Stiff-Leg Deadlift',
      'Controlled Stiff-Leg Deadlift',
    ],
    translations: {
      en: {
        name: 'Stiff-Leg Deadlift',
        shortName: 'Stiff-Leg Deadlift',
        description:
          'Stiff-Leg Deadlift is a strength exercise designed to improve force production and control while targeting hamstrings.',
        searchTerms: [
          'stiff-leg deadlift',
          'stacco gambe tese',
          'stiff leg deadlift',
          'stiff',
          'leg',
          'deadlift',
          'hamstrings',
          'glutes',
          'back',
        ],
      },
      it: {
        name: 'Stacco gambe tese',
        shortName: 'Stacco gambe tese',
        description:
          'Stacco gambe tese e un esercizio di forza pensato per migliorare produzione di forza e controllo, con focus su hamstrings.',
        searchTerms: [
          'stiff-leg deadlift',
          'stacco gambe tese',
          'stiff leg deadlift',
          'stiff',
          'leg',
          'deadlift',
          'hamstrings',
          'glutes',
          'back',
        ],
      },
    },
    localized: {
      it: {
        instructions: [
          'Imposta Stiff-Leg Deadlift con postura stabile e core attivo.',
          'Esegui ogni ripetizione con tempo controllato e range completo.',
          'Mantieni tensione sui muscoli target evitando compensi.',
          'Concludi la serie mantenendo tecnica e respirazione controllata.',
        ],
        exerciseTips: [
          'Mantieni il core attivo ed evita ripetizioni con slancio.',
          'Usa range completo mantenendo allineamento articolare.',
          'Aumenta il carico solo con tecnica stabile.',
        ],
        variations: [
          'Stacco gambe tese tempo controllato',
          'Stacco gambe tese con pausa',
          'Stacco gambe tese eccentrica controllata',
        ],
      },
    },
  },
  {
    slug: 'hip-thrust',
    type: 'Strength',
    primaryMuscles: ['Glutes'],
    secondaryMuscles: ['Hamstrings', 'Quadriceps'],
    bodyParts: ['Lower Body'],
    equipment: ['Barbell', 'Bench'],
    overview:
      'Hip Thrust is a strength exercise designed to improve force production and control while targeting glutes.',
    keywords: ['hip', 'thrust', 'glutes'],
    instructions: [
      'Set up for Hip Thrust with stable posture and braced core.',
      'Perform each rep with controlled tempo and full range of motion.',
      'Keep target muscles under tension while avoiding compensations.',
      'Finish the set preserving technique and controlled breathing.',
    ],
    exerciseTips: [
      'Keep core active and avoid momentum-driven reps.',
      'Use full range while maintaining joint alignment.',
      'Progress load only when technique is stable.',
    ],
    variations: ['Tempo Hip Thrust', 'Paused Hip Thrust', 'Controlled Hip Thrust'],
    translations: {
      en: {
        name: 'Hip Thrust',
        shortName: 'Hip Thrust',
        description:
          'Hip Thrust is a strength exercise designed to improve force production and control while targeting glutes.',
        searchTerms: ['hip thrust', 'hip', 'thrust', 'glutes', 'hamstrings', 'quadriceps'],
      },
      it: {
        name: 'Hip thrust',
        shortName: 'Hip thrust',
        description:
          'Hip thrust e un esercizio di forza pensato per migliorare produzione di forza e controllo, con focus su glutes.',
        searchTerms: ['hip thrust', 'hip', 'thrust', 'glutes', 'hamstrings', 'quadriceps'],
      },
    },
    localized: {
      it: {
        instructions: [
          'Imposta Hip Thrust con postura stabile e core attivo.',
          'Esegui ogni ripetizione con tempo controllato e range completo.',
          'Mantieni tensione sui muscoli target evitando compensi.',
          'Concludi la serie mantenendo tecnica e respirazione controllata.',
        ],
        exerciseTips: [
          'Mantieni il core attivo ed evita ripetizioni con slancio.',
          'Usa range completo mantenendo allineamento articolare.',
          'Aumenta il carico solo con tecnica stabile.',
        ],
        variations: [
          'Hip thrust tempo controllato',
          'Hip thrust con pausa',
          'Hip thrust eccentrica controllata',
        ],
      },
    },
  },
  {
    slug: 'glute-bridge',
    type: 'Strength',
    primaryMuscles: ['Glutes'],
    secondaryMuscles: ['Hamstrings', 'Abs'],
    bodyParts: ['Lower Body'],
    equipment: ['Bodyweight'],
    overview:
      'Glute Bridge is a strength exercise designed to improve force production and control while targeting glutes.',
    keywords: ['glute', 'bridge', 'glutes'],
    instructions: [
      'Set up for Glute Bridge with stable posture and braced core.',
      'Perform each rep with controlled tempo and full range of motion.',
      'Keep target muscles under tension while avoiding compensations.',
      'Finish the set preserving technique and controlled breathing.',
    ],
    exerciseTips: [
      'Keep core active and avoid momentum-driven reps.',
      'Use full range while maintaining joint alignment.',
      'Progress load only when technique is stable.',
    ],
    variations: ['Tempo Glute Bridge', 'Paused Glute Bridge', 'Controlled Glute Bridge'],
    translations: {
      en: {
        name: 'Glute Bridge',
        shortName: 'Glute Bridge',
        description:
          'Glute Bridge is a strength exercise designed to improve force production and control while targeting glutes.',
        searchTerms: ['glute bridge', 'glute', 'bridge', 'glutes', 'hamstrings', 'abs'],
      },
      it: {
        name: 'Glute bridge',
        shortName: 'Glute bridge',
        description:
          'Glute bridge e un esercizio di forza pensato per migliorare produzione di forza e controllo, con focus su glutes.',
        searchTerms: ['glute bridge', 'glute', 'bridge', 'glutes', 'hamstrings', 'abs'],
      },
    },
    localized: {
      it: {
        instructions: [
          'Imposta Glute Bridge con postura stabile e core attivo.',
          'Esegui ogni ripetizione con tempo controllato e range completo.',
          'Mantieni tensione sui muscoli target evitando compensi.',
          'Concludi la serie mantenendo tecnica e respirazione controllata.',
        ],
        exerciseTips: [
          'Mantieni il core attivo ed evita ripetizioni con slancio.',
          'Usa range completo mantenendo allineamento articolare.',
          'Aumenta il carico solo con tecnica stabile.',
        ],
        variations: [
          'Glute bridge tempo controllato',
          'Glute bridge con pausa',
          'Glute bridge eccentrica controllata',
        ],
      },
    },
  },
  {
    slug: 'cable-pull-through',
    type: 'Strength',
    primaryMuscles: ['Glutes'],
    secondaryMuscles: ['Hamstrings'],
    bodyParts: ['Lower Body'],
    equipment: ['Cable Machine'],
    overview:
      'Cable Pull-Through is a strength exercise designed to improve force production and control while targeting glutes.',
    keywords: ['cable', 'pull', 'through', 'glutes'],
    instructions: [
      'Set up for Cable Pull-Through with stable posture and braced core.',
      'Perform each rep with controlled tempo and full range of motion.',
      'Keep target muscles under tension while avoiding compensations.',
      'Finish the set preserving technique and controlled breathing.',
    ],
    exerciseTips: [
      'Keep core active and avoid momentum-driven reps.',
      'Use full range while maintaining joint alignment.',
      'Progress load only when technique is stable.',
    ],
    variations: [
      'Tempo Cable Pull-Through',
      'Paused Cable Pull-Through',
      'Controlled Cable Pull-Through',
    ],
    translations: {
      en: {
        name: 'Cable Pull-Through',
        shortName: 'Cable Pull-Through',
        description:
          'Cable Pull-Through is a strength exercise designed to improve force production and control while targeting glutes.',
        searchTerms: [
          'cable pull-through',
          'pull-through ai cavi',
          'cable pull through',
          'cable',
          'pull',
          'through',
          'glutes',
          'hamstrings',
        ],
      },
      it: {
        name: 'Pull-through ai cavi',
        shortName: 'Pull-through ai cavi',
        description:
          'Pull-through ai cavi e un esercizio di forza pensato per migliorare produzione di forza e controllo, con focus su glutes.',
        searchTerms: [
          'cable pull-through',
          'pull-through ai cavi',
          'cable pull through',
          'cable',
          'pull',
          'through',
          'glutes',
          'hamstrings',
        ],
      },
    },
    localized: {
      it: {
        instructions: [
          'Imposta Cable Pull-Through con postura stabile e core attivo.',
          'Esegui ogni ripetizione con tempo controllato e range completo.',
          'Mantieni tensione sui muscoli target evitando compensi.',
          'Concludi la serie mantenendo tecnica e respirazione controllata.',
        ],
        exerciseTips: [
          'Mantieni il core attivo ed evita ripetizioni con slancio.',
          'Usa range completo mantenendo allineamento articolare.',
          'Aumenta il carico solo con tecnica stabile.',
        ],
        variations: [
          'Pull-through ai cavi tempo controllato',
          'Pull-through ai cavi con pausa',
          'Pull-through ai cavi eccentrica controllata',
        ],
      },
    },
  },
  {
    slug: 'step-up',
    type: 'Strength',
    primaryMuscles: ['Glutes'],
    secondaryMuscles: ['Quadriceps', 'Hamstrings'],
    bodyParts: ['Lower Body'],
    equipment: ['Dumbbell', 'Bench'],
    overview:
      'Step-Up is a strength exercise designed to improve force production and control while targeting glutes.',
    keywords: ['step', 'up', 'glutes'],
    instructions: [
      'Set up for Step-Up with stable posture and braced core.',
      'Perform each rep with controlled tempo and full range of motion.',
      'Keep target muscles under tension while avoiding compensations.',
      'Finish the set preserving technique and controlled breathing.',
    ],
    exerciseTips: [
      'Keep core active and avoid momentum-driven reps.',
      'Use full range while maintaining joint alignment.',
      'Progress load only when technique is stable.',
    ],
    variations: ['Tempo Step-Up', 'Paused Step-Up', 'Controlled Step-Up'],
    translations: {
      en: {
        name: 'Step-Up',
        shortName: 'Step-Up',
        description:
          'Step-Up is a strength exercise designed to improve force production and control while targeting glutes.',
        searchTerms: ['step-up', 'step up', 'step', 'glutes', 'quadriceps', 'hamstrings'],
      },
      it: {
        name: 'Step-up',
        shortName: 'Step-up',
        description:
          'Step-up e un esercizio di forza pensato per migliorare produzione di forza e controllo, con focus su glutes.',
        searchTerms: ['step-up', 'step up', 'step', 'glutes', 'quadriceps', 'hamstrings'],
      },
    },
    localized: {
      it: {
        instructions: [
          'Imposta Step-Up con postura stabile e core attivo.',
          'Esegui ogni ripetizione con tempo controllato e range completo.',
          'Mantieni tensione sui muscoli target evitando compensi.',
          'Concludi la serie mantenendo tecnica e respirazione controllata.',
        ],
        exerciseTips: [
          'Mantieni il core attivo ed evita ripetizioni con slancio.',
          'Usa range completo mantenendo allineamento articolare.',
          'Aumenta il carico solo con tecnica stabile.',
        ],
        variations: [
          'Step-up tempo controllato',
          'Step-up con pausa',
          'Step-up eccentrica controllata',
        ],
      },
    },
  },
  {
    slug: 'sumo-deadlift',
    type: 'Strength',
    primaryMuscles: ['Glutes'],
    secondaryMuscles: ['Hamstrings', 'Back'],
    bodyParts: ['Lower Body'],
    equipment: ['Barbell'],
    overview:
      'Sumo Deadlift is a strength exercise designed to improve force production and control while targeting glutes.',
    keywords: ['sumo', 'deadlift', 'glutes'],
    instructions: [
      'Set up for Sumo Deadlift with stable posture and braced core.',
      'Perform each rep with controlled tempo and full range of motion.',
      'Keep target muscles under tension while avoiding compensations.',
      'Finish the set preserving technique and controlled breathing.',
    ],
    exerciseTips: [
      'Keep core active and avoid momentum-driven reps.',
      'Use full range while maintaining joint alignment.',
      'Progress load only when technique is stable.',
    ],
    variations: ['Tempo Sumo Deadlift', 'Paused Sumo Deadlift', 'Controlled Sumo Deadlift'],
    translations: {
      en: {
        name: 'Sumo Deadlift',
        shortName: 'Sumo Deadlift',
        description:
          'Sumo Deadlift is a strength exercise designed to improve force production and control while targeting glutes.',
        searchTerms: [
          'sumo deadlift',
          'stacco sumo',
          'sumo',
          'deadlift',
          'glutes',
          'hamstrings',
          'back',
        ],
      },
      it: {
        name: 'Stacco sumo',
        shortName: 'Stacco sumo',
        description:
          'Stacco sumo e un esercizio di forza pensato per migliorare produzione di forza e controllo, con focus su glutes.',
        searchTerms: [
          'sumo deadlift',
          'stacco sumo',
          'sumo',
          'deadlift',
          'glutes',
          'hamstrings',
          'back',
        ],
      },
    },
    localized: {
      it: {
        instructions: [
          'Imposta Sumo Deadlift con postura stabile e core attivo.',
          'Esegui ogni ripetizione con tempo controllato e range completo.',
          'Mantieni tensione sui muscoli target evitando compensi.',
          'Concludi la serie mantenendo tecnica e respirazione controllata.',
        ],
        exerciseTips: [
          'Mantieni il core attivo ed evita ripetizioni con slancio.',
          'Usa range completo mantenendo allineamento articolare.',
          'Aumenta il carico solo con tecnica stabile.',
        ],
        variations: [
          'Stacco sumo tempo controllato',
          'Stacco sumo con pausa',
          'Stacco sumo eccentrica controllata',
        ],
      },
    },
  },
  {
    slug: 'standing-calf-raise',
    type: 'Strength',
    primaryMuscles: ['Calves'],
    secondaryMuscles: [],
    bodyParts: ['Lower Body'],
    equipment: ['Bodyweight'],
    overview:
      'Standing Calf Raise is a strength exercise designed to improve force production and control while targeting calves.',
    keywords: ['standing', 'calf', 'raise', 'calves'],
    instructions: [
      'Set up for Standing Calf Raise with stable posture and braced core.',
      'Perform each rep with controlled tempo and full range of motion.',
      'Keep target muscles under tension while avoiding compensations.',
      'Finish the set preserving technique and controlled breathing.',
    ],
    exerciseTips: [
      'Keep core active and avoid momentum-driven reps.',
      'Use full range while maintaining joint alignment.',
      'Progress load only when technique is stable.',
    ],
    variations: [
      'Tempo Standing Calf Raise',
      'Paused Standing Calf Raise',
      'Controlled Standing Calf Raise',
    ],
    translations: {
      en: {
        name: 'Standing Calf Raise',
        shortName: 'Standing Calf Raise',
        description:
          'Standing Calf Raise is a strength exercise designed to improve force production and control while targeting calves.',
        searchTerms: [
          'standing calf raise',
          'calf raise in piedi',
          'standing',
          'calf',
          'raise',
          'calves',
        ],
      },
      it: {
        name: 'Calf raise in piedi',
        shortName: 'Calf raise in piedi',
        description:
          'Calf raise in piedi e un esercizio di forza pensato per migliorare produzione di forza e controllo, con focus su calves.',
        searchTerms: [
          'standing calf raise',
          'calf raise in piedi',
          'standing',
          'calf',
          'raise',
          'calves',
        ],
      },
    },
    localized: {
      it: {
        instructions: [
          'Imposta Standing Calf Raise con postura stabile e core attivo.',
          'Esegui ogni ripetizione con tempo controllato e range completo.',
          'Mantieni tensione sui muscoli target evitando compensi.',
          'Concludi la serie mantenendo tecnica e respirazione controllata.',
        ],
        exerciseTips: [
          'Mantieni il core attivo ed evita ripetizioni con slancio.',
          'Usa range completo mantenendo allineamento articolare.',
          'Aumenta il carico solo con tecnica stabile.',
        ],
        variations: [
          'Calf raise in piedi tempo controllato',
          'Calf raise in piedi con pausa',
          'Calf raise in piedi eccentrica controllata',
        ],
      },
    },
  },
  {
    slug: 'seated-calf-raise',
    type: 'Strength',
    primaryMuscles: ['Calves'],
    secondaryMuscles: [],
    bodyParts: ['Lower Body'],
    equipment: ['Bench', 'Dumbbell'],
    overview:
      'Seated Calf Raise is a strength exercise designed to improve force production and control while targeting calves.',
    keywords: ['seated', 'calf', 'raise', 'calves'],
    instructions: [
      'Set up for Seated Calf Raise with stable posture and braced core.',
      'Perform each rep with controlled tempo and full range of motion.',
      'Keep target muscles under tension while avoiding compensations.',
      'Finish the set preserving technique and controlled breathing.',
    ],
    exerciseTips: [
      'Keep core active and avoid momentum-driven reps.',
      'Use full range while maintaining joint alignment.',
      'Progress load only when technique is stable.',
    ],
    variations: [
      'Tempo Seated Calf Raise',
      'Paused Seated Calf Raise',
      'Controlled Seated Calf Raise',
    ],
    translations: {
      en: {
        name: 'Seated Calf Raise',
        shortName: 'Seated Calf Raise',
        description:
          'Seated Calf Raise is a strength exercise designed to improve force production and control while targeting calves.',
        searchTerms: [
          'seated calf raise',
          'calf raise da seduto',
          'seated',
          'calf',
          'raise',
          'calves',
        ],
      },
      it: {
        name: 'Calf raise da seduto',
        shortName: 'Calf raise da seduto',
        description:
          'Calf raise da seduto e un esercizio di forza pensato per migliorare produzione di forza e controllo, con focus su calves.',
        searchTerms: [
          'seated calf raise',
          'calf raise da seduto',
          'seated',
          'calf',
          'raise',
          'calves',
        ],
      },
    },
    localized: {
      it: {
        instructions: [
          'Imposta Seated Calf Raise con postura stabile e core attivo.',
          'Esegui ogni ripetizione con tempo controllato e range completo.',
          'Mantieni tensione sui muscoli target evitando compensi.',
          'Concludi la serie mantenendo tecnica e respirazione controllata.',
        ],
        exerciseTips: [
          'Mantieni il core attivo ed evita ripetizioni con slancio.',
          'Usa range completo mantenendo allineamento articolare.',
          'Aumenta il carico solo con tecnica stabile.',
        ],
        variations: [
          'Calf raise da seduto tempo controllato',
          'Calf raise da seduto con pausa',
          'Calf raise da seduto eccentrica controllata',
        ],
      },
    },
  },
  {
    slug: 'donkey-calf-raise',
    type: 'Strength',
    primaryMuscles: ['Calves'],
    secondaryMuscles: [],
    bodyParts: ['Lower Body'],
    equipment: ['Bodyweight'],
    overview:
      'Donkey Calf Raise is a strength exercise designed to improve force production and control while targeting calves.',
    keywords: ['donkey', 'calf', 'raise', 'calves'],
    instructions: [
      'Set up for Donkey Calf Raise with stable posture and braced core.',
      'Perform each rep with controlled tempo and full range of motion.',
      'Keep target muscles under tension while avoiding compensations.',
      'Finish the set preserving technique and controlled breathing.',
    ],
    exerciseTips: [
      'Keep core active and avoid momentum-driven reps.',
      'Use full range while maintaining joint alignment.',
      'Progress load only when technique is stable.',
    ],
    variations: [
      'Tempo Donkey Calf Raise',
      'Paused Donkey Calf Raise',
      'Controlled Donkey Calf Raise',
    ],
    translations: {
      en: {
        name: 'Donkey Calf Raise',
        shortName: 'Donkey Calf Raise',
        description:
          'Donkey Calf Raise is a strength exercise designed to improve force production and control while targeting calves.',
        searchTerms: ['donkey calf raise', 'donkey', 'calf', 'raise', 'calves'],
      },
      it: {
        name: 'Donkey calf raise',
        shortName: 'Donkey calf raise',
        description:
          'Donkey calf raise e un esercizio di forza pensato per migliorare produzione di forza e controllo, con focus su calves.',
        searchTerms: ['donkey calf raise', 'donkey', 'calf', 'raise', 'calves'],
      },
    },
    localized: {
      it: {
        instructions: [
          'Imposta Donkey Calf Raise con postura stabile e core attivo.',
          'Esegui ogni ripetizione con tempo controllato e range completo.',
          'Mantieni tensione sui muscoli target evitando compensi.',
          'Concludi la serie mantenendo tecnica e respirazione controllata.',
        ],
        exerciseTips: [
          'Mantieni il core attivo ed evita ripetizioni con slancio.',
          'Usa range completo mantenendo allineamento articolare.',
          'Aumenta il carico solo con tecnica stabile.',
        ],
        variations: [
          'Donkey calf raise tempo controllato',
          'Donkey calf raise con pausa',
          'Donkey calf raise eccentrica controllata',
        ],
      },
    },
  },
  {
    slug: 'plank',
    type: 'Strength',
    primaryMuscles: ['Abs'],
    secondaryMuscles: ['Shoulders', 'Glutes'],
    bodyParts: ['Core'],
    equipment: ['Bodyweight'],
    overview:
      'Plank is a strength exercise designed to improve force production and control while targeting abs.',
    keywords: ['plank', 'abs'],
    instructions: [
      'Set up for Plank with stable posture and braced core.',
      'Perform each rep with controlled tempo and full range of motion.',
      'Keep target muscles under tension while avoiding compensations.',
      'Finish the set preserving technique and controlled breathing.',
    ],
    exerciseTips: [
      'Keep core active and avoid momentum-driven reps.',
      'Use full range while maintaining joint alignment.',
      'Progress load only when technique is stable.',
    ],
    variations: ['Tempo Plank', 'Paused Plank', 'Controlled Plank'],
    translations: {
      en: {
        name: 'Plank',
        shortName: 'Plank',
        description:
          'Plank is a strength exercise designed to improve force production and control while targeting abs.',
        searchTerms: ['plank', 'abs', 'shoulders', 'glutes'],
      },
      it: {
        name: 'Plank',
        shortName: 'Plank',
        description:
          'Plank e un esercizio di forza pensato per migliorare produzione di forza e controllo, con focus su abs.',
        searchTerms: ['plank', 'abs', 'shoulders', 'glutes'],
      },
    },
    localized: {
      it: {
        instructions: [
          'Imposta Plank con postura stabile e core attivo.',
          'Esegui ogni ripetizione con tempo controllato e range completo.',
          'Mantieni tensione sui muscoli target evitando compensi.',
          'Concludi la serie mantenendo tecnica e respirazione controllata.',
        ],
        exerciseTips: [
          'Mantieni il core attivo ed evita ripetizioni con slancio.',
          'Usa range completo mantenendo allineamento articolare.',
          'Aumenta il carico solo con tecnica stabile.',
        ],
        variations: ['Plank tempo controllato', 'Plank con pausa', 'Plank eccentrica controllata'],
      },
    },
  },
  {
    slug: 'hanging-leg-raise',
    type: 'Strength',
    primaryMuscles: ['Abs'],
    secondaryMuscles: ['Forearms'],
    bodyParts: ['Core'],
    equipment: ['Pull-up Bar'],
    overview:
      'Hanging Leg Raise is a strength exercise designed to improve force production and control while targeting abs.',
    keywords: ['hanging', 'leg', 'raise', 'abs'],
    instructions: [
      'Set up for Hanging Leg Raise with stable posture and braced core.',
      'Perform each rep with controlled tempo and full range of motion.',
      'Keep target muscles under tension while avoiding compensations.',
      'Finish the set preserving technique and controlled breathing.',
    ],
    exerciseTips: [
      'Keep core active and avoid momentum-driven reps.',
      'Use full range while maintaining joint alignment.',
      'Progress load only when technique is stable.',
    ],
    variations: [
      'Tempo Hanging Leg Raise',
      'Paused Hanging Leg Raise',
      'Controlled Hanging Leg Raise',
    ],
    translations: {
      en: {
        name: 'Hanging Leg Raise',
        shortName: 'Hanging Leg Raise',
        description:
          'Hanging Leg Raise is a strength exercise designed to improve force production and control while targeting abs.',
        searchTerms: [
          'hanging leg raise',
          'leg raise alla sbarra',
          'hanging',
          'leg',
          'raise',
          'abs',
          'forearms',
        ],
      },
      it: {
        name: 'Leg raise alla sbarra',
        shortName: 'Leg raise alla sbarra',
        description:
          'Leg raise alla sbarra e un esercizio di forza pensato per migliorare produzione di forza e controllo, con focus su abs.',
        searchTerms: [
          'hanging leg raise',
          'leg raise alla sbarra',
          'hanging',
          'leg',
          'raise',
          'abs',
          'forearms',
        ],
      },
    },
    localized: {
      it: {
        instructions: [
          'Imposta Hanging Leg Raise con postura stabile e core attivo.',
          'Esegui ogni ripetizione con tempo controllato e range completo.',
          'Mantieni tensione sui muscoli target evitando compensi.',
          'Concludi la serie mantenendo tecnica e respirazione controllata.',
        ],
        exerciseTips: [
          'Mantieni il core attivo ed evita ripetizioni con slancio.',
          'Usa range completo mantenendo allineamento articolare.',
          'Aumenta il carico solo con tecnica stabile.',
        ],
        variations: [
          'Leg raise alla sbarra tempo controllato',
          'Leg raise alla sbarra con pausa',
          'Leg raise alla sbarra eccentrica controllata',
        ],
      },
    },
  },
  {
    slug: 'cable-crunch',
    type: 'Strength',
    primaryMuscles: ['Abs'],
    secondaryMuscles: [],
    bodyParts: ['Core'],
    equipment: ['Cable Machine'],
    overview:
      'Cable Crunch is a strength exercise designed to improve force production and control while targeting abs.',
    keywords: ['cable', 'crunch', 'abs'],
    instructions: [
      'Set up for Cable Crunch with stable posture and braced core.',
      'Perform each rep with controlled tempo and full range of motion.',
      'Keep target muscles under tension while avoiding compensations.',
      'Finish the set preserving technique and controlled breathing.',
    ],
    exerciseTips: [
      'Keep core active and avoid momentum-driven reps.',
      'Use full range while maintaining joint alignment.',
      'Progress load only when technique is stable.',
    ],
    variations: ['Tempo Cable Crunch', 'Paused Cable Crunch', 'Controlled Cable Crunch'],
    translations: {
      en: {
        name: 'Cable Crunch',
        shortName: 'Cable Crunch',
        description:
          'Cable Crunch is a strength exercise designed to improve force production and control while targeting abs.',
        searchTerms: ['cable crunch', 'crunch ai cavi', 'cable', 'crunch', 'abs'],
      },
      it: {
        name: 'Crunch ai cavi',
        shortName: 'Crunch ai cavi',
        description:
          'Crunch ai cavi e un esercizio di forza pensato per migliorare produzione di forza e controllo, con focus su abs.',
        searchTerms: ['cable crunch', 'crunch ai cavi', 'cable', 'crunch', 'abs'],
      },
    },
    localized: {
      it: {
        instructions: [
          'Imposta Cable Crunch con postura stabile e core attivo.',
          'Esegui ogni ripetizione con tempo controllato e range completo.',
          'Mantieni tensione sui muscoli target evitando compensi.',
          'Concludi la serie mantenendo tecnica e respirazione controllata.',
        ],
        exerciseTips: [
          'Mantieni il core attivo ed evita ripetizioni con slancio.',
          'Usa range completo mantenendo allineamento articolare.',
          'Aumenta il carico solo con tecnica stabile.',
        ],
        variations: [
          'Crunch ai cavi tempo controllato',
          'Crunch ai cavi con pausa',
          'Crunch ai cavi eccentrica controllata',
        ],
      },
    },
  },
  {
    slug: 'ab-wheel-rollout',
    type: 'Strength',
    primaryMuscles: ['Abs'],
    secondaryMuscles: ['Shoulders'],
    bodyParts: ['Core'],
    equipment: ['Bodyweight'],
    overview:
      'Ab Wheel Rollout is a strength exercise designed to improve force production and control while targeting abs.',
    keywords: ['ab', 'wheel', 'rollout', 'abs'],
    instructions: [
      'Set up for Ab Wheel Rollout with stable posture and braced core.',
      'Perform each rep with controlled tempo and full range of motion.',
      'Keep target muscles under tension while avoiding compensations.',
      'Finish the set preserving technique and controlled breathing.',
    ],
    exerciseTips: [
      'Keep core active and avoid momentum-driven reps.',
      'Use full range while maintaining joint alignment.',
      'Progress load only when technique is stable.',
    ],
    variations: [
      'Tempo Ab Wheel Rollout',
      'Paused Ab Wheel Rollout',
      'Controlled Ab Wheel Rollout',
    ],
    translations: {
      en: {
        name: 'Ab Wheel Rollout',
        shortName: 'Ab Wheel Rollout',
        description:
          'Ab Wheel Rollout is a strength exercise designed to improve force production and control while targeting abs.',
        searchTerms: [
          'ab wheel rollout',
          'rollout addominale',
          'wheel',
          'rollout',
          'abs',
          'shoulders',
        ],
      },
      it: {
        name: 'Rollout addominale',
        shortName: 'Rollout addominale',
        description:
          'Rollout addominale e un esercizio di forza pensato per migliorare produzione di forza e controllo, con focus su abs.',
        searchTerms: [
          'ab wheel rollout',
          'rollout addominale',
          'wheel',
          'rollout',
          'abs',
          'shoulders',
        ],
      },
    },
    localized: {
      it: {
        instructions: [
          'Imposta Ab Wheel Rollout con postura stabile e core attivo.',
          'Esegui ogni ripetizione con tempo controllato e range completo.',
          'Mantieni tensione sui muscoli target evitando compensi.',
          'Concludi la serie mantenendo tecnica e respirazione controllata.',
        ],
        exerciseTips: [
          'Mantieni il core attivo ed evita ripetizioni con slancio.',
          'Usa range completo mantenendo allineamento articolare.',
          'Aumenta il carico solo con tecnica stabile.',
        ],
        variations: [
          'Rollout addominale tempo controllato',
          'Rollout addominale con pausa',
          'Rollout addominale eccentrica controllata',
        ],
      },
    },
  },
  {
    slug: 'russian-twist',
    type: 'Strength',
    primaryMuscles: ['Abs'],
    secondaryMuscles: ['Forearms'],
    bodyParts: ['Core'],
    equipment: ['Bodyweight'],
    overview:
      'Russian Twist is a strength exercise designed to improve force production and control while targeting abs.',
    keywords: ['russian', 'twist', 'abs'],
    instructions: [
      'Set up for Russian Twist with stable posture and braced core.',
      'Perform each rep with controlled tempo and full range of motion.',
      'Keep target muscles under tension while avoiding compensations.',
      'Finish the set preserving technique and controlled breathing.',
    ],
    exerciseTips: [
      'Keep core active and avoid momentum-driven reps.',
      'Use full range while maintaining joint alignment.',
      'Progress load only when technique is stable.',
    ],
    variations: ['Tempo Russian Twist', 'Paused Russian Twist', 'Controlled Russian Twist'],
    translations: {
      en: {
        name: 'Russian Twist',
        shortName: 'Russian Twist',
        description:
          'Russian Twist is a strength exercise designed to improve force production and control while targeting abs.',
        searchTerms: ['russian twist', 'russian', 'twist', 'abs', 'forearms'],
      },
      it: {
        name: 'Russian twist',
        shortName: 'Russian twist',
        description:
          'Russian twist e un esercizio di forza pensato per migliorare produzione di forza e controllo, con focus su abs.',
        searchTerms: ['russian twist', 'russian', 'twist', 'abs', 'forearms'],
      },
    },
    localized: {
      it: {
        instructions: [
          'Imposta Russian Twist con postura stabile e core attivo.',
          'Esegui ogni ripetizione con tempo controllato e range completo.',
          'Mantieni tensione sui muscoli target evitando compensi.',
          'Concludi la serie mantenendo tecnica e respirazione controllata.',
        ],
        exerciseTips: [
          'Mantieni il core attivo ed evita ripetizioni con slancio.',
          'Usa range completo mantenendo allineamento articolare.',
          'Aumenta il carico solo con tecnica stabile.',
        ],
        variations: [
          'Russian twist tempo controllato',
          'Russian twist con pausa',
          'Russian twist eccentrica controllata',
        ],
      },
    },
  },
  {
    slug: 'bicycle-crunch',
    type: 'Strength',
    primaryMuscles: ['Abs'],
    secondaryMuscles: ['Forearms'],
    bodyParts: ['Core'],
    equipment: ['Bodyweight'],
    overview:
      'Bicycle Crunch is a strength exercise designed to improve force production and control while targeting abs.',
    keywords: ['bicycle', 'crunch', 'abs'],
    instructions: [
      'Set up for Bicycle Crunch with stable posture and braced core.',
      'Perform each rep with controlled tempo and full range of motion.',
      'Keep target muscles under tension while avoiding compensations.',
      'Finish the set preserving technique and controlled breathing.',
    ],
    exerciseTips: [
      'Keep core active and avoid momentum-driven reps.',
      'Use full range while maintaining joint alignment.',
      'Progress load only when technique is stable.',
    ],
    variations: ['Tempo Bicycle Crunch', 'Paused Bicycle Crunch', 'Controlled Bicycle Crunch'],
    translations: {
      en: {
        name: 'Bicycle Crunch',
        shortName: 'Bicycle Crunch',
        description:
          'Bicycle Crunch is a strength exercise designed to improve force production and control while targeting abs.',
        searchTerms: ['bicycle crunch', 'bicycle', 'crunch', 'abs', 'forearms'],
      },
      it: {
        name: 'Bicycle crunch',
        shortName: 'Bicycle crunch',
        description:
          'Bicycle crunch e un esercizio di forza pensato per migliorare produzione di forza e controllo, con focus su abs.',
        searchTerms: ['bicycle crunch', 'bicycle', 'crunch', 'abs', 'forearms'],
      },
    },
    localized: {
      it: {
        instructions: [
          'Imposta Bicycle Crunch con postura stabile e core attivo.',
          'Esegui ogni ripetizione con tempo controllato e range completo.',
          'Mantieni tensione sui muscoli target evitando compensi.',
          'Concludi la serie mantenendo tecnica e respirazione controllata.',
        ],
        exerciseTips: [
          'Mantieni il core attivo ed evita ripetizioni con slancio.',
          'Usa range completo mantenendo allineamento articolare.',
          'Aumenta il carico solo con tecnica stabile.',
        ],
        variations: [
          'Bicycle crunch tempo controllato',
          'Bicycle crunch con pausa',
          'Bicycle crunch eccentrica controllata',
        ],
      },
    },
  },
  {
    slug: 'wrist-curl',
    type: 'Strength',
    primaryMuscles: ['Forearms'],
    secondaryMuscles: [],
    bodyParts: ['Upper Body'],
    equipment: ['Dumbbell'],
    overview:
      'Wrist Curl is a strength exercise designed to improve force production and control while targeting forearms.',
    keywords: ['wrist', 'curl', 'forearms'],
    instructions: [
      'Set up for Wrist Curl with stable posture and braced core.',
      'Perform each rep with controlled tempo and full range of motion.',
      'Keep target muscles under tension while avoiding compensations.',
      'Finish the set preserving technique and controlled breathing.',
    ],
    exerciseTips: [
      'Keep core active and avoid momentum-driven reps.',
      'Use full range while maintaining joint alignment.',
      'Progress load only when technique is stable.',
    ],
    variations: ['Tempo Wrist Curl', 'Paused Wrist Curl', 'Controlled Wrist Curl'],
    translations: {
      en: {
        name: 'Wrist Curl',
        shortName: 'Wrist Curl',
        description:
          'Wrist Curl is a strength exercise designed to improve force production and control while targeting forearms.',
        searchTerms: ['wrist curl', 'wrist', 'curl', 'forearms'],
      },
      it: {
        name: 'Wrist curl',
        shortName: 'Wrist curl',
        description:
          'Wrist curl e un esercizio di forza pensato per migliorare produzione di forza e controllo, con focus su forearms.',
        searchTerms: ['wrist curl', 'wrist', 'curl', 'forearms'],
      },
    },
    localized: {
      it: {
        instructions: [
          'Imposta Wrist Curl con postura stabile e core attivo.',
          'Esegui ogni ripetizione con tempo controllato e range completo.',
          'Mantieni tensione sui muscoli target evitando compensi.',
          'Concludi la serie mantenendo tecnica e respirazione controllata.',
        ],
        exerciseTips: [
          'Mantieni il core attivo ed evita ripetizioni con slancio.',
          'Usa range completo mantenendo allineamento articolare.',
          'Aumenta il carico solo con tecnica stabile.',
        ],
        variations: [
          'Wrist curl tempo controllato',
          'Wrist curl con pausa',
          'Wrist curl eccentrica controllata',
        ],
      },
    },
  },
  {
    slug: 'reverse-wrist-curl',
    type: 'Strength',
    primaryMuscles: ['Forearms'],
    secondaryMuscles: [],
    bodyParts: ['Upper Body'],
    equipment: ['Dumbbell'],
    overview:
      'Reverse Wrist Curl is a strength exercise designed to improve force production and control while targeting forearms.',
    keywords: ['reverse', 'wrist', 'curl', 'forearms'],
    instructions: [
      'Set up for Reverse Wrist Curl with stable posture and braced core.',
      'Perform each rep with controlled tempo and full range of motion.',
      'Keep target muscles under tension while avoiding compensations.',
      'Finish the set preserving technique and controlled breathing.',
    ],
    exerciseTips: [
      'Keep core active and avoid momentum-driven reps.',
      'Use full range while maintaining joint alignment.',
      'Progress load only when technique is stable.',
    ],
    variations: [
      'Tempo Reverse Wrist Curl',
      'Paused Reverse Wrist Curl',
      'Controlled Reverse Wrist Curl',
    ],
    translations: {
      en: {
        name: 'Reverse Wrist Curl',
        shortName: 'Reverse Wrist Curl',
        description:
          'Reverse Wrist Curl is a strength exercise designed to improve force production and control while targeting forearms.',
        searchTerms: ['reverse wrist curl', 'reverse', 'wrist', 'curl', 'forearms'],
      },
      it: {
        name: 'Reverse wrist curl',
        shortName: 'Reverse wrist curl',
        description:
          'Reverse wrist curl e un esercizio di forza pensato per migliorare produzione di forza e controllo, con focus su forearms.',
        searchTerms: ['reverse wrist curl', 'reverse', 'wrist', 'curl', 'forearms'],
      },
    },
    localized: {
      it: {
        instructions: [
          'Imposta Reverse Wrist Curl con postura stabile e core attivo.',
          'Esegui ogni ripetizione con tempo controllato e range completo.',
          'Mantieni tensione sui muscoli target evitando compensi.',
          'Concludi la serie mantenendo tecnica e respirazione controllata.',
        ],
        exerciseTips: [
          'Mantieni il core attivo ed evita ripetizioni con slancio.',
          'Usa range completo mantenendo allineamento articolare.',
          'Aumenta il carico solo con tecnica stabile.',
        ],
        variations: [
          'Reverse wrist curl tempo controllato',
          'Reverse wrist curl con pausa',
          'Reverse wrist curl eccentrica controllata',
        ],
      },
    },
  },
  {
    slug: 'farmers-walk',
    type: 'Strength',
    primaryMuscles: ['Forearms'],
    secondaryMuscles: ['Shoulders', 'Abs'],
    bodyParts: ['Full Body'],
    equipment: ['Dumbbell'],
    overview:
      "Farmer's Walk is a strength exercise designed to improve force production and control while targeting forearms.",
    keywords: ['farmers', 'walk', 'forearms'],
    instructions: [
      "Set up for Farmer's Walk with stable posture and braced core.",
      'Perform each rep with controlled tempo and full range of motion.',
      'Keep target muscles under tension while avoiding compensations.',
      'Finish the set preserving technique and controlled breathing.',
    ],
    exerciseTips: [
      'Keep core active and avoid momentum-driven reps.',
      'Use full range while maintaining joint alignment.',
      'Progress load only when technique is stable.',
    ],
    variations: ["Tempo Farmer's Walk", "Paused Farmer's Walk", "Controlled Farmer's Walk"],
    translations: {
      en: {
        name: "Farmer's Walk",
        shortName: "Farmer's Walk",
        description:
          "Farmer's Walk is a strength exercise designed to improve force production and control while targeting forearms.",
        searchTerms: [
          "farmer's walk",
          'farmer walk',
          'farmers walk',
          'farmers',
          'walk',
          'forearms',
          'shoulders',
          'abs',
        ],
      },
      it: {
        name: 'Farmer walk',
        shortName: 'Farmer walk',
        description:
          'Farmer walk e un esercizio di forza pensato per migliorare produzione di forza e controllo, con focus su forearms.',
        searchTerms: [
          "farmer's walk",
          'farmer walk',
          'farmers walk',
          'farmers',
          'walk',
          'forearms',
          'shoulders',
          'abs',
        ],
      },
    },
    localized: {
      it: {
        instructions: [
          "Imposta Farmer's Walk con postura stabile e core attivo.",
          'Esegui ogni ripetizione con tempo controllato e range completo.',
          'Mantieni tensione sui muscoli target evitando compensi.',
          'Concludi la serie mantenendo tecnica e respirazione controllata.',
        ],
        exerciseTips: [
          'Mantieni il core attivo ed evita ripetizioni con slancio.',
          'Usa range completo mantenendo allineamento articolare.',
          'Aumenta il carico solo con tecnica stabile.',
        ],
        variations: [
          'Farmer walk tempo controllato',
          'Farmer walk con pausa',
          'Farmer walk eccentrica controllata',
        ],
      },
    },
  },
  {
    slug: 'running',
    type: 'Cardio',
    primaryMuscles: ['Quadriceps', 'Glutes', 'Calves'],
    secondaryMuscles: ['Hamstrings', 'Abs'],
    bodyParts: ['Lower Body'],
    equipment: ['Bodyweight'],
    overview:
      'Running is a cardio-focused exercise that improves conditioning and work capacity while engaging quadriceps, glutes, calves.',
    keywords: ['running', 'quadriceps', 'glutes', 'calves'],
    instructions: [
      'Set up and start Running with controlled pace.',
      'Maintain steady breathing and technical consistency.',
      'Adjust intensity progressively based on target effort.',
      'Cool down for 3-5 minutes at the end of the effort.',
    ],
    exerciseTips: [
      'Start below maximal effort and increase intensity progressively.',
      'Track heart rate or RPE to keep workload consistent.',
      'Prioritize technique before speed or volume.',
    ],
    variations: ['Interval Running', 'Steady-State Running', 'Progressive Running'],
    translations: {
      en: {
        name: 'Running',
        shortName: 'Running',
        description:
          'Running is a cardio-focused exercise that improves conditioning and work capacity while engaging quadriceps, glutes, calves.',
        searchTerms: ['running', 'corsa', 'quadriceps', 'glutes', 'calves', 'hamstrings', 'abs'],
      },
      it: {
        name: 'Corsa',
        shortName: 'Corsa',
        description:
          'Corsa e un esercizio cardiovascolare utile a migliorare condizionamento e resistenza, coinvolgendo quadriceps, glutes, calves.',
        searchTerms: ['running', 'corsa', 'quadriceps', 'glutes', 'calves', 'hamstrings', 'abs'],
      },
    },
    localized: {
      it: {
        instructions: [
          'Imposta e avvia Running con ritmo controllato.',
          'Mantieni respirazione regolare e tecnica costante.',
          'Regola l intensita in modo progressivo in base allo sforzo target.',
          'Defatica 3-5 minuti al termine dello sforzo.',
        ],
        exerciseTips: [
          'Parti sotto lo sforzo massimo e aumenta gradualmente l intensita.',
          'Monitora frequenza cardiaca o RPE per mantenere carico costante.',
          'Dai priorita alla tecnica prima di velocita o volume.',
        ],
        variations: ['Corsa a intervalli', 'Corsa a ritmo costante', 'Corsa progressivo'],
      },
    },
  },
  {
    slug: 'cycling',
    type: 'Cardio',
    primaryMuscles: ['Quadriceps', 'Glutes'],
    secondaryMuscles: ['Calves', 'Hamstrings'],
    bodyParts: ['Lower Body'],
    equipment: ['Bodyweight'],
    overview:
      'Cycling is a cardio-focused exercise that improves conditioning and work capacity while engaging quadriceps, glutes.',
    keywords: ['cycling', 'quadriceps', 'glutes'],
    instructions: [
      'Set up and start Cycling with controlled pace.',
      'Maintain steady breathing and technical consistency.',
      'Adjust intensity progressively based on target effort.',
      'Cool down for 3-5 minutes at the end of the effort.',
    ],
    exerciseTips: [
      'Start below maximal effort and increase intensity progressively.',
      'Track heart rate or RPE to keep workload consistent.',
      'Prioritize technique before speed or volume.',
    ],
    variations: ['Interval Cycling', 'Steady-State Cycling', 'Progressive Cycling'],
    translations: {
      en: {
        name: 'Cycling',
        shortName: 'Cycling',
        description:
          'Cycling is a cardio-focused exercise that improves conditioning and work capacity while engaging quadriceps, glutes.',
        searchTerms: ['cycling', 'ciclismo', 'quadriceps', 'glutes', 'calves', 'hamstrings'],
      },
      it: {
        name: 'Ciclismo',
        shortName: 'Ciclismo',
        description:
          'Ciclismo e un esercizio cardiovascolare utile a migliorare condizionamento e resistenza, coinvolgendo quadriceps, glutes.',
        searchTerms: ['cycling', 'ciclismo', 'quadriceps', 'glutes', 'calves', 'hamstrings'],
      },
    },
    localized: {
      it: {
        instructions: [
          'Imposta e avvia Cycling con ritmo controllato.',
          'Mantieni respirazione regolare e tecnica costante.',
          'Regola l intensita in modo progressivo in base allo sforzo target.',
          'Defatica 3-5 minuti al termine dello sforzo.',
        ],
        exerciseTips: [
          'Parti sotto lo sforzo massimo e aumenta gradualmente l intensita.',
          'Monitora frequenza cardiaca o RPE per mantenere carico costante.',
          'Dai priorita alla tecnica prima di velocita o volume.',
        ],
        variations: ['Ciclismo a intervalli', 'Ciclismo a ritmo costante', 'Ciclismo progressivo'],
      },
    },
  },
  {
    slug: 'rowing-machine',
    type: 'Cardio',
    primaryMuscles: ['Back', 'Quadriceps'],
    secondaryMuscles: ['Biceps', 'Glutes'],
    bodyParts: ['Full Body'],
    equipment: ['Cable Machine'],
    overview:
      'Rowing Machine is a cardio-focused exercise that improves conditioning and work capacity while engaging back, quadriceps.',
    keywords: ['rowing', 'machine', 'back', 'quadriceps'],
    instructions: [
      'Set up and start Rowing Machine with controlled pace.',
      'Maintain steady breathing and technical consistency.',
      'Adjust intensity progressively based on target effort.',
      'Cool down for 3-5 minutes at the end of the effort.',
    ],
    exerciseTips: [
      'Start below maximal effort and increase intensity progressively.',
      'Track heart rate or RPE to keep workload consistent.',
      'Prioritize technique before speed or volume.',
    ],
    variations: [
      'Interval Rowing Machine',
      'Steady-State Rowing Machine',
      'Progressive Rowing Machine',
    ],
    translations: {
      en: {
        name: 'Rowing Machine',
        shortName: 'Rowing Machine',
        description:
          'Rowing Machine is a cardio-focused exercise that improves conditioning and work capacity while engaging back, quadriceps.',
        searchTerms: [
          'rowing machine',
          'vogatore',
          'rowing',
          'machine',
          'back',
          'quadriceps',
          'biceps',
          'glutes',
        ],
      },
      it: {
        name: 'Vogatore',
        shortName: 'Vogatore',
        description:
          'Vogatore e un esercizio cardiovascolare utile a migliorare condizionamento e resistenza, coinvolgendo back, quadriceps.',
        searchTerms: [
          'rowing machine',
          'vogatore',
          'rowing',
          'machine',
          'back',
          'quadriceps',
          'biceps',
          'glutes',
        ],
      },
    },
    localized: {
      it: {
        instructions: [
          'Imposta e avvia Rowing Machine con ritmo controllato.',
          'Mantieni respirazione regolare e tecnica costante.',
          'Regola l intensita in modo progressivo in base allo sforzo target.',
          'Defatica 3-5 minuti al termine dello sforzo.',
        ],
        exerciseTips: [
          'Parti sotto lo sforzo massimo e aumenta gradualmente l intensita.',
          'Monitora frequenza cardiaca o RPE per mantenere carico costante.',
          'Dai priorita alla tecnica prima di velocita o volume.',
        ],
        variations: ['Vogatore a intervalli', 'Vogatore a ritmo costante', 'Vogatore progressivo'],
      },
    },
  },
  {
    slug: 'jump-rope',
    type: 'Cardio',
    primaryMuscles: ['Calves', 'Quadriceps'],
    secondaryMuscles: ['Shoulders', 'Forearms'],
    bodyParts: ['Full Body'],
    equipment: ['Bodyweight'],
    overview:
      'Jump Rope is a cardio-focused exercise that improves conditioning and work capacity while engaging calves, quadriceps.',
    keywords: ['jump', 'rope', 'calves', 'quadriceps'],
    instructions: [
      'Set up and start Jump Rope with controlled pace.',
      'Maintain steady breathing and technical consistency.',
      'Adjust intensity progressively based on target effort.',
      'Cool down for 3-5 minutes at the end of the effort.',
    ],
    exerciseTips: [
      'Start below maximal effort and increase intensity progressively.',
      'Track heart rate or RPE to keep workload consistent.',
      'Prioritize technique before speed or volume.',
    ],
    variations: ['Interval Jump Rope', 'Steady-State Jump Rope', 'Progressive Jump Rope'],
    translations: {
      en: {
        name: 'Jump Rope',
        shortName: 'Jump Rope',
        description:
          'Jump Rope is a cardio-focused exercise that improves conditioning and work capacity while engaging calves, quadriceps.',
        searchTerms: [
          'jump rope',
          'salto con la corda',
          'jump',
          'rope',
          'calves',
          'quadriceps',
          'shoulders',
          'forearms',
        ],
      },
      it: {
        name: 'Salto con la corda',
        shortName: 'Salto con la corda',
        description:
          'Salto con la corda e un esercizio cardiovascolare utile a migliorare condizionamento e resistenza, coinvolgendo calves, quadriceps.',
        searchTerms: [
          'jump rope',
          'salto con la corda',
          'jump',
          'rope',
          'calves',
          'quadriceps',
          'shoulders',
          'forearms',
        ],
      },
    },
    localized: {
      it: {
        instructions: [
          'Imposta e avvia Jump Rope con ritmo controllato.',
          'Mantieni respirazione regolare e tecnica costante.',
          'Regola l intensita in modo progressivo in base allo sforzo target.',
          'Defatica 3-5 minuti al termine dello sforzo.',
        ],
        exerciseTips: [
          'Parti sotto lo sforzo massimo e aumenta gradualmente l intensita.',
          'Monitora frequenza cardiaca o RPE per mantenere carico costante.',
          'Dai priorita alla tecnica prima di velocita o volume.',
        ],
        variations: [
          'Salto con la corda a intervalli',
          'Salto con la corda a ritmo costante',
          'Salto con la corda progressivo',
        ],
      },
    },
  },
  {
    slug: 'battle-ropes',
    type: 'Cardio',
    primaryMuscles: ['Shoulders', 'Back'],
    secondaryMuscles: ['Abs', 'Forearms'],
    bodyParts: ['Full Body'],
    equipment: ['Bodyweight'],
    overview:
      'Battle Ropes is a cardio-focused exercise that improves conditioning and work capacity while engaging shoulders, back.',
    keywords: ['battle', 'ropes', 'shoulders', 'back'],
    instructions: [
      'Set up and start Battle Ropes with controlled pace.',
      'Maintain steady breathing and technical consistency.',
      'Adjust intensity progressively based on target effort.',
      'Cool down for 3-5 minutes at the end of the effort.',
    ],
    exerciseTips: [
      'Start below maximal effort and increase intensity progressively.',
      'Track heart rate or RPE to keep workload consistent.',
      'Prioritize technique before speed or volume.',
    ],
    variations: ['Interval Battle Ropes', 'Steady-State Battle Ropes', 'Progressive Battle Ropes'],
    translations: {
      en: {
        name: 'Battle Ropes',
        shortName: 'Battle Ropes',
        description:
          'Battle Ropes is a cardio-focused exercise that improves conditioning and work capacity while engaging shoulders, back.',
        searchTerms: ['battle ropes', 'battle', 'ropes', 'shoulders', 'back', 'abs', 'forearms'],
      },
      it: {
        name: 'Battle ropes',
        shortName: 'Battle ropes',
        description:
          'Battle ropes e un esercizio cardiovascolare utile a migliorare condizionamento e resistenza, coinvolgendo shoulders, back.',
        searchTerms: ['battle ropes', 'battle', 'ropes', 'shoulders', 'back', 'abs', 'forearms'],
      },
    },
    localized: {
      it: {
        instructions: [
          'Imposta e avvia Battle Ropes con ritmo controllato.',
          'Mantieni respirazione regolare e tecnica costante.',
          'Regola l intensita in modo progressivo in base allo sforzo target.',
          'Defatica 3-5 minuti al termine dello sforzo.',
        ],
        exerciseTips: [
          'Parti sotto lo sforzo massimo e aumenta gradualmente l intensita.',
          'Monitora frequenza cardiaca o RPE per mantenere carico costante.',
          'Dai priorita alla tecnica prima di velocita o volume.',
        ],
        variations: [
          'Battle ropes a intervalli',
          'Battle ropes a ritmo costante',
          'Battle ropes progressivo',
        ],
      },
    },
  },
  {
    slug: 'downward-dog',
    type: 'Flexibility',
    primaryMuscles: ['Shoulders', 'Hamstrings'],
    secondaryMuscles: ['Calves', 'Back'],
    bodyParts: ['Full Body'],
    equipment: ['Bodyweight'],
    overview:
      'Downward Dog is a mobility and flexibility drill that improves range of motion in shoulders, hamstrings.',
    keywords: ['downward', 'dog', 'shoulders', 'hamstrings'],
    instructions: [
      'Assume the Downward Dog position with controlled alignment.',
      'Breathe slowly and relax unnecessary tension.',
      'Increase range gradually without forcing painful positions.',
      'Hold for the planned duration and return slowly.',
    ],
    exerciseTips: [
      'Avoid pain and use gradual progression.',
      'Keep breathing slow and controlled.',
      'Repeat frequently with moderate volume for best adaptation.',
    ],
    variations: ['Dynamic Downward Dog', 'Assisted Downward Dog', 'Long-Hold Downward Dog'],
    translations: {
      en: {
        name: 'Downward Dog',
        shortName: 'Downward Dog',
        description:
          'Downward Dog is a mobility and flexibility drill that improves range of motion in shoulders, hamstrings.',
        searchTerms: [
          'downward dog',
          'cane a testa in giu',
          'downward',
          'dog',
          'shoulders',
          'hamstrings',
          'calves',
          'back',
        ],
      },
      it: {
        name: 'Cane a testa in giu',
        shortName: 'Cane a testa in giu',
        description:
          'Cane a testa in giu e un esercizio di mobilita e flessibilita che aumenta il range di movimento di shoulders, hamstrings.',
        searchTerms: [
          'downward dog',
          'cane a testa in giu',
          'downward',
          'dog',
          'shoulders',
          'hamstrings',
          'calves',
          'back',
        ],
      },
    },
    localized: {
      it: {
        instructions: [
          'Assumi la posizione di Downward Dog con allineamento controllato.',
          'Respira lentamente e riduci le tensioni inutili.',
          'Aumenta gradualmente il range senza forzare posizioni dolorose.',
          'Mantieni per il tempo previsto e ritorna lentamente.',
        ],
        exerciseTips: [
          'Evita dolore e usa una progressione graduale.',
          'Mantieni respirazione lenta e controllata.',
          'Ripeti con frequenza e volume moderato per adattarti meglio.',
        ],
        variations: [
          'Cane a testa in giu dinamico',
          'Cane a testa in giu assistito',
          'Cane a testa in giu hold prolungato',
        ],
      },
    },
  },
  {
    slug: 'pigeon-pose',
    type: 'Flexibility',
    primaryMuscles: ['Glutes', 'Hamstrings'],
    secondaryMuscles: ['Abs'],
    bodyParts: ['Lower Body'],
    equipment: ['Bodyweight'],
    overview:
      'Pigeon Pose is a mobility and flexibility drill that improves range of motion in glutes, hamstrings.',
    keywords: ['pigeon', 'pose', 'glutes', 'hamstrings'],
    instructions: [
      'Assume the Pigeon Pose position with controlled alignment.',
      'Breathe slowly and relax unnecessary tension.',
      'Increase range gradually without forcing painful positions.',
      'Hold for the planned duration and return slowly.',
    ],
    exerciseTips: [
      'Avoid pain and use gradual progression.',
      'Keep breathing slow and controlled.',
      'Repeat frequently with moderate volume for best adaptation.',
    ],
    variations: ['Dynamic Pigeon Pose', 'Assisted Pigeon Pose', 'Long-Hold Pigeon Pose'],
    translations: {
      en: {
        name: 'Pigeon Pose',
        shortName: 'Pigeon Pose',
        description:
          'Pigeon Pose is a mobility and flexibility drill that improves range of motion in glutes, hamstrings.',
        searchTerms: [
          'pigeon pose',
          'posizione del piccione',
          'pigeon',
          'pose',
          'glutes',
          'hamstrings',
          'abs',
        ],
      },
      it: {
        name: 'Posizione del piccione',
        shortName: 'Posizione del piccione',
        description:
          'Posizione del piccione e un esercizio di mobilita e flessibilita che aumenta il range di movimento di glutes, hamstrings.',
        searchTerms: [
          'pigeon pose',
          'posizione del piccione',
          'pigeon',
          'pose',
          'glutes',
          'hamstrings',
          'abs',
        ],
      },
    },
    localized: {
      it: {
        instructions: [
          'Assumi la posizione di Pigeon Pose con allineamento controllato.',
          'Respira lentamente e riduci le tensioni inutili.',
          'Aumenta gradualmente il range senza forzare posizioni dolorose.',
          'Mantieni per il tempo previsto e ritorna lentamente.',
        ],
        exerciseTips: [
          'Evita dolore e usa una progressione graduale.',
          'Mantieni respirazione lenta e controllata.',
          'Ripeti con frequenza e volume moderato per adattarti meglio.',
        ],
        variations: [
          'Posizione del piccione dinamico',
          'Posizione del piccione assistito',
          'Posizione del piccione hold prolungato',
        ],
      },
    },
  },
  {
    slug: 'seated-forward-fold',
    type: 'Flexibility',
    primaryMuscles: ['Hamstrings'],
    secondaryMuscles: ['Back', 'Calves'],
    bodyParts: ['Lower Body'],
    equipment: ['Bodyweight'],
    overview:
      'Seated Forward Fold is a mobility and flexibility drill that improves range of motion in hamstrings.',
    keywords: ['seated', 'forward', 'fold', 'hamstrings'],
    instructions: [
      'Assume the Seated Forward Fold position with controlled alignment.',
      'Breathe slowly and relax unnecessary tension.',
      'Increase range gradually without forcing painful positions.',
      'Hold for the planned duration and return slowly.',
    ],
    exerciseTips: [
      'Avoid pain and use gradual progression.',
      'Keep breathing slow and controlled.',
      'Repeat frequently with moderate volume for best adaptation.',
    ],
    variations: [
      'Dynamic Seated Forward Fold',
      'Assisted Seated Forward Fold',
      'Long-Hold Seated Forward Fold',
    ],
    translations: {
      en: {
        name: 'Seated Forward Fold',
        shortName: 'Seated Forward Fold',
        description:
          'Seated Forward Fold is a mobility and flexibility drill that improves range of motion in hamstrings.',
        searchTerms: [
          'seated forward fold',
          'piegamento avanti da seduto',
          'seated',
          'forward',
          'fold',
          'hamstrings',
          'back',
          'calves',
        ],
      },
      it: {
        name: 'Piegamento avanti da seduto',
        shortName: 'Piegamento avanti da seduto',
        description:
          'Piegamento avanti da seduto e un esercizio di mobilita e flessibilita che aumenta il range di movimento di hamstrings.',
        searchTerms: [
          'seated forward fold',
          'piegamento avanti da seduto',
          'seated',
          'forward',
          'fold',
          'hamstrings',
          'back',
          'calves',
        ],
      },
    },
    localized: {
      it: {
        instructions: [
          'Assumi la posizione di Seated Forward Fold con allineamento controllato.',
          'Respira lentamente e riduci le tensioni inutili.',
          'Aumenta gradualmente il range senza forzare posizioni dolorose.',
          'Mantieni per il tempo previsto e ritorna lentamente.',
        ],
        exerciseTips: [
          'Evita dolore e usa una progressione graduale.',
          'Mantieni respirazione lenta e controllata.',
          'Ripeti con frequenza e volume moderato per adattarti meglio.',
        ],
        variations: [
          'Piegamento avanti da seduto dinamico',
          'Piegamento avanti da seduto assistito',
          'Piegamento avanti da seduto hold prolungato',
        ],
      },
    },
  },
  {
    slug: 'cat-cow-stretch',
    type: 'Flexibility',
    primaryMuscles: ['Back', 'Abs'],
    secondaryMuscles: ['Shoulders'],
    bodyParts: ['Core'],
    equipment: ['Bodyweight'],
    overview:
      'Cat-Cow Stretch is a mobility and flexibility drill that improves range of motion in back, abs.',
    keywords: ['cat', 'cow', 'stretch', 'back', 'abs'],
    instructions: [
      'Assume the Cat-Cow Stretch position with controlled alignment.',
      'Breathe slowly and relax unnecessary tension.',
      'Increase range gradually without forcing painful positions.',
      'Hold for the planned duration and return slowly.',
    ],
    exerciseTips: [
      'Avoid pain and use gradual progression.',
      'Keep breathing slow and controlled.',
      'Repeat frequently with moderate volume for best adaptation.',
    ],
    variations: [
      'Dynamic Cat-Cow Stretch',
      'Assisted Cat-Cow Stretch',
      'Long-Hold Cat-Cow Stretch',
    ],
    translations: {
      en: {
        name: 'Cat-Cow Stretch',
        shortName: 'Cat-Cow Stretch',
        description:
          'Cat-Cow Stretch is a mobility and flexibility drill that improves range of motion in back, abs.',
        searchTerms: [
          'cat-cow stretch',
          'cat cow stretch',
          'cat',
          'cow',
          'stretch',
          'back',
          'abs',
          'shoulders',
        ],
      },
      it: {
        name: 'Cat-cow stretch',
        shortName: 'Cat-cow stretch',
        description:
          'Cat-cow stretch e un esercizio di mobilita e flessibilita che aumenta il range di movimento di back, abs.',
        searchTerms: [
          'cat-cow stretch',
          'cat cow stretch',
          'cat',
          'cow',
          'stretch',
          'back',
          'abs',
          'shoulders',
        ],
      },
    },
    localized: {
      it: {
        instructions: [
          'Assumi la posizione di Cat-Cow Stretch con allineamento controllato.',
          'Respira lentamente e riduci le tensioni inutili.',
          'Aumenta gradualmente il range senza forzare posizioni dolorose.',
          'Mantieni per il tempo previsto e ritorna lentamente.',
        ],
        exerciseTips: [
          'Evita dolore e usa una progressione graduale.',
          'Mantieni respirazione lenta e controllata.',
          'Ripeti con frequenza e volume moderato per adattarti meglio.',
        ],
        variations: [
          'Cat-cow stretch dinamico',
          'Cat-cow stretch assistito',
          'Cat-cow stretch hold prolungato',
        ],
      },
    },
  },
  {
    slug: 'hip-flexor-stretch',
    type: 'Flexibility',
    primaryMuscles: ['Quadriceps', 'Glutes'],
    secondaryMuscles: ['Hamstrings'],
    bodyParts: ['Lower Body'],
    equipment: ['Bodyweight'],
    overview:
      'Hip Flexor Stretch is a mobility and flexibility drill that improves range of motion in quadriceps, glutes.',
    keywords: ['hip', 'flexor', 'stretch', 'quadriceps', 'glutes'],
    instructions: [
      'Assume the Hip Flexor Stretch position with controlled alignment.',
      'Breathe slowly and relax unnecessary tension.',
      'Increase range gradually without forcing painful positions.',
      'Hold for the planned duration and return slowly.',
    ],
    exerciseTips: [
      'Avoid pain and use gradual progression.',
      'Keep breathing slow and controlled.',
      'Repeat frequently with moderate volume for best adaptation.',
    ],
    variations: [
      'Dynamic Hip Flexor Stretch',
      'Assisted Hip Flexor Stretch',
      'Long-Hold Hip Flexor Stretch',
    ],
    translations: {
      en: {
        name: 'Hip Flexor Stretch',
        shortName: 'Hip Flexor Stretch',
        description:
          'Hip Flexor Stretch is a mobility and flexibility drill that improves range of motion in quadriceps, glutes.',
        searchTerms: [
          'hip flexor stretch',
          'stretch flessori anca',
          'hip',
          'flexor',
          'stretch',
          'quadriceps',
          'glutes',
          'hamstrings',
        ],
      },
      it: {
        name: 'Stretch flessori anca',
        shortName: 'Stretch flessori anca',
        description:
          'Stretch flessori anca e un esercizio di mobilita e flessibilita che aumenta il range di movimento di quadriceps, glutes.',
        searchTerms: [
          'hip flexor stretch',
          'stretch flessori anca',
          'hip',
          'flexor',
          'stretch',
          'quadriceps',
          'glutes',
          'hamstrings',
        ],
      },
    },
    localized: {
      it: {
        instructions: [
          'Assumi la posizione di Hip Flexor Stretch con allineamento controllato.',
          'Respira lentamente e riduci le tensioni inutili.',
          'Aumenta gradualmente il range senza forzare posizioni dolorose.',
          'Mantieni per il tempo previsto e ritorna lentamente.',
        ],
        exerciseTips: [
          'Evita dolore e usa una progressione graduale.',
          'Mantieni respirazione lenta e controllata.',
          'Ripeti con frequenza e volume moderato per adattarti meglio.',
        ],
        variations: [
          'Stretch flessori anca dinamico',
          'Stretch flessori anca assistito',
          'Stretch flessori anca hold prolungato',
        ],
      },
    },
  },
  {
    slug: 'single-leg-romanian-deadlift',
    type: 'Balance',
    primaryMuscles: ['Hamstrings', 'Glutes'],
    secondaryMuscles: ['Abs', 'Forearms'],
    bodyParts: ['Lower Body'],
    equipment: ['Dumbbell'],
    overview:
      'Single-Leg Romanian Deadlift is a balance exercise that improves stability, coordination, and body control with focus on hamstrings, glutes.',
    keywords: ['single', 'leg', 'romanian', 'deadlift', 'hamstrings', 'glutes'],
    instructions: [
      'Set up for Single-Leg Romanian Deadlift with stable posture.',
      'Engage core and keep movement slow and controlled.',
      'Use support if needed, then reduce assistance progressively.',
      'Finish each rep with full control and aligned posture.',
    ],
    exerciseTips: [
      'Prioritize control over speed.',
      'Use a fixed point to improve balance.',
      'Progress by reducing assistance and increasing complexity.',
    ],
    variations: [
      'Supported Single-Leg Romanian Deadlift',
      'Slow Tempo Single-Leg Romanian Deadlift',
      'Progressed Single-Leg Romanian Deadlift',
    ],
    translations: {
      en: {
        name: 'Single-Leg Romanian Deadlift',
        shortName: 'Single-Leg Romanian Deadlift',
        description:
          'Single-Leg Romanian Deadlift is a balance exercise that improves stability, coordination, and body control with focus on hamstrings, glutes.',
        searchTerms: [
          'single-leg romanian deadlift',
          'stacco rumeno su una gamba',
          'single leg romanian deadlift',
          'single',
          'leg',
          'romanian',
          'deadlift',
          'hamstrings',
          'glutes',
          'abs',
          'forearms',
        ],
      },
      it: {
        name: 'Stacco rumeno su una gamba',
        shortName: 'Stacco rumeno su una gamba',
        description:
          'Stacco rumeno su una gamba e un esercizio di equilibrio che migliora stabilita, coordinazione e controllo motorio, con focus su hamstrings, glutes.',
        searchTerms: [
          'single-leg romanian deadlift',
          'stacco rumeno su una gamba',
          'single leg romanian deadlift',
          'single',
          'leg',
          'romanian',
          'deadlift',
          'hamstrings',
          'glutes',
          'abs',
          'forearms',
        ],
      },
    },
    localized: {
      it: {
        instructions: [
          'Imposta Single-Leg Romanian Deadlift con postura stabile.',
          'Attiva il core e mantieni il movimento lento e controllato.',
          'Usa supporto se necessario, poi riduci progressivamente l assistenza.',
          'Chiudi ogni ripetizione con pieno controllo e postura allineata.',
        ],
        exerciseTips: [
          'Dai priorita al controllo rispetto alla velocita.',
          'Usa un punto fisso per migliorare l equilibrio.',
          'Progredisci riducendo assistenza e aumentando complessita.',
        ],
        variations: [
          'Stacco rumeno su una gamba assistito',
          'Stacco rumeno su una gamba tempo lento',
          'Stacco rumeno su una gamba progressione',
        ],
      },
    },
  },
  {
    slug: 'bosu-ball-squat',
    type: 'Balance',
    primaryMuscles: ['Quadriceps', 'Glutes'],
    secondaryMuscles: ['Abs', 'Calves'],
    bodyParts: ['Lower Body'],
    equipment: ['Bodyweight'],
    overview:
      'Bosu Ball Squat is a balance exercise that improves stability, coordination, and body control with focus on quadriceps, glutes.',
    keywords: ['bosu', 'ball', 'squat', 'quadriceps', 'glutes'],
    instructions: [
      'Set up for Bosu Ball Squat with stable posture.',
      'Engage core and keep movement slow and controlled.',
      'Use support if needed, then reduce assistance progressively.',
      'Finish each rep with full control and aligned posture.',
    ],
    exerciseTips: [
      'Prioritize control over speed.',
      'Use a fixed point to improve balance.',
      'Progress by reducing assistance and increasing complexity.',
    ],
    variations: [
      'Supported Bosu Ball Squat',
      'Slow Tempo Bosu Ball Squat',
      'Progressed Bosu Ball Squat',
    ],
    translations: {
      en: {
        name: 'Bosu Ball Squat',
        shortName: 'Bosu Ball Squat',
        description:
          'Bosu Ball Squat is a balance exercise that improves stability, coordination, and body control with focus on quadriceps, glutes.',
        searchTerms: [
          'bosu ball squat',
          'squat su bosu',
          'bosu',
          'ball',
          'squat',
          'quadriceps',
          'glutes',
          'abs',
          'calves',
        ],
      },
      it: {
        name: 'Squat su bosu',
        shortName: 'Squat su bosu',
        description:
          'Squat su bosu e un esercizio di equilibrio che migliora stabilita, coordinazione e controllo motorio, con focus su quadriceps, glutes.',
        searchTerms: [
          'bosu ball squat',
          'squat su bosu',
          'bosu',
          'ball',
          'squat',
          'quadriceps',
          'glutes',
          'abs',
          'calves',
        ],
      },
    },
    localized: {
      it: {
        instructions: [
          'Imposta Bosu Ball Squat con postura stabile.',
          'Attiva il core e mantieni il movimento lento e controllato.',
          'Usa supporto se necessario, poi riduci progressivamente l assistenza.',
          'Chiudi ogni ripetizione con pieno controllo e postura allineata.',
        ],
        exerciseTips: [
          'Dai priorita al controllo rispetto alla velocita.',
          'Usa un punto fisso per migliorare l equilibrio.',
          'Progredisci riducendo assistenza e aumentando complessita.',
        ],
        variations: [
          'Squat su bosu assistito',
          'Squat su bosu tempo lento',
          'Squat su bosu progressione',
        ],
      },
    },
  },
  {
    slug: 'pistol-squat',
    type: 'Balance',
    primaryMuscles: ['Quadriceps', 'Glutes'],
    secondaryMuscles: ['Abs', 'Calves'],
    bodyParts: ['Lower Body'],
    equipment: ['Bodyweight'],
    overview:
      'Pistol Squat is a balance exercise that improves stability, coordination, and body control with focus on quadriceps, glutes.',
    keywords: ['pistol', 'squat', 'quadriceps', 'glutes'],
    instructions: [
      'Set up for Pistol Squat with stable posture.',
      'Engage core and keep movement slow and controlled.',
      'Use support if needed, then reduce assistance progressively.',
      'Finish each rep with full control and aligned posture.',
    ],
    exerciseTips: [
      'Prioritize control over speed.',
      'Use a fixed point to improve balance.',
      'Progress by reducing assistance and increasing complexity.',
    ],
    variations: ['Supported Pistol Squat', 'Slow Tempo Pistol Squat', 'Progressed Pistol Squat'],
    translations: {
      en: {
        name: 'Pistol Squat',
        shortName: 'Pistol Squat',
        description:
          'Pistol Squat is a balance exercise that improves stability, coordination, and body control with focus on quadriceps, glutes.',
        searchTerms: ['pistol squat', 'pistol', 'squat', 'quadriceps', 'glutes', 'abs', 'calves'],
      },
      it: {
        name: 'Pistol squat',
        shortName: 'Pistol squat',
        description:
          'Pistol squat e un esercizio di equilibrio che migliora stabilita, coordinazione e controllo motorio, con focus su quadriceps, glutes.',
        searchTerms: ['pistol squat', 'pistol', 'squat', 'quadriceps', 'glutes', 'abs', 'calves'],
      },
    },
    localized: {
      it: {
        instructions: [
          'Imposta Pistol Squat con postura stabile.',
          'Attiva il core e mantieni il movimento lento e controllato.',
          'Usa supporto se necessario, poi riduci progressivamente l assistenza.',
          'Chiudi ogni ripetizione con pieno controllo e postura allineata.',
        ],
        exerciseTips: [
          'Dai priorita al controllo rispetto alla velocita.',
          'Usa un punto fisso per migliorare l equilibrio.',
          'Progredisci riducendo assistenza e aumentando complessita.',
        ],
        variations: [
          'Pistol squat assistito',
          'Pistol squat tempo lento',
          'Pistol squat progressione',
        ],
      },
    },
  },
];

export const EXERCISE_CATALOG_COUNT = EXERCISE_CATALOG.length;
