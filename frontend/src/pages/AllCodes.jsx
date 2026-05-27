import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Grid3X3,
  List,
  Plus,
  Loader2,
  FolderOpen,
  Star,
} from 'lucide-react';
import Layout from '../components/Layout';
import ProjectCard from '../components/ProjectCard';
import CreateProjectModal from '../components/CreateProjectModal';
import { projectAPI } from '../api/services';
import { parseProjectsResponse } from '../utils/projectsApi';
import toast from 'react-hot-toast';

const LANGUAGES = ['All', 'Java', 'Python', 'C++', 'JavaScript', 'HTML', 'CSS'];
const PAGE_SIZE = 12;

const AllCodes = () => {
  const navigate = useNavigate();
  const loadMoreRef = useRef(null);

  const [projects, setProjects] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [search, setSearch] = useState('');
  const [langFilter, setLangFilter] = useState('All');
  const [visibility, setVisibility] = useState('all');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sort, setSort] = useState('updated');
  const [view, setView] = useState('grid');

  const [modalOpen, setModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const buildParams = useCallback(
    (pageNum) => {
      const params = {
        page: pageNum,
        limit: PAGE_SIZE,
        sort,
      };
      if (search.trim()) params.search = search.trim();
      if (langFilter !== 'All') params.language = langFilter;
      if (favoritesOnly) params.filter = 'starred';
      else if (visibility === 'public') params.filter = 'public';
      else if (visibility === 'private') params.filter = 'private';
      return params;
    },
    [search, langFilter, visibility, favoritesOnly, sort]
  );

  const fetchPage = useCallback(
    async (pageNum, append = false) => {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      try {
        const { data } = await projectAPI.getAll(buildParams(pageNum));
        const parsed = parseProjectsResponse(data);

        setProjects((prev) =>
          append ? [...prev, ...parsed.projects] : parsed.projects
        );
        setTotal(parsed.total);
        setPage(parsed.page);
        setHasMore(parsed.hasMore);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load projects');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [buildParams]
  );

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      fetchPage(1, false);
    }, 300);
    return () => clearTimeout(t);
  }, [search, langFilter, visibility, favoritesOnly, sort, fetchPage]);

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el || !hasMore || loading || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          fetchPage(page + 1, true);
        }
      },
      { rootMargin: '120px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, page, fetchPage]);

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

  const handleDelete = async (project) => {
    if (!confirm(`Delete "${project.title}"?`)) return;
    try {
      await projectAPI.delete(project._id);
      toast.success('Deleted');
      fetchPage(1, false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const toggleStar = async (project) => {
    await projectAPI.update(project._id, { starred: !project.starred });
    setProjects((prev) =>
      prev.map((p) =>
        p._id === project._id ? { ...p, starred: !p.starred } : p
      )
    );
  };

  const togglePin = async (project) => {
    await projectAPI.update(project._id, { pinned: !project.pinned });
    fetchPage(1, false);
  };

  return (
    <Layout projectCount={total}>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">All Codes</h1>
            <p className="text-sm text-zinc-500 mt-1">
              {total} project{total !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" /> New Project
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              className="input-dark pl-10 text-sm"
              placeholder="Search by title or language..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="input-dark w-full lg:w-44 text-sm"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="updated">Recently Updated</option>
            <option value="views">Most Viewed</option>
            <option value="starred">Most Starred</option>
            <option value="title">A → Z</option>
            <option value="title-desc">Z → A</option>
            <option value="created">Newest</option>
            <option value="created-asc">Oldest</option>
          </select>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setView('grid')}
              className={`p-2 rounded-lg border ${
                view === 'grid'
                  ? 'border-violet-500 text-violet-400 bg-violet-500/10'
                  : 'border-zinc-700 text-zinc-500'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setView('list')}
              className={`p-2 rounded-lg border ${
                view === 'list'
                  ? 'border-violet-500 text-violet-400 bg-violet-500/10'
                  : 'border-zinc-700 text-zinc-500'
              }`}
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
              className={`px-2.5 py-1 rounded-md text-xs transition ${
                langFilter === lang
                  ? 'bg-violet-600 text-white'
                  : 'bg-zinc-800/60 text-zinc-400 hover:text-white'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { id: 'all', label: 'All' },
            { id: 'public', label: 'Public' },
            { id: 'private', label: 'Private' },
          ].map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => {
                setVisibility(v.id);
                setFavoritesOnly(false);
              }}
              className={`px-2.5 py-1 rounded-md text-xs border transition ${
                visibility === v.id && !favoritesOnly
                  ? 'border-violet-500/50 text-violet-300 bg-violet-500/10'
                  : 'border-zinc-700 text-zinc-500'
              }`}
            >
              {v.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setFavoritesOnly((f) => !f);
              if (!favoritesOnly) setVisibility('all');
            }}
            className={`px-2.5 py-1 rounded-md text-xs border flex items-center gap-1 transition ${
              favoritesOnly
                ? 'border-yellow-500/50 text-yellow-300 bg-yellow-500/10'
                : 'border-zinc-700 text-zinc-500'
            }`}
          >
            <Star className="w-3 h-3" /> Favorites
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="glass-card h-48 animate-pulse" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="glass-card py-16 px-6 text-center max-w-md mx-auto">
            <FolderOpen className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-white mb-2">No projects yet</h2>
            <p className="text-sm text-zinc-500 mb-6">
              {search || langFilter !== 'All' || favoritesOnly
                ? 'Try adjusting your search or filters.'
                : 'Create your first code project to get started.'}
            </p>
            <button type="button" onClick={() => setModalOpen(true)} className="btn-primary">
              <Plus className="w-4 h-4 inline mr-1" /> Create New Project
            </button>
          </div>
        ) : (
          <>
            <div
              className={
                view === 'grid'
                  ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3'
                  : 'space-y-2'
              }
            >
              {projects.map((p) => (
                <ProjectCard
                  key={p._id}
                  project={p}
                  view={view}
                  onToggleStar={toggleStar}
                  onTogglePin={togglePin}
                  onDelete={handleDelete}
                />
              ))}
            </div>
            {hasMore && (
              <div ref={loadMoreRef} className="flex justify-center py-8">
                {loadingMore && (
                  <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
                )}
              </div>
            )}
          </>
        )}
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

export default AllCodes;
