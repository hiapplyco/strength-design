export const MUSCLES = [
  "abdominals",
  "chest",
  "triceps",
  "shoulders-anterior",
  "quadriceps",
  "glutes",
  "hamstrings",
  "erectors",
  "lats"
] as const;
export type MuscleId = typeof MUSCLES[number];
