import { Editor, EditorContent as TipTapEditorContent } from '@tiptap/react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShareSection } from './ShareSection';
import { EditorToolbar } from './EditorToolbar';

interface DocumentEditorContentProps {
  editor: Editor;
  isPublishing: boolean;
  shareableLink: string;
  onPublish: () => void;
  handleShare: (platform: 'facebook' | 'twitter' | 'linkedin') => void;
}

export function DocumentEditorContent({
  editor,
  isPublishing,
  shareableLink,
  onPublish,
  handleShare
}: DocumentEditorContentProps) {
  return (
    <Card className="w-full p-6 bg-background border-primary">
      <div className="bg-white rounded-lg">
        <div className="border-b border-border p-4">
          <EditorToolbar editor={editor} />
        </div>
        <div className="p-6">
          <TipTapEditorContent 
            editor={editor} 
            className="min-h-[300px] prose prose-slate max-w-none prose-h2:text-black prose-h2:text-xl prose-h2:font-bold prose-p:text-black prose-p:mb-4 prose-hr:my-8 prose-hr:border-primary prose-h3:text-black prose-h3:text-lg prose-h3:font-semibold" 
          />
        </div>
      </div>
      <div className="flex flex-col gap-4 mt-6 pt-6 border-t border-primary">
        <div className="flex justify-end">
          <Button 
            onClick={onPublish}
            disabled={isPublishing}
            className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[160px]"
          >
            {isPublishing ? 'Publishing...' : 'Publish Document'}
          </Button>
        </div>
        
        {shareableLink && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Your document has been published! Share it with others using the link below.
            </p>
            <ShareSection 
              shareableLink={shareableLink} 
              handleShare={handleShare}
            />
          </div>
        )}
      </div>
    </Card>
  );
}