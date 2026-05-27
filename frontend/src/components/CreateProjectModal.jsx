import { useState } from 'react';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';

const LANGUAGES = [
  {
    id: 'Python',
    label: 'Python',
    icon: '🐍',
    desc: 'Scripts & ML',
    glow: 'from-green-500/20 to-emerald-900/10',
    border: 'border-green-500',
    text: 'text-green-400',
  },
  {
    id: 'Java',
    label: 'Java',
    icon: '☕',
    desc: 'Enterprise apps',
    glow: 'from-orange-500/20 to-amber-900/10',
    border: 'border-orange-500',
    text: 'text-orange-400',
  },
  {
    id: 'C++',
    label: 'C++',
    icon: '⚡',
    desc: 'Systems & perf',
    glow: 'from-blue-500/20 to-blue-900/10',
    border: 'border-blue-500',
    text: 'text-blue-400',
  },
  {
    id: 'HTML',
    label: 'HTML',
    icon: '🌐',
    desc: 'Web structure',
    glow: 'from-orange-400/20 to-red-900/10',
    border: 'border-orange-400',
    text: 'text-orange-300',
  },
  {
    id: 'CSS',
    label: 'CSS',
    icon: '🎨',
    desc: 'Styling',
    glow: 'from-sky-500/20 to-cyan-900/10',
    border: 'border-sky-500',
    text: 'text-sky-400',
  },
  {
    id: 'JavaScript',
    label: 'JavaScript',
    icon: '⚡',
    desc: 'Full-stack web',
    glow: 'from-yellow-500/20 to-yellow-900/10',
    border: 'border-yellow-500',
    text: 'text-yellow-400',
  },
];

const CreateProjectModal = ({ open, onClose, onCreate, loading }) => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    language: 'Python',
    visibility: 'public',
  });

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate(form);
  };

  const selected = LANGUAGES.find((l) => l.id === form.language) || LANGUAGES[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">Create New Project</h2>
            <p className="text-sm text-zinc-500 mt-0.5">Pick a language template to get started</p>
          </div>
          <button type="button" onClick={onClose} className="text-zinc-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-sm text-zinc-400 block mb-2">Choose language</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {LANGUAGES.map((lang) => {
                const active = form.language === lang.id;
                return (
                  <button
                    key={lang.id}
                    type="button"
                    onClick={() => setForm({ ...form, language: lang.id })}
                    className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 bg-gradient-to-b ${
                      active
                        ? `${lang.border} ${lang.glow} shadow-neon-sm scale-[1.02]`
                        : 'border-zinc-700/80 bg-zinc-900/50 hover:border-zinc-600'
                    }`}
                  >
                    <span className="text-3xl mb-2 drop-shadow-lg">{lang.icon}</span>
                    <span
                      className={`text-sm font-semibold ${active ? lang.text : 'text-zinc-400'}`}
                    >
                      {lang.label}
                    </span>
                    <span className="text-[10px] text-zinc-600 mt-0.5">{lang.desc}</span>
                    {active && (
                      <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-violet-500 shadow-[0_0_8px_#a855f7]" />
                    )}
                  </button>
                );
              })}
            </div>
            <p className={`text-xs mt-2 ${selected.text}`}>
              Selected: {selected.label} — starter files will be generated automatically
            </p>
          </div>

          <div>
            <label className="text-sm text-zinc-400 block mb-1">Project title</label>
            <input
              className="input-dark"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              placeholder={`My ${selected.label} Project`}
            />
          </div>
          <div>
            <label className="text-sm text-zinc-400 block mb-1">Description</label>
            <textarea
              className="input-dark resize-none h-16"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What are you building?"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading ? 'Creating & opening editor...' : 'Create & Open Editor'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default CreateProjectModal;
