import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { useEffect, useCallback } from 'react';
import { generateShareUrl } from './editorUtils';
import { useDocumentPublisher } from './hooks/useDocumentPublisher';
import { DocumentEditorContent } from './EditorContent';
import { supabase } from '@/integrations/supabase/client';

interface EditorProps {
  content?: string;
  onSave?: (content: string) => void;
}

export function Editor({ content = '', onSave }: EditorProps) {
  const { shareableLink, isPublishing, publishDocument } = useDocumentPublisher();
  
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
        class: 'prose prose-slate focus:outline-none max-w-none min-h-[200px]',
      },
    },
  });

  const setEditorContent = useCallback(() => {
    if (editor && content) {
      try {
        // First try to parse as JSON
        const parsedContent = JSON.parse(content);
        console.log('Parsed content:', parsedContent);
        
        if (typeof parsedContent === 'string') {
          // If the parsed content is a string, set it directly
          editor.commands.setContent(parsedContent);
        } else {
          // Format the workout data into a readable document
          let formattedContent = '<h1>Weekly Workout Plan</h1>\n\n';
          
          Object.entries(parsedContent).forEach(([day, data]: [string, any]) => {
            // Format day header (e.g., "day1" to "Day 1")
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
          
          console.log('Setting formatted content:', formattedContent);
          editor.commands.setContent(formattedContent);
        }
      } catch (error) {
        // If parsing fails, set the content directly
        console.log('Setting direct content:', content);
        editor.commands.setContent(content);
      }
    }
  }, [editor, content]);

  useEffect(() => {
    setEditorContent();
  }, [setEditorContent]);

  const formatWorkoutContent = useCallback(async (workouts: any) => {
    try {
      console.log('Formatting workout content:', workouts);
      const { data, error } = await supabase.functions.invoke('generate-tiptap-document', {
        body: { workouts }
      });

      if (error) {
        console.error('Error formatting workout:', error);
        throw error;
      }
      
      console.log('Received formatted content:', data.content);
      return data.content;
    } catch (error) {
      console.error('Error in formatWorkoutContent:', error);
      throw error;
    }
  }, []);

  const handleShare = useCallback(async (platform: 'facebook' | 'twitter' | 'linkedin') => {
    if (!shareableLink) return;
    const url = generateShareUrl(platform, shareableLink);
    try {
      await window.open(url, '_blank', 'width=600,height=400');
    } catch (error) {
      console.error('Error opening share window:', error);
    }
  }, [shareableLink]);

  const handlePublish = useCallback(async () => {
    if (!editor) return;
    
    try {
      // Get the current editor content instead of making a new API call
      const currentContent = editor.getHTML();
      await publishDocument(currentContent, onSave);
    } catch (error) {
      console.error('Error in handlePublish:', error);
    }
  }, [editor, publishDocument, onSave]);

  if (!editor) return null;

  return (
    <div className="relative min-h-screen">
      <div className="pt-24 pb-12">
        <DocumentEditorContent 
          editor={editor}
          isPublishing={isPublishing}
          shareableLink={shareableLink}
          onPublish={handlePublish}
          handleShare={handleShare}
        />
      </div>
    </div>
  );
}