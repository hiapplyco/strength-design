import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { documentQueries } from "@/lib/firebase/db";
import { useToast } from "@/hooks/use-toast";
import { StandardPageLayout } from "@/components/layout/StandardPageLayout";
import { LoadingState } from "@/components/ui/loading-states/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { FileX, Home } from "lucide-react";
import { typography } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export default function SharedDocument() {
  const [document, setDocument] = useState<{ content: string; title?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const { toast } = useToast();

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        if (!id) {
          throw new Error("No document ID provided");
        }

        const data = await documentQueries.getDocument(id);

        if (data) {
          setDocument({
            content: data.content,
            title: data.title
          });
        }
      } catch (error) {
        console.error('Error fetching document:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load the document. Please try again later.",
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchDocument();
    }
  }, [id, toast]);

  if (loading) {
    return (
      <StandardPageLayout maxWidth="4xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingState 
            variant="spinner" 
            message="Loading document..." 
            size="lg"
          />
        </div>
      </StandardPageLayout>
    );
  }

  if (!document) {
    return (
      <StandardPageLayout 
        title="Document Not Found"
        maxWidth="4xl"
      >
        <Card variant="ghost" className="mt-8">
          <EmptyState
            icon={FileX}
            title="Document Not Found"
            description="The document you're looking for doesn't exist or has been removed."
            size="lg"
            action={
              <Button onClick={() => window.location.href = '/'}>
                <Home className="mr-2 h-4 w-4" />
                Go to Homepage
              </Button>
            }
          />
        </Card>
      </StandardPageLayout>
    );
  }

  return (
    <StandardPageLayout 
      title={document.title || "Shared Document"}
      showBack
      maxWidth="4xl"
    >
      <Card className="prose dark:prose-invert max-w-none p-8">
        <div 
          className={cn(typography.body.base, "text-foreground")}
          dangerouslySetInnerHTML={{ __html: document.content }}
        />
      </Card>
    </StandardPageLayout>
  );
}