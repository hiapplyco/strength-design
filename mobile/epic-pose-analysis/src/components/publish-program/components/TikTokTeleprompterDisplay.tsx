
import { ScrollArea } from "@/components/ui/scroll-area";

interface TikTokTeleprompterDisplayProps {
  cleanedScript: string;
  fontSize: number;
  teleprompterPosition: number;
}

export function TikTokTeleprompterDisplay({
  cleanedScript,
  fontSize,
  teleprompterPosition
}: TikTokTeleprompterDisplayProps) {
  return (
    <div className="flex-1 min-h-0 bg-black rounded-2xl overflow-hidden border-2 border-primary/20">
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
              <div className="text-center py-12">
                <p className="text-white/50 italic text-lg mb-4">
                  ✨ Your script will appear here
                </p>
                <p className="text-white/30 text-sm">
                  Generate content in the Edit tab to get started
                </p>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
