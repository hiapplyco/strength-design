import { LoadingIndicator } from "@/components/ui/loading-indicator";
export const LoadingState = () => {
  return <div className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed" style={{
    backgroundImage: 'url("/lovable-uploads/842b2afa-8591-4d83-b092-99399dbeaa94.png")'
  }}>
      <div className="min-h-screen bg-gradient-to-b from-transparent via-black/75 to-black/75 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="max-w-2xl mx-auto text-center px-4">
          <LoadingIndicator className="scale-150">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 break-words">Creating Your Script</h2>
            <p className="text-gray-300 text-sm sm:text-base break-words">We're crafting an engaging script for your workout video...</p>
          </LoadingIndicator>
        </div>
      </div>
    </div>;
};