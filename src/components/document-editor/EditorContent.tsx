import { Editor, EditorContent as TipTapEditorContent } from '@tiptap/react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShareSection } from './ShareSection';
import { EditorToolbar } from './EditorToolbar';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();

  const handlePublish = async () => {
    await onPublish();
    // Get the HTML content from the editor
    const content = editor.getHTML();
    
    // Navigate to video analysis with the content
    navigate('/video-analysis', { 
      state: { 
        workoutScript: content
      }
    });
  };

  return (
    <Card className="w-full p-6 bg-background border-primary mb-12">
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white rounded-lg">
          <div className="sticky top-20 z-50 bg-white border-b border-border p-4 shadow-sm">
            <EditorToolbar editor={editor} />
          </div>
          <div className="p-6">
            <TipTapEditorContent 
              editor={editor} 
              className="min-h-[300px] prose prose-slate max-w-none prose-h2:text-black prose-h2:text-xl prose-h2:font-bold prose-p:text-black prose-p:mb-4 prose-hr:my-8 prose-hr:border-primary prose-h3:text-black prose-h3:text-lg prose-h3:font-semibold" 
            />
          </div>
        </div>

        <div className="flex flex-col gap-4 pt-6 border-t border-primary">
          <div className="flex justify-end">
            <Button 
              onClick={handlePublish}
              disabled={isPublishing}
              className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[160px]"
            >
              {isPublishing ? 'Publishing...' : 'Publish & Record'}
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
      </div>
    </Card>
  );
}