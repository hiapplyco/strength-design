import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Footer } from "@/components/layout/Footer";
import { Dumbbell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export default function SharedDocument() {
  const { id } = useParams();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        if (!id) {
          setError("No document ID provided");
          setLoading(false);
          return;
        }

        const { data, error: fetchError } = await supabase
          .from("documents")
          .select("content")
          .eq("id", id)
          .single();

        if (fetchError) {
          console.error("Error fetching document:", fetchError);
          setError("Failed to load document");
          toast({
            title: "Error",
            description: "Failed to load document",
            variant: "destructive",
          });
        } else if (!data) {
          setError("Document not found");
        } else {
          setContent(data.content);
          setError(null);
        }
      } catch (err) {
        console.error("Error:", err);
        setError("An unexpected error occurred");
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [id, toast]);

  const LoadingState = () => (
    <div className="min-h-screen bg-background pt-16">
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-3xl mx-auto space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
      <Footer />
    </div>
  );

  const ErrorState = () => (
    <div className="min-h-screen bg-background pt-16">
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">{error}</h1>
          <p className="text-muted-foreground mb-8">
            The document you're looking for might have been removed or is temporarily unavailable.
          </p>
          <Button 
            variant="default"
            onClick={() => window.location.href = '/document-editor'}
          >
            Create New Document
          </Button>
        </div>
      </div>
      <Footer />
    </div>
  );

  if (loading) return <LoadingState />;
  if (error) return <ErrorState />;

  return (
    <div className="min-h-screen bg-background pt-16">
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <article className="prose prose-invert max-w-none mb-16">
            <div dangerouslySetInnerHTML={{ __html: content }} />
          </article>

          <div className="mt-16 p-6 bg-black/30 backdrop-blur-sm rounded-lg border border-primary/20">
            <div className="flex flex-col items-center text-center space-y-4">
              <Dumbbell className="w-12 h-12 text-primary" />
              <h3 className="text-2xl font-oswald text-primary">
                Ready to Build Your Own Evidence-Based Training Program?
              </h3>
              <p className="text-white/90 max-w-2xl">
                Experience the intersection of exercise science and intelligent programming. Create personalized, science-backed 
                workout plans tailored to your specific goals and training requirements.
              </p>
              <Button 
                size="lg"
                className="bg-primary hover:bg-primary/90"
                onClick={() => window.location.href = '/document-editor'}
              >
                Start Creating Now
              </Button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}