export const WORKOUT_PROGRAMS = {
  STRENGTH_TRAINING: {
    Starting_Strength: "A beginner-friendly strength program focusing on compound movements.",
    StrongLifts_5x5: "Classic 5x5 program for building strength and muscle.",
    Power_Building: "Hybrid program combining powerlifting and bodybuilding."
  },
  CARDIO_ENDURANCE: {
    Couch_to_5K: "Progressive running program for beginners.",
    HIIT_Intervals: "High-intensity interval training for fat loss.",
    Endurance_Builder: "Long-duration cardio program for stamina."
  },
  SPECIALIZED_PROGRAMS: {
    CrossFit_Style: "Mixed functional fitness workouts.",
    Bodyweight_Only: "No equipment needed, full body workouts.",
    Recovery_Focus: "Low-impact exercises for active recovery."
  }
};

export const PRESET_CONFIGS = {
  Starting_Strength: {
    title: "Starting Strength",
    fitnessLevel: "beginner",
    numberOfDays: 3,
    prescribedExercises: "Squat 3x5, Bench Press 3x5, Deadlift 1x5"
  },
  StrongLifts_5x5: {
    title: "StrongLifts 5x5",
    fitnessLevel: "beginner",
    numberOfDays: 3,
    prescribedExercises: "Squat 5x5, Bench Press 5x5, Barbell Row 5x5"
  },
  Power_Building: {
    title: "Power Building",
    fitnessLevel: "intermediate",
    numberOfDays: 4,
    prescribedExercises: "Squat 5x3, Bench 5x3, Deadlift 3x3, Accessories"
  },
  Couch_to_5K: {
    title: "Couch to 5K",
    fitnessLevel: "beginner",
    numberOfDays: 3,
    prescribedExercises: "Walk/Run intervals progressing over 8 weeks"
  },
  HIIT_Intervals: {
    title: "HIIT Intervals",
    fitnessLevel: "intermediate",
    numberOfDays: 3,
    prescribedExercises: "30s work/30s rest intervals with bodyweight exercises"
  },
  Endurance_Builder: {
    title: "Endurance Builder",
    fitnessLevel: "intermediate",
    numberOfDays: 4,
    prescribedExercises: "Long duration cardio sessions with progressive overload"
  },
  CrossFit_Style: {
    title: "CrossFit Style",
    fitnessLevel: "advanced",
    numberOfDays: 5,
    prescribedExercises: "WODs combining strength, cardio, and skills"
  },
  Bodyweight_Only: {
    title: "Bodyweight Only",
    fitnessLevel: "beginner",
    numberOfDays: 3,
    prescribedExercises: "Push-ups, Pull-ups, Squats, Core work"
  },
  Recovery_Focus: {
    title: "Recovery Focus",
    fitnessLevel: "beginner",
    numberOfDays: 2,
    prescribedExercises: "Mobility work, light cardio, stretching"
  }
};