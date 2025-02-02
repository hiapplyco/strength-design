import { LoadingIndicator } from "@/components/ui/loading-indicator";

export const LoadingState = () => {
  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed"
      style={{
        backgroundImage: 'url("/lovable-uploads/842b2afa-8591-4d83-b092-99399dbeaa94.png")',
      }}>
      <div className="min-h-screen bg-gradient-to-b from-transparent via-black/75 to-black/75 backdrop-blur-sm flex items-center justify-center">
        <div className="max-w-2xl mx-auto text-center">
          <LoadingIndicator className="scale-150">
            <h2 className="text-2xl font-bold text-white mb-4">Creating Your Influencer Script</h2>
            <p className="text-gray-300">We're crafting an engaging script for your workout video...</p>
          </LoadingIndicator>
        </div>
      </div>
    </div>
  );
};