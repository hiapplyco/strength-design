
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { InfoIcon } from "lucide-react";

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
          Exercise Form Analyzer Configuration
        </AccordionTrigger>
        <AccordionContent>
          <div className="mb-4 p-3 bg-black/50 border border-gray-700 rounded-lg text-white/90 text-sm">
            <div className="flex items-start gap-2">
              <InfoIcon className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="mb-2">
                  This feature requires a deployed Streamlit application. Follow these steps:
                </p>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>Create a Streamlit app using the provided Python code</li>
                  <li>Set up Google API key and ElevenLabs API key in Streamlit secrets</li>
                  <li>Deploy your app on Streamlit Cloud (<a href="https://streamlit.io/cloud" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">streamlit.io/cloud</a>)</li>
                  <li>Enter your deployed app's URL below</li>
                </ol>
              </div>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label htmlFor="streamlit-url" className="text-sm text-white/80 block mb-1">
                Exercise Form Analyzer URL
              </label>
              <Input
                id="streamlit-url"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://your-form-analyzer.streamlit.app"
                className="bg-black/30 border-gray-700 text-white"
              />
              <p className="text-xs text-white/60 mt-1">
                Enter the URL of your deployed Exercise Form Analyzer Streamlit application
              </p>
            </div>
            <Button type="submit" variant="secondary" size="sm">
              Connect to Exercise Form Analyzer
            </Button>
          </form>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
