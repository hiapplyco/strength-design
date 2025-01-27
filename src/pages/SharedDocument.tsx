import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dumbbell } from "lucide-react";

export default function SharedDocument() {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const { toast } = useToast();

  useEffect(() => {
    async function fetchDocument() {
      try {
        if (!id) {
          toast({
            title: "Error",
            description: "Invalid document ID",
            variant: "destructive",
          });
          return;
        }

        const { data, error } = await supabase
          .from('documents')
          .select('content')
          .eq('id', id)
          .maybeSingle();

        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }

        if (data) {
          setContent(data.content);
        } else {
          toast({
            title: "Document not found",
            description: "The requested document could not be found.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error fetching document:', error);
        toast({
          title: "Error",
          description: "Failed to load document. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchDocument();
  }, [id, toast]);

  if (loading) {
    return (
      <div className="container mx-auto py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-center">Loading document...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-24 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="prose prose-invert max-w-none">
          <div dangerouslySetInnerHTML={{ __html: content }} />
        </div>
        
        <div className="mt-16 p-6 bg-black/30 backdrop-blur-sm rounded-lg border border-primary/20">
          <div className="flex flex-col items-center text-center space-y-4">
            <Dumbbell className="w-12 h-12 text-primary" />
            <h3 className="text-2xl font-oswald text-primary">Ready to Build Your Own Evidence-Based Training Program?</h3>
            <p className="text-white max-w-2xl">
              Experience the intersection of exercise science and intelligent programming. Create personalized, science-backed 
              workout plans tailored to your specific goals and training requirements.
            </p>
            <Button 
              className="mt-4 bg-destructive hover:bg-destructive/90"
              onClick={() => window.location.href = 'https://strength.design'}
            >
              Start Your Training Journey
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}