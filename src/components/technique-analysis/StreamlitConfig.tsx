
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface StreamlitConfigProps {
  streamlitUrl: string;
  setStreamlitUrl: (url: string) => void;
}

export const StreamlitConfig = ({ streamlitUrl, setStreamlitUrl }: StreamlitConfigProps) => {
  const [inputUrl, setInputUrl] = useState(streamlitUrl);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStreamlitUrl(inputUrl);
  };

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="streamlit-config">
        <AccordionTrigger className="text-white font-medium py-2">
          Streamlit Configuration
        </AccordionTrigger>
        <AccordionContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label htmlFor="streamlit-url" className="text-sm text-white/80 block mb-1">
                Streamlit Application URL
              </label>
              <Input
                id="streamlit-url"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://your-streamlit-app.streamlit.app"
                className="bg-black/30 border-gray-700 text-white"
              />
              <p className="text-xs text-white/60 mt-1">
                Enter the URL of your hosted Streamlit application
              </p>
            </div>
            <Button type="submit" variant="secondary" size="sm">
              Connect to Streamlit
            </Button>
          </form>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
