
import { InputContainer } from "../workout-generator/input-container";

export function GeneratorSection({
  generatePrompt,
  setGeneratePrompt,
  handleGenerateWorkout,
  isGenerating,
  setIsGenerating,
  showGenerateInput,
  setShowGenerateInput,
  numberOfDays,
  setNumberOfDays,
}) {
  return (
    <div className="bg-background/90 backdrop-blur rounded-lg shadow-lg flex flex-col relative w-full">
      <div className="flex-1 flex flex-col w-full">
        <InputContainer
          generatePrompt={generatePrompt}
          setGeneratePrompt={setGeneratePrompt}
          handleGenerateWorkout={handleGenerateWorkout}
          isGenerating={isGenerating}
          setIsGenerating={setIsGenerating}
          showGenerateInput={showGenerateInput}
          setShowGenerateInput={setShowGenerateInput}
          numberOfDays={numberOfDays}
          setNumberOfDays={setNumberOfDays}
        />
      </div>
    </div>
  );
}
