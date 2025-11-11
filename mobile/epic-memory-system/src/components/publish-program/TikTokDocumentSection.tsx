
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Bold, Italic, List, ListOrdered, Type } from "lucide-react";
import { useEffect, useCallback } from 'react';

interface TikTokDocumentSectionProps {
  content: string;
  onContentChange: (content: string) => void;
}

export function TikTokDocumentSection({
  content,
  onContentChange
}: TikTokDocumentSectionProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right'],
        defaultAlignment: 'left',
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none min-h-full p-4 focus:outline-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-em:text-foreground prose-ul:text-foreground prose-ol:text-foreground prose-li:text-foreground text-foreground bg-transparent',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onContentChange(html);
    },
  });

  const setEditorContent = useCallback(() => {
    if (editor && content) {
      try {
        const parsedContent = JSON.parse(content);
        
        if (typeof parsedContent === 'string') {
          editor.commands.setContent(parsedContent);
        } else if (parsedContent.content) {
          const cleanContent = parsedContent.content
            .replace(/```html|```/g, '')
            .trim();
          editor.commands.setContent(cleanContent);
        } else {
          let formattedContent = '<h1>Weekly Workout Plan</h1>\n\n';
          
          Object.entries(parsedContent).forEach(([day, data]: [string, any]) => {
            const formattedDay = day.replace(/day(\d+)/, 'Day $1');
            formattedContent += `<h2>${formattedDay}</h2>\n`;
            
            if (data.description) {
              formattedContent += `<p><strong>Focus:</strong> ${data.description}</p>\n`;
            }
            
            if (data.strength) {
              formattedContent += `<h3>Strength</h3>\n<p>${data.strength}</p>\n`;
            }
            
            if (data.warmup) {
              formattedContent += `<h3>Warmup</h3>\n<p>${data.warmup}</p>\n`;
            }
            
            if (data.workout) {
              formattedContent += `<h3>Workout</h3>\n<p>${data.workout}</p>\n`;
            }
            
            if (data.notes) {
              formattedContent += `<h3>Notes</h3>\n<p>${data.notes}</p>\n`;
            }
            
            formattedContent += '<hr/>\n\n';
          });
          
          editor.commands.setContent(formattedContent);
        }
      } catch (error) {
        editor.commands.setContent(content);
      }
    }
  }, [editor, content]);

  useEffect(() => {
    setEditorContent();
  }, [setEditorContent]);

  if (!editor) return null;

  return (
    <div className="h-full flex flex-col bg-background rounded-2xl border border-border/50 overflow-hidden">
      {/* TikTok-style floating toolbar */}
      <div className="flex-shrink-0 p-3 bg-muted/30 border-b border-border/30">
        <div className="flex items-center gap-2 justify-center">
          <Button
            variant={editor.isActive('bold') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className="h-8 w-8 p-0 rounded-full"
          >
            <Bold className="h-3 w-3" />
          </Button>
          
          <Button
            variant={editor.isActive('italic') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className="h-8 w-8 p-0 rounded-full"
          >
            <Italic className="h-3 w-3" />
          </Button>
          
          <Button
            variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className="h-8 w-8 p-0 rounded-full"
          >
            <List className="h-3 w-3" />
          </Button>
          
          <Button
            variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className="h-8 w-8 p-0 rounded-full"
          >
            <ListOrdered className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Editor content area */}
      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full">
          <div className="p-4">
            <EditorContent 
              editor={editor}
              className="min-h-[400px] focus-within:ring-0 rounded-lg bg-background/50 border border-border/30 p-4"
            />
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
