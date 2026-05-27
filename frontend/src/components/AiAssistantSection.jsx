import { Sparkles, AlertCircle, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const SUGGESTIONS = [
  {
    id: 'optimize',
    title: 'Optimize Code',
    description: 'Improve performance in your latest project',
    action: 'Review',
    icon: Sparkles,
    iconClass: 'bg-violet-500/20 text-violet-400',
    linkClass: 'text-violet-400 hover:text-violet-300',
  },
  {
    id: 'fix',
    title: 'Fix Issues',
    description: 'Detect and resolve potential code issues',
    action: 'Fix Now',
    icon: AlertCircle,
    iconClass: 'bg-red-500/20 text-red-400',
    linkClass: 'text-red-400 hover:text-red-300',
  },
  {
    id: 'clean',
    title: 'Clean Code',
    description: 'Remove unused files and dependencies',
    action: 'Clean',
    icon: Trash2,
    iconClass: 'bg-green-500/20 text-green-400',
    linkClass: 'text-green-400 hover:text-green-300',
  },
];

const AiAssistantSection = () => {
  const handleAction = (id) => {
    const messages = {
      optimize: 'Code optimization suggestions coming soon.',
      fix: 'Issue scanning coming soon.',
      clean: 'Project cleanup coming soon.',
    };
    toast(messages[id] || 'Coming soon');
  };

  return (
    <section className="mt-8 pt-8 border-t border-zinc-800/60">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-sm font-semibold text-white">AI Assistant</h2>
          <p className="text-xs text-zinc-500 mt-1">
            Smart suggestions to improve your development
          </p>
        </div>
        <button
          type="button"
          onClick={() => toast('AI features coming soon')}
          className="text-xs text-violet-400 hover:text-violet-300 shrink-0"
        >
          View All
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {SUGGESTIONS.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.id} className="glass-card p-4 flex flex-col gap-3">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center ${item.iconClass}`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-white">{item.title}</h3>
                <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{item.description}</p>
              </div>
              <button
                type="button"
                onClick={() => handleAction(item.id)}
                className={`text-xs font-medium text-left ${item.linkClass}`}
              >
                {item.action} →
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default AiAssistantSection;
