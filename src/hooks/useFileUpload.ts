
import { useState } from "react";
import { storage, db, functions } from "@/lib/firebase/config";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export const useFileUpload = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleFileSelect = async (file: File) => {
    if (!user) {
      toast({
        title: "Error",
        description: "Please sign in to upload files",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const fileName = `${crypto.randomUUID()}-${file.name}`;
      const filePath = `chat-uploads/${user.id}/${fileName}`;

      // Upload file to Firebase Storage
      const storageRef = ref(storage, filePath);
      const uploadResult = await uploadBytes(storageRef, file, {
        contentType: file.type,
        customMetadata: {
          userId: user.id,
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
        },
      });

      // Get the download URL
      const downloadUrl = await getDownloadURL(uploadResult.ref);

      console.log('File uploaded, download URL:', downloadUrl);

      // Save initial message to Firestore
      const messageRef = await addDoc(collection(db, 'chat_messages'), {
        user_id: user.id,
        message: `Uploaded file: ${file.name}`,
        file_path: downloadUrl,
        file_type: file.type,
        created_at: serverTimestamp(),
        response: null,
      });

      console.log('Message saved to database:', messageRef.id);

      // Process with Gemini using Firebase Cloud Function
      const chatWithGemini = httpsCallable<
        { message: string; fileUrl: string },
        { response: string }
      >(functions, 'chatWithGemini');

      const result = await chatWithGemini({
        message: `Please summarize this file: ${file.name}. After summarizing, ask what I would like to do.`,
        fileUrl: downloadUrl,
      });

      const geminiData = result.data;

      console.log('Received Gemini response:', geminiData);

      if (!geminiData || !geminiData.response) {
        throw new Error('Invalid response from Gemini');
      }

      // Update message with Gemini's response
      await updateDoc(doc(db, 'chat_messages', messageRef.id), {
        response: geminiData.response,
        updated_at: serverTimestamp(),
      });

      toast({
        title: "Success",
        description: "File uploaded and analyzed successfully",
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload and analyze file';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    handleFileSelect
  };
};
