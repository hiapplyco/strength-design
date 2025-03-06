
import { Textarea } from "@/components/ui/textarea";

interface QuestionInputProps {
  question: string;
  setQuestion: (question: string) => void;
}

export const QuestionInput = ({ question, setQuestion }: QuestionInputProps) => {
  return (
    <div>
      <h3 className="text-lg font-medium text-white mb-2">2. Ask a specific question</h3>
      <Textarea 
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="E.g., How can I improve my triangle choke setup? What am I doing wrong with my guard passing?"
        className="h-32 bg-black/30 border-gray-700 text-white"
      />
    </div>
  );
};
