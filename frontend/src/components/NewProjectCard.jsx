import { Plus } from 'lucide-react';

const NewProjectCard = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="glass-card p-3 flex flex-col min-h-[200px] items-center justify-center gap-2 border-2 border-dashed border-violet-500/50 hover:border-violet-400 hover:bg-violet-500/5 transition group"
  >
    <div className="w-11 h-11 rounded-full border-2 border-violet-500/40 flex items-center justify-center group-hover:border-violet-400/60 transition">
      <Plus className="w-5 h-5 text-violet-400" />
    </div>
    <p className="font-semibold text-violet-400 text-sm">Create New Project</p>
    <p className="text-[10px] text-zinc-500">Start something new</p>
  </button>
);

export default NewProjectCard;
