import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Plus, Search, ChevronDown, SlidersHorizontal,
  ArrowRight, Loader2, Sparkles, Clock, X
} from 'lucide-react';
import Layout from '../components/Layout';
import { teamAPI } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { formatTimeAgo } from '../utils/helpers';
import toast from 'react-hot-toast';


const getInitials = (name = '') =>
  name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');


const AVATAR_PALETTES = [
  { bg: 'bg-violet-600/20', text: 'text-violet-400', border: 'border-violet-500/20' },
  { bg: 'bg-blue-600/20',   text: 'text-blue-400',   border: 'border-blue-500/20'   },
  { bg: 'bg-emerald-600/20',text: 'text-emerald-400',border: 'border-emerald-500/20'},
  { bg: 'bg-amber-600/20',  text: 'text-amber-400',  border: 'border-amber-500/20'  },
  { bg: 'bg-rose-600/20',   text: 'text-rose-400',   border: 'border-rose-500/20'   },
  { bg: 'bg-cyan-600/20',   text: 'text-cyan-400',   border: 'border-cyan-500/20'   },
];

const getPalette = (name = '') => {
  const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_PALETTES[hash % AVATAR_PALETTES.length];
};


const StatItem = ({ value, label }) => (
  <div className="flex flex-col">
    <span className="text-sm font-semibold text-white">{value}</span>
    <span className="text-xs text-zinc-500">{label}</span>
  </div>
);


