import { useState, useEffect, useCallback } from 'react';
import { functions } from '@/lib/firebase/config';
import { httpsCallable } from 'firebase/functions';

interface Exercise {
  name: string;
  sets: number;
  reps: number | string;
  rest?: string;
  notes?: string;
}

interface Workout {
  name: string;
  day?: string;
  exercises: Exercise[];
}

interface ProgramPhase {
  name: string;
  duration: string;
  workouts: Workout[];
}

export interface FitnessProgram {
  programName: string;
  description: string;
  level: string;
  goals: string[];
  duration: string;
  frequency: string;
  equipment: string[];
  phases: ProgramPhase[];
  progressionScheme?: string;
  notes?: string[];
}

interface ProgramSearchState {
  data: FitnessProgram | null;
  loading: boolean;
  error: Error | null;
}

const useProgramSearch = (query: string) => {
  const [state, setState] = useState<ProgramSearchState>({
    data: null,
    loading: false,
    error: null,
  });

  const searchProgram = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.trim().length === 0) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    setState({ data: null, loading: true, error: null });

    try {
      const searchPrograms = httpsCallable(functions, 'searchPrograms');
      const result = await searchPrograms({ query: searchQuery });
      const data = result.data as any;

      if (!data || !data.success) {
        throw new Error(data?.error || 'Failed to search for program');
      }

      setState({
        data: data.data as FitnessProgram,
        loading: false,
        error: null
      });
    } catch (error: any) {
      console.error('Program search error:', error);
      setState({
        data: null,
        loading: false,
        error: error instanceof Error ? error : new Error('An unexpected error occurred')
      });
    }
  }, []);

  useEffect(() => {
    // Debounce the search to avoid too many API calls
    const timeoutId = setTimeout(() => {
      searchProgram(query);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [query, searchProgram]);

  return {
    ...state,
    refetch: () => searchProgram(query),
  };
};

export default useProgramSearch;
