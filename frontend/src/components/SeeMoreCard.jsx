import { useNavigate } from 'react-router-dom';
import { ArrowRight, FolderOpen } from 'lucide-react';

const SeeMoreCard = ({ total = 0, view = 'grid' }) => {
  const navigate = useNavigate();

  if (view === 'list') {
    return (
      <button
        type="button"
        onClick={() => navigate('/codes')}
        className="glass-card p-3 w-full flex items-center justify-between gap-3 hover:border-violet-500/40 transition text-left"
      >
        <div className="flex items-center gap-3">
          <FolderOpen className="w-8 h-8 text-violet-400" />
          <div>
            <p className="font-medium text-white text-sm">See All Codes</p>
            <p className="text-xs text-zinc-500">{total} projects total</p>
          </div>
        </div>
        <ArrowRight className="w-5 h-5 text-violet-400" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => navigate('/codes')}
      className="glass-card p-3 flex flex-col min-h-[200px] items-center justify-center gap-2 hover:border-violet-500/50 hover:bg-violet-500/5 transition group"
    >
      <div className="w-11 h-11 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center">
        <ArrowRight className="w-5 h-5 text-violet-400 group-hover:translate-x-0.5 transition-transform" />
      </div>
      <p className="font-semibold text-white text-sm">See All Codes</p>
      <p className="text-[10px] text-zinc-500 text-center px-2">
        {total > 13 ? `View all ${total} projects` : 'See more projects'}
      </p>
    </button>
  );
};

export default SeeMoreCard;
