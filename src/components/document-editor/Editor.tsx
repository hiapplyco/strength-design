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

  // Memoized function to update the editor content
  const setEditorContent = useCallback(() => {
    if (editor && content) {
      try {
        // Try to parse the content as JSON
        const parsedContent = JSON.parse(content);
        
        // If it's our specific format with a content field containing markdown
        if (parsedContent.content) {
          console.log('Setting markdown content:', parsedContent.content);
          editor.commands.setContent(parsedContent.content);
        } else {
          // If it's just regular content
          console.log('Setting regular content:', content);
          editor.commands.setContent(content);
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

      console.log('Received formatted content:', data);
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
      // Parse the content as JSON to check if it's workout data
      const workoutData = JSON.parse(content);
      console.log('Publishing workout data:', workoutData);
      
      // Format the workout content using Gemini
      const markdownContent = await formatWorkoutContent(workoutData);
      console.log('Setting markdown content:', markdownContent);
      
      // Update the editor with the markdown content
      editor.commands.setContent(markdownContent);
      
      // Publish the formatted document
      await publishDocument(editor.getHTML(), onSave);
    } catch (error) {
      console.error('Error in handlePublish:', error);
      // If parsing fails, assume it's regular content
      console.log('Content is not workout data, publishing as is');
      await publishDocument(editor.getHTML(), onSave);
    }
  }, [editor, content, formatWorkoutContent, publishDocument, onSave]);

  if (!editor) return null;

  return (
    <div className="relative min-h-screen">
      <div className="pt-24">
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