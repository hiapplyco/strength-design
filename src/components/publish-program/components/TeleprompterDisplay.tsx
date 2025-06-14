
import { ScrollArea } from "@/components/ui/scroll-area";

interface TeleprompterDisplayProps {
  cleanedScript: string;
  fontSize: number;
  teleprompterPosition: number;
}

export function TeleprompterDisplay({
  cleanedScript,
  fontSize,
  teleprompterPosition
}: TeleprompterDisplayProps) {
  return (
    <div className="flex-1 min-h-0 mt-3 bg-black rounded-lg overflow-hidden">
      <ScrollArea className="h-full">
        <div className="p-6">
          <div 
            className="text-white leading-relaxed"
            style={{
              fontSize: `${fontSize}px`,
              lineHeight: '1.8',
              transform: `translateY(-${teleprompterPosition}%)`,
              transition: 'transform 0.1s linear'
            }}
          >
            {cleanedScript ? (
              cleanedScript.split('\n\n').map((paragraph, index) => (
                <p key={index} className="mb-8">
                  {paragraph || '\u00A0'}
                </p>
              ))
            ) : (
              <p className="text-white/50 italic">
                Generate a script to see it here for recording...
              </p>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
