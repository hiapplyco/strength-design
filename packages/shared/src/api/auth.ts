import type { SupabaseClient } from './supabase';

export const authQueries = {
  signUp: async (supabase: SupabaseClient, email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) throw error;
    return data;
  },

  signIn: async (supabase: SupabaseClient, email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    return data;
  },

  signInWithProvider: async (supabase: SupabaseClient, provider: 'google' | 'apple') => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
    });
    
    if (error) throw error;
    return data;
  },

  signOut: async (supabase: SupabaseClient) => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  getSession: async (supabase: SupabaseClient) => {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  getUser: async (supabase: SupabaseClient) => {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data.user;
  },
};