const TeamCard = ({ team, currentUser, onClick }) => {
  const palette = getPalette(team.name);
  const initials = getInitials(team.name);

  const currentUserRole = (() => {
    if (team.owner?._id === currentUser?._id) return 'Owner';
    const m = team.members?.find((m) => m.user?._id === currentUser?._id);
    if (m?.role === 'admin') return 'Admin';
    if (m?.role === 'editor') return 'Editor';
    return 'Viewer';
  })();

  const visibleMembers = team.members?.slice(0, 5) || [];
  const extra = (team.members?.length || 0) - visibleMembers.length;

  const lastActive = team.lastActiveAt ? formatTimeAgo(team.lastActiveAt) : null;

  return (
    <motion.div
      layout
      className="group relative bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-4 hover:border-zinc-700 transition-all duration-200"
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border text-sm font-bold ${palette.bg} ${palette.text} ${palette.border}`}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-white truncate group-hover:text-violet-300 transition-colors">
              {team.name}
            </h3>
            {team.online !== undefined && (
              <span
                className={`flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                  team.online
                    ? 'text-emerald-400 bg-emerald-500/10'
                    : 'text-zinc-500 bg-zinc-800'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full inline-block ${
                    team.online ? 'bg-emerald-400' : 'bg-zinc-600'
                  }`}
                />
                {team.online ? 'Online' : 'Offline'}
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">
            {team.description || 'Collaborative workspace'}
          </p>
        </div>
      </div>

      {/* Member avatars */}
      <div className="flex -space-x-1.5">
        {visibleMembers.map((m) => {
          const src =
            m.user?.avatar ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(m.user?.name || 'U')}&background=3f3f46&color=a1a1aa&size=32`;
          return (
            <img
              key={m.user?._id || Math.random()}
              src={src}
              alt={m.user?.name || 'Member'}
              title={m.user?.name}
              className="w-6 h-6 rounded-full ring-2 ring-zinc-900 object-cover"
            />
          );
        })}
        {extra > 0 && (
          <div className="w-6 h-6 rounded-full bg-zinc-800 ring-2 ring-zinc-900 flex items-center justify-center text-[9px] text-zinc-400 font-medium">
            +{extra}
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-5 text-xs">
        <StatItem value={team.members?.length ?? 0} label="Members" />
        <div className="h-4 w-px bg-zinc-800" />
        <StatItem value={team.projectCount ?? 0} label="Projects" />
        <div className="h-4 w-px bg-zinc-800" />
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-violet-400">{currentUserRole}</span>
          <span className="text-xs text-zinc-500">You</span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
        {lastActive ? (
          <span className="flex items-center gap-1.5 text-[11px] text-zinc-500">
            <Clock className="w-3 h-3" />
            Last active {lastActive}
          </span>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={onClick}
          className="text-xs text-violet-400 border border-violet-500/30 hover:bg-violet-500/10 px-3 py-1.5 rounded-lg transition-all inline-flex items-center gap-1 font-medium"
        >
          View Team <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </motion.div>
  );
};

// Create Team Modal
const CreateTeamModal = ({ open, onClose, onCreated }) => {
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Team name is required');
    try {
      setCreating(true);
      const { data } = await teamAPI.create(form);
      toast.success('Team created!');
      setForm({ name: '', description: '' });
      onClose();
      onCreated?.();
      navigate(`/team/${data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create team');
    } finally {
      setCreating(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18 }}
            className="relative z-10 w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-5 shadow-2xl"
          >
            {/* Modal header */}
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-400" />
                Create Team Workspace
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="text-zinc-500 hover:text-zinc-300 p-1.5 rounded-lg hover:bg-zinc-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400">Team Name</label>
                <input
                  type="text"
                  placeholder="e.g. Code Crafters"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 transition"
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400">Description <span className="text-zinc-600">(optional)</span></label>
                <textarea
                  placeholder="What is this team building?"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full resize-none bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 transition"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-700 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {creating ? 'Creating…' : 'Create Team'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};


const Teams = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [acceptToken, setAcceptToken] = useState('');
  const [joining, setJoining] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const { data } = await teamAPI.getAll();
      setTeams(data);
    } catch {
      toast.error('Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTeams(); }, []);

  const handleJoin = async (e) => {
    e.preventDefault();
    const token = acceptToken.trim();
    if (!token) return toast.error('Please enter a valid invite token');
    try {
      setJoining(true);
      const { data } = await teamAPI.acceptInvite(token);
      toast.success('Joined team!');
      setAcceptToken('');
      fetchTeams();
      navigate(`/team/${data.teamId}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired invite token');
    } finally {
      setJoining(false);
    }
  };

  const filteredTeams = useMemo(() => {
    return teams.filter((team) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        team.name.toLowerCase().includes(q) ||
        team.description?.toLowerCase().includes(q);

      const isOwner = team.owner?._id === currentUser?._id;
      const isMember = team.members?.some(
        (m) => m.user?._id === currentUser?._id && m.role !== 'owner'
      );

      if (filterType === 'Owned') return matchesSearch && isOwner;
      if (filterType === 'Joined') return matchesSearch && isMember;
      return matchesSearch;
    });
  }, [teams, searchQuery, filterType, currentUser]);

  const stats = useMemo(() => {
    const totalMembers = teams.reduce((a, t) => a + (t.members?.length || 0), 0);
    const totalProjects = teams.reduce((a, t) => a + (t.projectCount || 0), 0);
    return { totalTeams: teams.length, totalMembers, totalProjects };
  }, [teams]);

  return (
    <Layout>
      <div className="max-w-[1280px] mx-auto space-y-6 px-1">


        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
              <Users className="w-6 h-6 text-violet-400" />
              Teams
            </h1>
            <p className="text-sm text-zinc-500 mt-0.5">Collaborate, build and ship together</p>

            {/* Stats */}
            {!loading && (
              <div className="flex items-center gap-6 mt-3">
                <div className="text-xs text-zinc-500">
                  <span className="font-semibold text-white">{stats.totalTeams}</span>{' '}
                  {stats.totalTeams === 1 ? 'team' : 'teams'}
                </div>
                <div className="text-xs text-zinc-500">
                  <span className="font-semibold text-white">{stats.totalMembers}</span> members
                </div>
                <div className="text-xs text-zinc-500">
                  <span className="font-semibold text-white">{stats.totalProjects}</span> projects
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all self-start sm:self-start mt-0.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            Create Team
          </button>
        </div>

        {/* ── Toolbar ── */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-700 transition"
            />
          </div>

          <div className="flex gap-2">
            <div className="relative">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="appearance-none bg-zinc-900 border border-zinc-800 rounded-lg pl-3 pr-9 py-2 text-sm text-white focus:outline-none focus:border-zinc-700 transition cursor-pointer [color-scheme:dark]"
              >
                <option value="All">All Teams</option>
                <option value="Owned">Owned by me</option>
                <option value="Joined">Joined teams</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
            </div>

            <button
              type="button"
              className="px-3 border border-zinc-800 bg-zinc-900 rounded-lg hover:border-zinc-700 text-zinc-500 hover:text-zinc-300 transition"
              aria-label="Advanced filter"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>


        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-white">Join a team</p>
            <p className="text-xs text-zinc-500 mt-0.5">Enter an invite token to join an existing team</p>
          </div>
          <form onSubmit={handleJoin} className="flex gap-2 flex-1 max-w-md w-full">
            <input
              type="text"
              placeholder="Paste invite token"
              value={acceptToken}
              onChange={(e) => setAcceptToken(e.target.value)}
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-700 transition"
            />
            <button
              type="submit"
              disabled={joining}
              className="shrink-0 inline-flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50"
            >
              {joining ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              Join
            </button>
          </form>
        </div>


        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-[220px] bg-zinc-900 border border-zinc-800 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : filteredTeams.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
              <Users className="w-5 h-5 text-zinc-500" />
            </div>
            <h2 className="text-base font-semibold text-white mb-1">No teams yet</h2>
            <p className="text-sm text-zinc-500 mb-6 max-w-xs leading-relaxed">
              Create your first team and start collaborating with your friends.
            </p>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
            >
              <Plus className="w-4 h-4" />
              Create Your First Team
            </button>
          </div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filteredTeams.map((team) => (
              <TeamCard
                key={team._id}
                team={team}
                currentUser={currentUser}
                onClick={() => navigate(`/team/${team._id}`)}
              />
            ))}
          </motion.div>
        )}

      </div>


      <CreateTeamModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={fetchTeams}
      />
    </Layout>
  );
};

export default Teams;