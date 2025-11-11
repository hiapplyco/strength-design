
// This file is temporarily disabled while migrating to Firebase
// The Supabase instance has been deleted, so we're providing a mock client
import type { Database } from './types';

// Mock Supabase client that doesn't make any network requests
const createMockQuery = () => ({
  select: () => createMockQuery(),
  insert: () => createMockQuery(),
  update: () => createMockQuery(),
  delete: () => createMockQuery(),
  eq: () => createMockQuery(),
  neq: () => createMockQuery(),
  gt: () => createMockQuery(),
  gte: () => createMockQuery(),
  lt: () => createMockQuery(),
  lte: () => createMockQuery(),
  like: () => createMockQuery(),
  ilike: () => createMockQuery(),
  is: () => createMockQuery(),
  in: () => createMockQuery(),
  contains: () => createMockQuery(),
  containedBy: () => createMockQuery(),
  range: () => createMockQuery(),
  single: () => Promise.resolve({ data: null, error: { message: 'Supabase is disabled' } }),
  maybeSingle: () => Promise.resolve({ data: null, error: null }),
  order: () => createMockQuery(),
  limit: () => createMockQuery(),
  then: (resolve: any) => resolve({ data: [], error: null }),
});

export const supabase = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: (callback: any) => {
      // Call callback immediately with null session
      if (callback) callback('SIGNED_OUT', null);
      return { data: { subscription: { unsubscribe: () => {} } } };
    },
    signOut: async () => ({ error: null }),
    signIn: async () => ({ data: null, error: { message: 'Supabase is disabled' } }),
    signUp: async () => ({ data: null, error: { message: 'Supabase is disabled' } }),
    resetPasswordForEmail: async () => ({ data: null, error: { message: 'Supabase is disabled' } }),
    updateUser: async () => ({ data: null, error: { message: 'Supabase is disabled' } }),
  },
  from: (table: string) => createMockQuery(),
  storage: {
    from: (bucket: string) => ({
      upload: async () => ({ data: null, error: { message: 'Supabase is disabled' } }),
      download: async () => ({ data: null, error: { message: 'Supabase is disabled' } }),
      remove: async () => ({ data: null, error: { message: 'Supabase is disabled' } }),
      list: async () => ({ data: [], error: null }),
      getPublicUrl: () => ({ data: { publicUrl: '' } }),
    }),
  },
  functions: {
    invoke: async () => ({ data: null, error: { message: 'Supabase is disabled' } }),
  },
  rpc: async () => ({ data: null, error: { message: 'Supabase is disabled' } }),
} as any;
