import { Hexagon } from 'lucide-react';

const LoadingScreen = () => (
  <div className="min-h-screen bg-dark flex items-center justify-center">
    <div className="text-center">
      <Hexagon className="w-12 h-12 text-violet-500 mx-auto animate-pulse" />
      <p className="mt-4 text-zinc-400">Loading CodeFusion...</p>
    </div>
  </div>
);

export default LoadingScreen;
