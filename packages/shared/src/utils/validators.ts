import { z } from 'zod';

export const emailSchema = z.string().email('Invalid email address');

export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const phoneSchema = z.string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number');

export const workoutSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  days: z.array(z.object({
    day: z.string(),
    exercises: z.array(z.object({
      name: z.string(),
      sets: z.number().optional(),
      reps: z.string().optional(),
      weight: z.string().optional(),
      rest: z.string().optional(),
      notes: z.string().optional(),
    })),
  })),
});