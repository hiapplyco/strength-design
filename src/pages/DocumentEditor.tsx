import { useState } from "react";
import { Editor } from "@/components/document-editor/Editor";

export default function DocumentEditor() {
  const [content, setContent] = useState('');

  const handleSave = async (newContent: string) => {
    setContent(newContent);
    // Here you can implement the save functionality
    // For example, saving to Supabase or local storage
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-4xl font-bold mb-8 text-center font-heading">Document Editor</h1>
      <div className="max-w-4xl mx-auto">
        <Editor content={content} onSave={handleSave} />
      </div>
    </div>
  );
}