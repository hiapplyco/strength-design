
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useWorkoutGeneration } from "@/hooks/useWorkoutGeneration";
import { useNavigate } from "react-router-dom";
import { WorkoutGeneratorForm } from "../WorkoutGeneratorForm";
import { WorkoutUsageDisplay } from "../WorkoutUsageDisplay";
import { PaywallDialog } from "../PaywallDialog";
import { useWorkoutGeneration as useWorkoutGenerationHook } from "../hooks/useWorkoutGeneration";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkoutUsage } from "@/hooks/useWorkoutUsage";
import type { WeeklyWorkouts } from "@/types/fitness";

const WORKOUT_STORAGE_KEY = "strength_design_current_workout";

export const ModernWorkoutGenerator = () => {
  const [numberOfDays, setNumberOfDays] = useState(7);
  const [numberOfCycles, setNumberOfCycles] = useState(1);
  const [generatePrompt, setGeneratePrompt] = useState("");
  
  const navigate = useNavigate();
  const { session } = useAuth();
  const { workoutUsage } = useWorkoutUsage();
  const { isGenerating, generateWorkout, showPaywall, setShowPaywall } = useWorkoutGeneration();

  const {
    weatherData,
    weatherPrompt,
    selectedExercises,
    fitnessLevel,
    prescribedExercises,
    injuries,
    isAnalyzingPrescribed,
    isAnalyzingInjuries,
    handleWeatherUpdate,
    handleExerciseSelect,
    handlePrescribedFileSelect,
    handleInjuriesFileSelect,
    handleClear,
    setFitnessLevel,
    setPrescribedExercises,
    setInjuries
  } = useWorkoutGenerationHook({
    handleGenerateWorkout: () => Promise.resolve(),
    setIsGenerating: () => {},
    setGeneratePrompt
  });

  const handleGenerateWorkout = async () => {
    // Check if user can generate workout
    if (!workoutUsage?.can_generate_workout) {
      setShowPaywall(true);
      return;
    }

    const prompts = {
      exercises: selectedExercises.length > 0 
        ? ` Include these exercises in the program: ${selectedExercises.map(e => e.name).join(", ")}. Instructions for reference: ${selectedExercises.map(e => e.instructions[0]).join(" ")}` 
        : "",
      fitness: fitnessLevel ? ` Consider this fitness profile: ${fitnessLevel}.` : "",
      prescribed: prescribedExercises ? ` Please incorporate these prescribed exercises/restrictions: ${prescribedExercises}.` : "",
      injuries: injuries ? ` Please consider these health conditions/injuries: ${injuries}.` : ""
    };
    
    const fullPrompt = `${weatherPrompt}${prompts.exercises}${prompts.fitness}${prompts.prescribed}${prompts.injuries}`;
    
    const result = await generateWorkout({
      prompt: fullPrompt,
      weatherPrompt,
      selectedExercises,
      fitnessLevel,
      prescribedExercises,
      injuries,
      numberOfDays,
      numberOfCycles
    });

    if (result) {
      // Store workout data for the results page
      const storageKey = session?.user?.id 
        ? `${WORKOUT_STORAGE_KEY}_${session.user.id}` 
        : WORKOUT_STORAGE_KEY;
      localStorage.setItem(storageKey, JSON.stringify(result));
      
      // Navigate to results page
      navigate("/workout-results", { state: { workouts: result } });
    }
  };

  const isValid = Boolean(fitnessLevel && numberOfDays > 0);

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        {/* Usage Display */}
        <WorkoutUsageDisplay />

        {/* Workout Generator Form */}
        <WorkoutGeneratorForm
          weatherData={weatherData}
          onWeatherUpdate={handleWeatherUpdate}
          selectedExercises={selectedExercises}
          onExerciseSelect={handleExerciseSelect}
          fitnessLevel={fitnessLevel}
          setFitnessLevel={setFitnessLevel}
          prescribedExercises={prescribedExercises}
          setPrescribedExercises={setPrescribedExercises}
          isAnalyzingPrescribed={isAnalyzingPrescribed}
          handlePrescribedFileSelect={handlePrescribedFileSelect}
          injuries={injuries}
          setInjuries={setInjuries}
          isAnalyzingInjuries={isAnalyzingInjuries}
          handleInjuriesFileSelect={handleInjuriesFileSelect}
          numberOfDays={numberOfDays}
          setNumberOfDays={setNumberOfDays}
          numberOfCycles={numberOfCycles}
          setNumberOfCycles={setNumberOfCycles}
          onGenerate={handleGenerateWorkout}
          onClear={handleClear}
          isGenerating={isGenerating}
          isValid={isValid}
        />

        {/* Paywall Dialog */}
        <PaywallDialog 
          open={showPaywall} 
          onOpenChange={setShowPaywall} 
        />
      </motion.div>
    </div>
  );
};
