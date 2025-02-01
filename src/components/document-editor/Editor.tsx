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
        const parsedContent = JSON.parse(content);
        if (parsedContent.content) {
          // Remove markdown code block indicators if present
          const cleanContent = parsedContent.content
            .replace(/^```html\n?/, '')
            .replace(/\n?```$/, '');
          console.log('Setting markdown content:', cleanContent);
          editor.commands.setContent(cleanContent);
        } else {
          console.log('Setting regular content:', content);
          editor.commands.setContent(content);
        }
      } catch (error) {
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

      // Clean the response content
      const cleanContent = data.content
        .replace(/^```html\n?/, '')
        .replace(/\n?```$/, '');
      
      console.log('Received formatted content:', cleanContent);
      return cleanContent;
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
      const workoutData = JSON.parse(content);
      console.log('Publishing workout data:', workoutData);
      
      const markdownContent = await formatWorkoutContent(workoutData);
      console.log('Setting markdown content:', markdownContent);
      
      editor.commands.setContent(markdownContent);
      
      await publishDocument(editor.getHTML(), onSave);
    } catch (error) {
      console.error('Error in handlePublish:', error);
      console.log('Content is not workout data, publishing as is');
      await publishDocument(editor.getHTML(), onSave);
    }
  }, [editor, content, formatWorkoutContent, publishDocument, onSave]);

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