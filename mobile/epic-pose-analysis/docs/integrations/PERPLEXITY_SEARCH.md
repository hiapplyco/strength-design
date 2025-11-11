# Program Search Feature

This document outlines the steps to implement a "Program Finder" feature that uses Perplexity search to find fitness programs and extract information to build a user-specific program.

## 1. Initial Setup

### Prerequisites

1. **Perplexity API Key**
   - Sign up at [Perplexity API](https://www.perplexity.ai/api)
   - Generate an API key from your account dashboard
   - Add the key as a Firebase Functions config secret:
      ```bash
      # In Firebase functions config
      firebase functions:config:set perplexity.api_key="your_api_key_here"
      ```

2. **Local Development**
   - Copy `.env.example` to `.env.local`
   - Add your Perplexity API key to the local environment

### File Structure
- `docs/` directory - Documentation
- `functions/src/program-search.ts` - Backend API endpoint (Firebase Functions)
- `src/hooks/useProgramSearch.ts` - Frontend React hook
- `src/components/workout-generator/ProgramFinder.tsx` - UI component

## 2. Component Creation

- Create a new component in `src/components/workout-generator/` called `ProgramFinder.tsx`.
- This component will contain the UI for the "Do you have a specific program in mind?" feature.
- It will include an input field for the user to query a program.

## 3. Perplexity Integration

- Create a new hook in `src/hooks/` called `useProgramSearch.ts`.
- This hook will be responsible for making API calls to Perplexity.
- It will take the user's query as input and return a structured output.

## 4. State Management

- The `useProgramSearch` hook will manage the state of the search (loading, error, data).
- The data will be stored in a structured format that can be used to build a workout program.

## 5. UI Integration

- The `ProgramFinder.tsx` component will use the `useProgramSearch` hook to fetch data.
- It will display the results to the user in a clear and concise way.
- The user will be able to select a program from the results.

## 6. Program Generation

- Once a program is selected, the data will be used to pre-fill the workout generator.
- The user can then customize the program to their specific needs.

## 7. Implementation Details

### Backend API (Supabase Edge Function)

The `program-search` edge function handles:
- Receiving search queries from the frontend
- Calling the Perplexity API with structured prompts
- Parsing and structuring the response data
- Returning a standardized `FitnessProgram` object

### Frontend Integration

The `useProgramSearch` hook provides:
- Debounced search (500ms delay)
- Loading and error states
- Structured data typing
- Refetch capability

### UI Component Features

The `ProgramFinder` component includes:
- Real-time search with loading indicators
- Detailed program display with collapsible phases
- Equipment and goal badges
- "Use This Program" integration button
- Error handling with user-friendly messages

## 8. Usage Example

```tsx
import ProgramFinder from '@/components/workout-generator/ProgramFinder';

function WorkoutGenerator() {
  const handleSelectProgram = (program: FitnessProgram) => {
    // Pre-fill workout generator with program data
    setWorkoutConfig({
      duration: program.duration,
      frequency: program.frequency,
      equipment: program.equipment,
      goals: program.goals,
      // ... other fields
    });
  };

  return (
    <ProgramFinder onSelectProgram={handleSelectProgram} />
  );
}
```

## 9. Supported Programs

The system can search for and extract information from popular programs including:
- Starting Strength
- StrongLifts 5x5
- 5/3/1 (Wendler)
- GZCLP
- nSuns
- PPL (Push/Pull/Legs)
- Upper/Lower splits
- And many more...

## 10. Error Handling

The system handles various error scenarios:
- Invalid API key
- Network failures
- Parsing errors
- No results found

All errors are displayed to users with helpful messages and retry options.
