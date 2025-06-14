
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Bold, Italic, AlignLeft, AlignCenter, AlignRight, List, ListOrdered } from "lucide-react";
import { useEffect, useCallback } from 'react';

interface DocumentSectionProps {
  content: string;
  onContentChange: (content: string) => void;
}

export function DocumentSection({
  content,
  onContentChange
}: DocumentSectionProps) {
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
        class: 'prose prose-sm max-w-none min-h-full p-4 focus:outline-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-em:text-foreground prose-ul:text-foreground prose-ol:text-foreground prose-li:text-foreground',
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
        // First try to parse as JSON
        const parsedContent = JSON.parse(content);
        
        if (typeof parsedContent === 'string') {
          editor.commands.setContent(parsedContent);
        } else if (parsedContent.content) {
          const cleanContent = parsedContent.content
            .replace(/```html|```/g, '')
            .trim();
          editor.commands.setContent(cleanContent);
        } else {
          // Format the workout data into a readable document
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
    <div className="h-full flex flex-col">
      {/* Chat-like Header */}
      <div className="flex-shrink-0 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="p-3">
          <h3 className="text-sm font-semibold text-foreground mb-2">Edit Your Program</h3>
          
          {/* Toolbar */}
          <div className="flex flex-wrap gap-1">
            <Button
              variant={editor.isActive('bold') ? 'default' : 'ghost'}
              size="sm"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className="h-7 w-7 p-0"
            >
              <Bold className="h-3 w-3" />
            </Button>
            
            <Button
              variant={editor.isActive('italic') ? 'default' : 'ghost'}
              size="sm"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className="h-7 w-7 p-0"
            >
              <Italic className="h-3 w-3" />
            </Button>
            
            <div className="w-px h-7 bg-border mx-1" />
            
            <Button
              variant={editor.isActive({ textAlign: 'left' }) ? 'default' : 'ghost'}
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              className="h-7 w-7 p-0"
            >
              <AlignLeft className="h-3 w-3" />
            </Button>
            
            <Button
              variant={editor.isActive({ textAlign: 'center' }) ? 'default' : 'ghost'}
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              className="h-7 w-7 p-0"
            >
              <AlignCenter className="h-3 w-3" />
            </Button>
            
            <Button
              variant={editor.isActive({ textAlign: 'right' }) ? 'default' : 'ghost'}
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              className="h-7 w-7 p-0"
            >
              <AlignRight className="h-3 w-3" />
            </Button>
            
            <div className="w-px h-7 bg-border mx-1" />
            
            <Button
              variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
              size="sm"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className="h-7 w-7 p-0"
            >
              <List className="h-3 w-3" />
            </Button>
            
            <Button
              variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
              size="sm"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className="h-7 w-7 p-0"
            >
              <ListOrdered className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Chat-like Message Area */}
      <div className="flex-1 min-h-0 bg-background/30">
        <ScrollArea className="h-full">
          <div className="p-4">
            <div className="bg-background border border-border/50 rounded-lg p-4 shadow-sm">
              <EditorContent 
                editor={editor}
                className="min-h-[300px] focus-within:ring-2 focus-within:ring-primary/20 rounded"
              />
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
