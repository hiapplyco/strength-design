import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface EditorProps {
  content?: string;
  onSave?: (content: string) => void;
}

export function Editor({ content = '', onSave }: EditorProps) {
  const { toast } = useToast();
  
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    editorProps: {
      attributes: {
        class: 'prose prose-invert min-h-[200px] focus:outline-none max-w-none',
      },
    },
  });

  const handleSave = () => {
    if (!editor) return;
    
    if (onSave) {
      onSave(editor.getHTML());
      toast({
        title: "Success",
        description: "Your document has been saved",
      });
    }
  };

  if (!editor) return null;

  return (
    <Card className="w-full p-4 bg-background border-primary">
      <div className="flex gap-2 mb-4 border-b border-primary pb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'bg-accent text-accent-foreground' : ''}
        >
          Bold
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'bg-accent text-accent-foreground' : ''}
        >
          Italic
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading') ? 'bg-accent text-accent-foreground' : ''}
        >
          H2
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'bg-accent text-accent-foreground' : ''}
        >
          List
        </Button>
      </div>
      <EditorContent editor={editor} className="min-h-[200px] prose-h2:text-xl prose-h2:font-bold prose-p:mb-4 prose-hr:my-8 prose-hr:border-primary" />
      <div className="flex justify-end mt-4 pt-4 border-t border-primary">
        <Button onClick={handleSave}>Save Document</Button>
      </div>
    </Card>
  );
}