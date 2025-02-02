interface VideoHeaderProps {
  className?: string;
}

export const VideoHeader = ({ className = "" }: VideoHeaderProps) => {
  return (
    <div className={`bg-black/40 backdrop-blur-sm rounded-xl p-8 max-w-3xl mx-auto ${className}`}>
      <h1 className="text-4xl font-bold text-white mb-4 text-center">
        Record and Share your workout with the World!
      </h1>
      <p className="text-xl text-gray-300 text-center">
        Create your own workout video with our easy-to-use recording studio. Write a script, use our teleprompter, and record yourself demonstrating exercises to share with the fitness community.
      </p>
    </div>
  );
};