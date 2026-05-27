import { useNavigate } from 'react-router-dom';
import { Bookmark, Star, Trash2 } from 'lucide-react';
import { languageColors, formatDate } from '../utils/helpers';
import JavaLogo from './JavaLogo';

const LangBadge = ({ language }) => {
  if (language === 'Java') {
    return <JavaLogo size={44} />;
  }
  const icons = {
    Python: '🐍',
    'C++': '⚡',
    HTML: '🌐',
    CSS: '#',
    JavaScript: 'JS',
  };
  return (
    <span className="w-11 h-11 rounded-xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-sm font-bold text-violet-300">
      {icons[language] || '•'}
    </span>
  );
};

const ProjectCard = ({ project, onToggleStar, onTogglePin, onDelete, view = 'grid' }) => {
  const navigate = useNavigate();
  const colorClass = languageColors[project.language] || languageColors.JavaScript;

  const openEditor = () => navigate(`/editor/${project._id}`);

  if (view === 'list') {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={openEditor}
        onKeyDown={(e) => e.key === 'Enter' && openEditor()}
        className="glass-card p-3 flex flex-wrap items-center gap-3 hover:border-violet-500/40 transition cursor-pointer"
      >
        <LangBadge language={project.language} />
        <div className="flex-1 min-w-[140px]">
          <h3 className="font-medium text-white text-sm">{project.title}</h3>
          <p className="text-xs text-zinc-500 line-clamp-1">{project.description || 'No description'}</p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded border ${colorClass}`}>{project.language}</span>
        <span className="text-violet-400 text-sm font-medium">Open →</span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.(project);
          }}
          className="text-red-400 p-1"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={openEditor}
      onKeyDown={(e) => e.key === 'Enter' && openEditor()}
      className="glass-card p-3 flex flex-col min-h-[200px] hover:border-violet-500/40 transition cursor-pointer group"
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${colorClass}`}>
          {project.language}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin?.(project);
          }}
          className="text-zinc-500 hover:text-violet-400"
        >
          <Bookmark className={`w-3.5 h-3.5 ${project.pinned ? 'fill-violet-400 text-violet-400' : ''}`} />
        </button>
      </div>

      <div className="flex justify-center py-2">
        <LangBadge language={project.language} />
      </div>

      <h3 className="font-semibold text-white text-sm truncate">{project.title}</h3>
      <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{project.description || 'No description'}</p>
      <div className="flex items-center justify-between text-[10px] text-zinc-500 mt-2">
        <span>{formatDate(project.updatedAt)}</span>
        <span>{project.fileCount || 0} files</span>
      </div>

      <div className="flex items-center justify-between mt-3 pt-2 border-t border-zinc-800">
        <span className="text-violet-400 text-xs font-medium group-hover:text-violet-300">Open →</span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleStar?.(project);
            }}
            className="text-zinc-500 hover:text-yellow-400 p-1"
          >
            <Star className={`w-3.5 h-3.5 ${project.starred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(project);
            }}
            className="text-zinc-500 hover:text-red-400 p-1"
            title="Delete project"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
