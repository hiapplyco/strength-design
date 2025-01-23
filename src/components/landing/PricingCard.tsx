import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PricingCardProps {
  title: string;
  price: string;
  features: string[];
  isHighlighted?: boolean;
  buttonText: string;
  isLoading: boolean;
  onSubscribe: () => void;
}

export const PricingCard = ({
  title,
  price,
  features,
  isHighlighted = false,
  buttonText,
  isLoading,
  onSubscribe
}: PricingCardProps) => {
  return (
    <div className={`bg-muted p-8 rounded-xl ${isHighlighted ? 'border-2 border-primary' : ''}`}>
      <div className="mb-8">
        <h3 className="text-3xl font-oswald text-primary mb-2">{title}</h3>
        <p className="text-4xl font-bold text-white mb-4">{price}<span className="text-lg">/month</span></p>
        <ul className="space-y-4">
          {features.map((feature, i) => (
            <li key={i} className="flex items-start gap-2">
              <Check className="w-5 h-5 text-primary mt-1" />
              <span className="text-white">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
      <Button 
        className="w-full" 
        size="lg" 
        onClick={onSubscribe}
        disabled={isLoading}
      >
        {isLoading ? "Processing..." : buttonText}
      </Button>
    </div>
  );
};