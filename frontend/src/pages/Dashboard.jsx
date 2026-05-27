import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  FolderKanban,
  Code2,
  FileText,
  Globe,
  Plus,
  Search,
  Grid3X3,
  List,
  FolderOpen,
  ChevronDown,
} from 'lucide-react';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import ProjectCard from '../components/ProjectCard';
import NewProjectCard from '../components/NewProjectCard';
import SeeMoreCard from '../components/SeeMoreCard';
import AiAssistantSection from '../components/AiAssistantSection';
import CreateProjectModal from '../components/CreateProjectModal';
import { useAuth } from '../context/AuthContext';
import { projectAPI } from '../api/services';
import { parseProjectsResponse } from '../utils/projectsApi';
import { formatTimeAgo } from '../utils/helpers';
import toast from 'react-hot-toast';

const HOME_LIMIT = 13;
const LANGUAGES = ['All', 'HTML', 'CSS', 'JS', 'Python', 'Java', 'C++'];
const GRID_CLASS = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3';
const TOOLBAR_CONTROL =
  'h-10 bg-zinc-900/80 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition';

const langToApi = (lang) => (lang === 'JS' ? 'JavaScript' : lang);

const Dashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isStarredView = searchParams.get('filter') === 'starred';
  const filtersReady = useRef(false);

  const [stats, setStats] = useState({ total: 0, languages: 0, linesOfCode: 0, public: 0 });
  const [projects, setProjects] = useState([]);
  const [totalProjects, setTotalProjects] = useState(0);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const [search, setSearch] = useState('');
  const [langFilter, setLangFilter] = useState('All');
  const [sort, setSort] = useState('updated');
  const [view, setView] = useState('grid');

  const fetchProjects = useCallback(async () => {
    const params = { limit: HOME_LIMIT, sort };
    if (search.trim()) params.search = search.trim();
    if (langFilter !== 'All') params.language = langToApi(langFilter);
    if (isStarredView) params.filter = 'starred';

    const { data } = await projectAPI.getAll(params);
    const parsed = parseProjectsResponse(data);
    const list = isStarredView
      ? parsed.projects.filter((p) => Boolean(p.starred))
      : parsed.projects;
    setProjects(list);
    setTotalProjects(isStarredView ? list.length : parsed.total);
  }, [search, langFilter, sort, isStarredView]);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [statsResult, recentResult] = await Promise.allSettled([
        projectAPI.getStats(),
        projectAPI.getRecent(),
      ]);

      if (statsResult.status === 'fulfilled') {
        setStats(statsResult.value.data);
      }
      if (recentResult.status === 'fulfilled') {
        setRecent(recentResult.value.data);
      }

      await fetchProjects();
    } catch {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, [fetchProjects]);

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!filtersReady.current) {
      filtersReady.current = true;
      return;
    }
    const t = setTimeout(() => {
      setLoading(true);
      fetchProjects()
        .catch(() => toast.error('Failed to load projects'))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [search, langFilter, sort, isStarredView, fetchProjects]);

  const handleDelete = async (project) => {
    if (!confirm(`Delete "${project.title}"?`)) return;
    try {
      await projectAPI.delete(project._id);
      toast.success('Project deleted');
      loadDashboard();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleCreate = async (form) => {
    setCreating(true);
    try {
      const { data } = await projectAPI.create({ ...form, visibility: 'public' });
      toast.success('Project created!');
      setModalOpen(false);
      navigate(`/editor/${data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create');
    } finally {
      setCreating(false);
    }
  };

  const toggleStar = async (project) => {
    await projectAPI.update(project._id, { starred: !project.starred });
    fetchProjects();
  };

  const togglePin = async (project) => {
    await projectAPI.update(project._id, { pinned: !project.pinned });
    fetchProjects();
  };

  const displayedProjects = projects
    .filter((p) => !isStarredView || p.starred)
    .slice(0, HOME_LIMIT);

  return (
    <Layout projectCount={stats.total}>
      <div className="max-w-[1600px] mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              {isStarredView ? 'Starred' : 'Your Projects'}
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              {isStarredView ? 'Projects you have starred' : 'Recent work at a glance'}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" /> New Project
            </button>
            <button type="button" onClick={logout} className="btn-outline text-sm">
              Logout
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <StatCard
            icon={FolderKanban}
            label="Projects"
            value={stats.total}
            sub="Total"
            color="bg-violet-500/20 text-violet-400"
          />
          <StatCard
            icon={Code2}
            label="Languages"
            value={stats.languages}
            sub="Used"
            color="bg-green-500/20 text-green-400"
          />
          <StatCard
            icon={FileText}
            label="Lines"
            value={stats.linesOfCode?.toLocaleString() ?? 0}
            sub="Written"
            color="bg-blue-500/20 text-blue-400"
          />
          <StatCard
            icon={Globe}
            label="Public"
            value={stats.public}
            sub="Shared"
            color="bg-yellow-500/20 text-yellow-400"
          />
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-0">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="w-4 h-4 text-zinc-500" />
            </div>
            <input
              className={`${TOOLBAR_CONTROL} w-full pl-10 pr-4 placeholder-zinc-500`}
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="relative w-full lg:w-52 shrink-0">
            <select
              className={`${TOOLBAR_CONTROL} w-full appearance-none cursor-pointer pl-3 pr-9 [color-scheme:dark]`}
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="updated">Recently updated</option>
              <option value="views">Most viewed</option>
              <option value="starred">Most starred</option>
              <option value="title">A → Z</option>
              <option value="title-desc">Z → A</option>
              <option value="created">Newest</option>
              <option value="created-asc">Oldest</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          </div>
          <div className="flex gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setView('grid')}
              className={`h-10 w-10 flex items-center justify-center rounded-lg border ${
                view === 'grid'
                  ? 'border-violet-500 text-violet-400 bg-violet-500/10'
                  : 'border-zinc-700 text-zinc-500 hover:text-zinc-300'
              }`}
              aria-label="Grid view"
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setView('list')}
              className={`h-10 w-10 flex items-center justify-center rounded-lg border ${
                view === 'list'
                  ? 'border-violet-500 text-violet-400 bg-violet-500/10'
                  : 'border-zinc-700 text-zinc-500 hover:text-zinc-300'
              }`}
              aria-label="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-5">
          {LANGUAGES.map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setLangFilter(lang)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
                langFilter === lang
                  ? 'bg-violet-600 border-violet-600 text-white'
                  : 'bg-transparent border-zinc-700 text-zinc-300 hover:border-zinc-500'
              }`}
            >
              {lang}
            </button>
          ))}
          <button
            type="button"
            className="px-3 py-1 rounded-full text-xs font-medium border border-dashed border-zinc-600 text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 transition"
          >
            + Add Filter
          </button>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <FolderOpen className="w-4 h-4 text-violet-400" />
          <h2 className="text-sm font-semibold text-white">
            {isStarredView ? 'Starred Projects' : 'All Projects'}
          </h2>
          {!loading && (
            <span className="text-xs text-zinc-500">({totalProjects})</span>
          )}
        </div>

        {loading ? (
          <div className={GRID_CLASS}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="glass-card h-48 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className={view === 'grid' ? GRID_CLASS : 'space-y-2'}>
            {!isStarredView && <NewProjectCard onClick={() => setModalOpen(true)} />}
            {displayedProjects.length === 0 && isStarredView && (
              <div className="col-span-full glass-card py-12 text-center">
                <p className="text-zinc-400 text-sm">No starred projects yet.</p>
                <p className="text-zinc-500 text-xs mt-1">
                  Star a project from the grid to see it here.
                </p>
              </div>
            )}
            {displayedProjects.map((p) => (
              <ProjectCard
                key={p._id}
                project={p}
                view={view}
                onToggleStar={toggleStar}
                onTogglePin={togglePin}
                onDelete={handleDelete}
              />
            ))}
            {!isStarredView && <SeeMoreCard total={totalProjects} view={view} />}
          </div>
        )}

        {recent.length > 0 && (
          <section className="mt-12 pt-8 border-t border-zinc-800/60">
            <h2 className="text-sm font-medium text-zinc-400 mb-3">Recently opened</h2>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {recent.map((f) => (
                <Link
                  key={f._id}
                  to={`/editor/${f.projectId}?file=${f._id}`}
                  className="glass-card p-3 min-w-[160px] shrink-0 hover:border-violet-500/30 transition"
                >
                  <p className="font-medium text-white text-xs truncate">{f.name}</p>
                  <p className="text-[10px] text-zinc-500 truncate">{f.projectTitle}</p>
                  <p className="text-[10px] text-violet-400/80 mt-1">
                    {formatTimeAgo(f.lastOpenedAt)}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <AiAssistantSection />
      </div>

      <CreateProjectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreate}
        loading={creating}
      />
    </Layout>
  );
};

export default Dashboard;
