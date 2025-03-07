import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { InfoIcon } from "lucide-react";
interface StreamlitConfigProps {
  streamlitUrl: string;
  setStreamlitUrl: (url: string) => void;
}
export const StreamlitConfig = ({
  streamlitUrl,
  setStreamlitUrl
}: StreamlitConfigProps) => {
  const [inputUrl, setInputUrl] = useState(streamlitUrl);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Basic URL validation
    if (inputUrl && !inputUrl.startsWith('http')) {
      setInputUrl(`https://${inputUrl}`);
      setStreamlitUrl(`https://${inputUrl}`);
    } else {
      setStreamlitUrl(inputUrl);
    }
  };
  return <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="streamlit-config">
        <AccordionTrigger className="text-white font-medium py-2">
          Exercise Form Analyzer Configuration
        </AccordionTrigger>
        <AccordionContent>
          
          
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label htmlFor="streamlit-url" className="text-sm text-white/80 block mb-1">
                Exercise Form Analyzer URL
              </label>
              <Input id="streamlit-url" value={inputUrl} onChange={e => setInputUrl(e.target.value)} placeholder="https://your-form-analyzer.streamlit.app" className="bg-black/30 border-gray-700 text-white" />
              <p className="text-xs text-white/60 mt-1">
                Enter the URL of your deployed Exercise Form Analyzer Streamlit application
              </p>
            </div>
            <div className="flex gap-2">
              <Button type="submit" variant="secondary" size="sm">
                Connect to Exercise Form Analyzer
              </Button>
              {streamlitUrl && <Button type="button" variant="outline" size="sm" onClick={() => window.open(streamlitUrl, '_blank', 'noopener,noreferrer')}>
                  Open App in New Tab
                </Button>}
            </div>
          </form>
        </AccordionContent>
      </AccordionItem>
    </Accordion>;
};