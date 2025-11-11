# Enhanced Workout Generation Implementation Guide

## 1. Overview

This document outlines the plan to re-implement and enhance the chat-to-structured-workout generation functionality. The core idea is to leverage a conversational AI to generate comprehensive, personalized daily workout cards based on user interaction and contextual data from various parts of the mobile app.

These workout cards will be holistic, including not just exercises but also weekly dietary plans, specific meal suggestions, and other health-related prescriptions derived from the conversation.

## 2. Core Components

### 2.1. Context Aggregation Service

A service responsible for gathering relevant user data from different sources within the app.

-   **User Profile**: Goals (weight loss, muscle gain), experience level, preferences, injuries.
-   **Workout History**: Past performance, logged exercises, PRs, frequency.
-   **Nutrition Logs**: Caloric intake, macro/micro-nutrient tracking, dietary restrictions.
-   **Health Data**: (With user consent) Data from Apple Health / Google Fit, such as weight, sleep patterns, and activity levels.

### 2.2. Conversational AI Interface (Chat)

The user-facing chat interface where the user interacts with the AI to define their needs for the upcoming week.

-   The chat history will be a key part of the context sent to the generation service.
-   The interface should support rich responses, including displaying the generated workout cards.

### 2.3. Workout Generation Service (AI-Powered)

A cloud function (Firebase) that takes the aggregated context and chat history to generate a structured workout and nutrition plan.

-   **Input**: A JSON object containing `userContext` and `chatHistory`.
-   **Processing**: The function will format the input into a detailed prompt for a powerful language model (like Gemini). The prompt will instruct the model to act as an expert personal trainer and nutritionist.
-   **Output**: A structured JSON object representing the daily workout cards and weekly plan.

### 2.4. Daily Workout Card UI

A new, dynamic component to display the generated plan for each day.

-   **Workout Details**:
    -   Exercises, sets, reps, weight/RPE, rest times.
    -   Links to exercise demonstrations (videos/images).
-   **Nutrition Details**:
    -   Daily caloric and macronutrient targets.
    -   Meal suggestions (breakfast, lunch, dinner, snacks).
    -   Hydration reminders and supplement recommendations.
-   **Other Prescriptions**:
    -   Notes on warm-ups, cool-downs, mobility work, or active recovery.

## 3. Data Flow

1.  **Initiation**: The user opens the chat interface to plan their week.
2.  **Context Gathering**: The app calls the `ContextAggregationService` to get the latest `userContext`.
3.  **Interaction**: The user chats with the AI, specifying their goals for the week (e.g., "I want to focus on building my chest and need a high-protein diet").
4.  **Generation Request**: The app sends the `userContext` and the full `chatHistory` to the `WorkoutGenerationService`.
5.  **AI Processing**: The cloud function prompts the AI model with the combined data, requesting a structured JSON output.
6.  **Response Handling**: The app receives the structured JSON.
7.  **UI Rendering**: The app parses the JSON and renders the `DailyWorkoutCard` components for each day of the plan.
8.  **Persistence**: The generated plan is saved to Firestore, associated with the user's profile, for future reference and tracking.

## 4. Implementation Steps

### Step 1: Build the Context Aggregation Service

-   Create a module `src/services/ContextAggregator.ts`.
-   Implement functions to read data from Firestore (profile, logs) and device APIs (HealthKit/Google Fit).
-   The service should have a single method, `getContext()`, that returns a unified `userContext` object.

### Step 2: Develop the AI Generation Service

-   Create a new Firebase Function `generateStructuredWorkout`.
-   Define the request and response schemas.
-   Implement the logic to call the external AI API (e.g., Gemini).
-   **Crucially, define a robust prompt** that clearly asks for a JSON object with a specific schema. This ensures reliable, parsable output.

**Example JSON Output Schema:**

```json
{
  "weeklyDietPlan": {
    "dailyCalorieTarget": 2500,
    "macronutrientSplit": { "protein": 180, "carbs": 250, "fat": 80 },
    "notes": "Focus on whole foods. Drink at least 3 liters of water per day."
  },
  "dailyPlans": [
    {
      "day": "Monday",
      "title": "Chest & Triceps Strength",
      "workout": [
        { "exercise": "Bench Press", "sets": 4, "reps": "6-8", "rpe": 8 },
        { "exercise": "Incline Dumbbell Press", "sets": 3, "reps": "10-12", "rpe": 9 }
      ],
      "mealPlan": {
        "breakfast": "Oatmeal with protein powder and berries.",
        "lunch": "Grilled chicken salad.",
        "dinner": "Salmon with quinoa and roasted broccoli."
      }
    }
  ]
}
```

### Step 3: Design and Implement UI Components

-   **Chat Interface**: Enhance the existing chat UI to handle the generation lifecycle (loading states, displaying results).
-   **Workout Card Component**: Create a new, detailed `DailyWorkoutCard.tsx` component that can render all the information from the generated plan.

### Step 4: State Management & Data Flow

-   Use a state management library (like Zustand) to manage the state of the generation process.
-   Create a new store slice for `workoutGeneration` to handle `isLoading`, `error`, and the `generatedPlan` data.
-   Trigger the data flow from the chat screen and update the state accordingly.

## 5. Future Enhancements

-   **Interactive Cards**: Allow users to check off exercises and log sets/reps directly on the card.
-   **Dynamic Adjustments**: Add a "Regenerate" or "Adjust" button to allow for modifications without starting a new chat.
-   **Shopping List**: Automatically generate a shopping list from the weekly meal plan.
-   **Progressive Overload**: In subsequent weeks, the context should include the previous week's performance to allow the AI to suggest progressive overload.
