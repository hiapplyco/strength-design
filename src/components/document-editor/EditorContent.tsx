import { Editor } from '@tiptap/react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EditorContent } from '@tiptap/react';
import { ShareSection } from './ShareSection';

interface EditorContentProps {
  editor: Editor;
  isPublishing: boolean;
  shareableLink: string;
  onPublish: () => void;
  handleShare: (platform: 'facebook' | 'twitter' | 'linkedin') => void;
}

export function EditorContent({
  editor,
  isPublishing,
  shareableLink,
  onPublish,
  handleShare
}: EditorContentProps) {
  return (
    <Card className="w-full p-4 bg-background border-primary">
      <EditorContent 
        editor={editor} 
        className="min-h-[200px] prose-h2:text-xl prose-h2:font-bold prose-p:mb-4 prose-hr:my-8 prose-hr:border-primary prose-h3:text-lg prose-h3:font-semibold" 
      />
      <div className="flex flex-col gap-4 mt-4 pt-4 border-t border-primary">
        <div className="flex justify-end">
          <Button 
            onClick={onPublish}
            disabled={isPublishing}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isPublishing ? 'Publishing...' : 'Publish Document'}
          </Button>
        </div>
        
        {shareableLink && (
          <>
            <p className="text-sm text-muted-foreground mt-2">
              Your document has been published! Share it with others using the link below.
            </p>
            <ShareSection 
              shareableLink={shareableLink} 
              handleShare={handleShare}
            />
          </>
        )}
      </div>
    </Card>
  );
}