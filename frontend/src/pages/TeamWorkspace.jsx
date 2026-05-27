import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import {
  ChevronLeft, ChevronRight, ChevronDown, ChevronRight as Chevron,
  Plus, MoreHorizontal, Users, Settings, GitBranch, Send,
  File, Folder, FolderOpen, X, Search, Bell, Video,
  Mic, Share2, Circle, Loader2, Hash, Smile, Paperclip, Code2,
  FilePlus, FolderPlus, RefreshCw, LayoutGrid, UserPlus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { teamAPI, projectAPI } from '../api/services';
import toast from 'react-hot-toast';


const LANG_MAP = {
  js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
  css: 'css', scss: 'scss', html: 'html', json: 'json', md: 'markdown',
  py: 'python', rs: 'rust', go: 'go', java: 'java', cpp: 'cpp', c: 'c',
  sh: 'shell', yaml: 'yaml', yml: 'yaml', xml: 'xml', sql: 'sql',
};

const getLanguage = (filename = '') => {
  const ext = filename.split('.').pop()?.toLowerCase();
  return LANG_MAP[ext] || 'plaintext';
};

const getFileIcon = (filename = '', isFolder = false, open = false) => {
  if (isFolder) return open ? <FolderOpen className="w-3.5 h-3.5 text-amber-400" /> : <Folder className="w-3.5 h-3.5 text-amber-400/70" />;
  const ext = filename.split('.').pop()?.toLowerCase();
  const color = {
    jsx: 'text-cyan-400', tsx: 'text-cyan-400', js: 'text-yellow-400',
    ts: 'text-blue-400', css: 'text-violet-400', scss: 'text-pink-400',
    html: 'text-orange-400', json: 'text-green-400', md: 'text-zinc-400',
    py: 'text-green-400',
  }[ext] || 'text-zinc-500';
  return <File className={`w-3.5 h-3.5 ${color}`} />;
};

const formatTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const getInitials = (name = '') =>
  name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase()).join('');

const AVATAR_COLORS = [
  'bg-violet-600', 'bg-blue-600', 'bg-emerald-600',
  'bg-amber-600', 'bg-rose-600', 'bg-cyan-600',
];
const getAvatarColor = (name = '') => {
  const h = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
};

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Avatar circle */
const Avatar = ({ name, src, size = 'sm', online = false }) => {
  const sz = size === 'sm' ? 'w-6 h-6 text-[10px]' : size === 'md' ? 'w-8 h-8 text-xs' : 'w-9 h-9 text-sm';
  return (
    <div className="relative shrink-0">
      {src ? (
        <img src={src} alt={name} className={`${sz} rounded-full object-cover ring-2 ring-zinc-900`} />
      ) : (
        <div className={`${sz} rounded-full ${getAvatarColor(name)} flex items-center justify-center font-semibold text-white ring-2 ring-zinc-900`}>
          {getInitials(name)}
        </div>
      )}
      {online && (
        <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-400 rounded-full ring-2 ring-zinc-950" />
      )}
    </div>
  );
};

/** File tree node */
const FileNode = ({ node, depth = 0, onSelect, activeFileId }) => {
  const [open, setOpen] = useState(depth < 1);
  const isFolder = node.type === 'folder';
  const isActive = !isFolder && node._id === activeFileId;

  return (
    <div>
      <button
        type="button"
        onClick={() => isFolder ? setOpen(o => !o) : onSelect(node)}
        className={`w-full flex items-center gap-1.5 px-2 py-[3px] rounded text-left text-xs transition group
          ${isActive ? 'bg-violet-600/20 text-violet-300' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}`}
        style={{ paddingLeft: `${8 + depth * 12}px` }}
      >
        {isFolder && (
          <span className="text-zinc-600">
            {open ? <ChevronDown className="w-3 h-3" /> : <Chevron className="w-3 h-3" />}
          </span>
        )}
        {getFileIcon(node.name, isFolder, open)}
        <span className="truncate">{node.name}</span>
        {node.hasChanges && <Circle className="w-1.5 h-1.5 fill-violet-400 text-violet-400 ml-auto shrink-0" />}
      </button>
      {isFolder && open && node.children?.map(child => (
        <FileNode key={child._id} node={child} depth={depth + 1} onSelect={onSelect} activeFileId={activeFileId} />
      ))}
    </div>
  );
};

/** Editor tab */
const EditorTab = ({ file, active, onSelect, onClose }) => (
  <button
    type="button"
    onClick={() => onSelect(file)}
    className={`group flex items-center gap-2 px-3.5 py-2 text-xs border-r border-zinc-800 shrink-0 transition max-w-[160px]
      ${active
        ? 'bg-[#1e1e1e] text-white border-b-2 border-b-violet-500'
        : 'bg-zinc-900 text-zinc-500 hover:text-zinc-300 border-b border-b-transparent'
      }`}
  >
    {getFileIcon(file.name)}
    <span className="truncate">{file.name}</span>
    <span
      role="button"
      tabIndex={0}
      onClick={(e) => { e.stopPropagation(); onClose(file); }}
      onKeyDown={(e) => e.key === 'Enter' && onClose(file)}
      className="ml-auto opacity-0 group-hover:opacity-100 hover:text-white rounded p-0.5 transition"
    >
      <X className="w-3 h-3" />
    </span>
  </button>
);

/** Chat message */
const ChatMessage = ({ msg, isOwn }) => (
  <div className={`flex gap-2.5 ${isOwn ? 'flex-row-reverse' : ''}`}>
    <Avatar name={msg.sender?.name || 'U'} src={msg.sender?.avatar} size="sm" />
    <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
      {!isOwn && (
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-semibold text-zinc-300">{msg.sender?.name}</span>
          <span className="text-[10px] text-zinc-600">{formatTime(msg.createdAt)}</span>
        </div>
      )}
      <div className={`px-3 py-2 rounded-xl text-xs leading-relaxed whitespace-pre-wrap break-words
        ${isOwn
          ? 'bg-violet-600 text-white rounded-tr-sm'
          : 'bg-zinc-800 text-zinc-200 rounded-tl-sm'
        }`}
      >
        {msg.content}
      </div>
      {isOwn && <span className="text-[10px] text-zinc-600 mr-1">{formatTime(msg.createdAt)}</span>}
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const TeamWorkspace = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  // Team & project state
  const [team, setTeam] = useState(null);
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [fileTree, setFileTree] = useState([]);
  const [loadingTeam, setLoadingTeam] = useState(true);

  // Editor state
  const [openTabs, setOpenTabs] = useState([]);       // array of file objects
  const [activeFile, setActiveFile] = useState(null); // file object
  const [fileContents, setFileContents] = useState({}); // { fileId: string }
  const [saving, setSaving] = useState(false);
  const [unsaved, setUnsaved] = useState(new Set());
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const saveTimerRef = useRef(null);

  // Chat state
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [onlineMembers, setOnlineMembers] = useState([]);
  const chatBottomRef = useRef(null);

  // Socket ref
  const socketRef = useRef(null);

  // Left sidebar nav
  const [sidebarSection, setSidebarSection] = useState('files'); // 'overview'|'members'|'invites'|'settings'|'files'

  // ── Fetch team & projects ──
  useEffect(() => {
    const load = async () => {
      try {
        setLoadingTeam(true);
        const { data: teamData } = await teamAPI.getById(teamId);
        setTeam(teamData);

        const { data: projectsData } = await teamAPI.getProjects(teamId);
        setProjects(projectsData || []);
        if (projectsData?.length) {
          setActiveProject(projectsData[0]);
        }
      } catch (err) {
        toast.error('Failed to load workspace');
      } finally {
        setLoadingTeam(false);
      }
    };
    load();
  }, [teamId]);

  // ── Fetch file tree when project changes ──
  useEffect(() => {
    if (!activeProject?._id) return;
    const load = async () => {
      try {
        const { data } = await projectAPI.getFileTree(activeProject._id);
        setFileTree(data || []);
      } catch {
        setFileTree([]);
      }
    };
    load();
  }, [activeProject?._id]);

  // ── Socket.IO setup ──
  useEffect(() => {
    let socket;
    try {
      const { io } = require('socket.io-client');
      socket = io(import.meta.env.VITE_SOCKET_URL || window.location.origin, {
        auth: { token: localStorage.getItem('token') },
        transports: ['websocket'],
      });
      socketRef.current = socket;

      socket.emit('join-team', teamId);

      socket.on('chat-message', (msg) => {
        setMessages(prev => [...prev, msg]);
      });

      socket.on('presence-update', (members) => {
        setOnlineMembers(members || []);
      });

      socket.on('file-saved', ({ fileId, content }) => {
        setFileContents(prev => ({ ...prev, [fileId]: content }));
      });
    } catch {
      // Socket.IO not available or not configured — degrade gracefully
    }

    return () => {
      socket?.emit('leave-team', teamId);
      socket?.disconnect();
    };
  }, [teamId]);

  // ── Fetch chat history ──
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await teamAPI.getMessages(teamId);
        setMessages(data || []);
      } catch {
        // no chat history yet
      }
    };
    load();
  }, [teamId]);

  // ── Auto-scroll chat ──
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── File select ──
  const handleFileSelect = useCallback(async (file) => {
    setActiveFile(file);
    setOpenTabs(prev => {
      if (prev.some(t => t._id === file._id)) return prev;
      return [...prev, file];
    });

    if (!fileContents[file._id]) {
      try {
        const { data } = await projectAPI.getFileContent(activeProject._id, file._id);
        setFileContents(prev => ({ ...prev, [file._id]: data.content || '' }));
      } catch {
        setFileContents(prev => ({ ...prev, [file._id]: '' }));
      }
    }
  }, [fileContents, activeProject]);

  // ── Close tab ──
  const handleCloseTab = useCallback((file) => {
    setOpenTabs(prev => {
      const next = prev.filter(t => t._id !== file._id);
      if (activeFile?._id === file._id) {
        setActiveFile(next[next.length - 1] || null);
      }
      return next;
    });
  }, [activeFile]);

  // ── Editor change (autosave) ──
  const handleEditorChange = useCallback((value) => {
    if (!activeFile) return;
    setFileContents(prev => ({ ...prev, [activeFile._id]: value }));
    setUnsaved(prev => new Set(prev).add(activeFile._id));

    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        setSaving(true);
        await projectAPI.saveFile(activeProject._id, activeFile._id, { content: value });
        setUnsaved(prev => {
          const next = new Set(prev);
          next.delete(activeFile._id);
          return next;
        });
        socketRef.current?.emit('file-saved', { teamId, fileId: activeFile._id, content: value });
      } catch {
        // silent autosave fail — user can retry manually
      } finally {
        setSaving(false);
      }
    }, 1200);
  }, [activeFile, activeProject, teamId]);

  // ── Send chat message ──
  const handleSendMessage = async (e) => {
    e.preventDefault();
    const content = chatInput.trim();
    if (!content) return;

    const optimistic = {
      _id: Date.now(),
      content,
      sender: currentUser,
      createdAt: new Date().toISOString(),
      optimistic: true,
    };
    setMessages(prev => [...prev, optimistic]);
    setChatInput('');

    try {
      setSendingMsg(true);
      const { data } = await teamAPI.sendMessage(teamId, { content });
      setMessages(prev => prev.map(m => m._id === optimistic._id ? data : m));
      socketRef.current?.emit('chat-message', { teamId, message: data });
    } catch {
      setMessages(prev => prev.filter(m => m._id !== optimistic._id));
      toast.error('Failed to send message');
      setChatInput(content);
    } finally {
      setSendingMsg(false);
    }
  };

  // ── Create new file ──
  const handleCreateFile = async () => {
    if (!activeProject) return toast.error('Select a project first');
    const name = prompt('File name (e.g. index.js):');
    if (!name?.trim()) return;
    try {
      const { data } = await projectAPI.createFile(activeProject._id, { name: name.trim() });
      setFileTree(prev => [...prev, data]);
      handleFileSelect(data);
      toast.success(`${name} created`);
    } catch {
      toast.error('Failed to create file');
    }
  };

  if (loadingTeam) {
    return (
      <div className="min-h-screen bg-[#0d0d10] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
      </div>
    );
  }

  const membersOnline = onlineMembers.length
    ? onlineMembers
    : team?.members?.slice(0, 4).map(m => m.user) || [];

  return (
    <div className="flex h-screen bg-[#0d0d10] overflow-hidden text-zinc-300 font-mono text-[13px]">

      {/* ══════════════════════════════════════════════════════
          LEFT SIDEBAR
      ══════════════════════════════════════════════════════ */}
      <aside className="w-[220px] shrink-0 flex flex-col bg-[#111114] border-r border-zinc-800/60 overflow-hidden">

        {/* Team header */}
        <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-zinc-800/60">
          <Link to="/teams" className="text-zinc-600 hover:text-zinc-300 transition">
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{team?.name || 'Workspace'}</p>
            <p className="text-[10px] text-zinc-600 flex items-center gap-1">
              <Circle className="w-1.5 h-1.5 fill-emerald-400 text-emerald-400" />
              {team?.members?.length || 0} members
            </p>
          </div>
          <button type="button" className="text-zinc-600 hover:text-zinc-300 transition p-1 rounded hover:bg-zinc-800">
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Team nav */}
        <nav className="px-2 pt-3 pb-2 space-y-0.5">
          <p className="text-[10px] text-zinc-600 font-semibold uppercase tracking-wider px-2 pb-1">Team</p>
          {[
            { id: 'overview', label: 'Overview', Icon: LayoutGrid },
            { id: 'members',  label: 'Members',  Icon: Users },
            { id: 'invites',  label: 'Invites',  Icon: UserPlus },
            { id: 'settings', label: 'Settings', Icon: Settings },
          ].map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setSidebarSection(id)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition
                ${sidebarSection === id
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300'
                }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        <div className="mx-3 my-1 border-t border-zinc-800/60" />

        {/* Projects */}
        <div className="px-2 pt-2 pb-1">
          <div className="flex items-center justify-between px-2 pb-1">
            <p className="text-[10px] text-zinc-600 font-semibold uppercase tracking-wider">Projects</p>
            <button type="button" className="text-zinc-600 hover:text-zinc-300 transition" title="New project">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-0.5 max-h-[130px] overflow-y-auto">
            {projects.length === 0 && (
              <p className="text-[11px] text-zinc-600 px-2 py-1">No projects yet</p>
            )}
            {projects.map(p => (
              <button
                key={p._id}
                type="button"
                onClick={() => setActiveProject(p)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition truncate
                  ${activeProject?._id === p._id
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300'
                  }`}
              >
                <Code2 className="w-3.5 h-3.5 shrink-0 text-violet-400/70" />
                <span className="truncate">{p.name}</span>
                {p.hasChanges && <Circle className="w-1.5 h-1.5 fill-violet-400 text-violet-400 ml-auto shrink-0" />}
              </button>
            ))}
          </div>
        </div>

        <div className="mx-3 my-1 border-t border-zinc-800/60" />

        {/* File tree */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-1.5">
            <p className="text-[10px] text-zinc-600 font-semibold uppercase tracking-wider">Files</p>
            <div className="flex items-center gap-1">
              <button type="button" onClick={handleCreateFile} className="text-zinc-600 hover:text-zinc-300 transition" title="New file">
                <FilePlus className="w-3.5 h-3.5" />
              </button>
              <button type="button" className="text-zinc-600 hover:text-zinc-300 transition" title="New folder">
                <FolderPlus className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => activeProject && projectAPI.getFileTree(activeProject._id).then(r => setFileTree(r.data || []))}
                className="text-zinc-600 hover:text-zinc-300 transition"
                title="Refresh"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-1 pb-4 space-y-0.5">
            {fileTree.length === 0 ? (
              <p className="text-[11px] text-zinc-600 px-3 py-2">
                {activeProject ? 'No files yet' : 'Select a project'}
              </p>
            ) : (
              fileTree.map(node => (
                <FileNode
                  key={node._id}
                  node={node}
                  onSelect={handleFileSelect}
                  activeFileId={activeFile?._id}
                />
              ))
            )}
          </div>
        </div>
      </aside>

      {/* ══════════════════════════════════════════════════════
          CENTER — EDITOR
      ══════════════════════════════════════════════════════ */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-zinc-800/60 bg-[#111114] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex items-center gap-1.5">
              <Circle className="w-2 h-2 fill-emerald-400 text-emerald-400" />
              <span className="text-xs font-semibold text-white">{team?.name}</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-700" />
            <span className="text-xs text-zinc-500 truncate">{activeProject?.name || 'No project'}</span>
          </div>

          {/* Online member avatars */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex -space-x-1.5">
              {membersOnline.slice(0, 5).map((m, i) => (
                <Avatar key={m?._id || i} name={m?.name || 'U'} src={m?.avatar} size="sm" online />
              ))}
              {membersOnline.length > 5 && (
                <div className="w-6 h-6 rounded-full bg-zinc-800 ring-2 ring-zinc-900 flex items-center justify-center text-[9px] text-zinc-400 font-medium">
                  +{membersOnline.length - 5}
                </div>
              )}
            </div>

            <button type="button" className="p-1.5 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition">
              <Mic className="w-4 h-4" />
            </button>
            <button type="button" className="p-1.5 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition">
              <Video className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white px-3 py-1.5 rounded-lg transition"
            >
              <UserPlus className="w-3.5 h-3.5" /> Invite
            </button>
          </div>
        </div>

        {/* File name breadcrumb (active file) */}
        {activeFile && (
          <div className="flex items-center gap-1.5 px-4 py-1.5 border-b border-zinc-800/40 bg-[#0d0d10] shrink-0">
            <span className="text-[11px] text-zinc-600">
              {activeProject?.name}
            </span>
            <ChevronRight className="w-3 h-3 text-zinc-700" />
            <span className="text-[11px] text-zinc-400">{activeFile.name}</span>
            {unsaved.has(activeFile._id) && (
              <Circle className="w-1.5 h-1.5 fill-violet-400 text-violet-400 ml-1" />
            )}
            {saving && <span className="text-[10px] text-zinc-600 ml-1">Saving…</span>}
          </div>
        )}

        {/* Tab bar */}
        <div className="flex items-center border-b border-zinc-800/60 bg-zinc-900 overflow-x-auto shrink-0 scrollbar-none">
          {openTabs.map(tab => (
            <EditorTab
              key={tab._id}
              file={tab}
              active={activeFile?._id === tab._id}
              onSelect={setActiveFile}
              onClose={handleCloseTab}
            />
          ))}
        </div>

        {/* Monaco editor */}
        <div className="flex-1 overflow-hidden">
          {activeFile ? (
            <Editor
              height="100%"
              language={getLanguage(activeFile.name)}
              value={fileContents[activeFile._id] ?? ''}
              onChange={handleEditorChange}
              onMount={(editor, monaco) => {
                editorRef.current = editor;
                monacoRef.current = monaco;
              }}
              theme="vs-dark"
              options={{
                fontSize: 13,
                fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
                fontLigatures: true,
                lineHeight: 22,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                renderLineHighlight: 'gutter',
                overviewRulerBorder: false,
                hideCursorInOverviewRuler: true,
                padding: { top: 16, bottom: 16 },
                scrollbar: { verticalScrollbarSize: 4, horizontalScrollbarSize: 4 },
                smoothScrolling: true,
                cursorBlinking: 'smooth',
                cursorSmoothCaretAnimation: 'on',
                bracketPairColorization: { enabled: true },
                guides: { bracketPairs: true, indentation: true },
                tabSize: 2,
                wordWrap: 'off',
                stickyScroll: { enabled: true },
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                <File className="w-5 h-5 text-zinc-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-400">No file open</p>
                <p className="text-xs text-zinc-600 mt-0.5">Select a file from the sidebar to start editing</p>
              </div>
              <button
                type="button"
                onClick={handleCreateFile}
                className="inline-flex items-center gap-1.5 text-xs text-violet-400 border border-violet-500/30 hover:bg-violet-500/10 px-3 py-1.5 rounded-lg transition mt-1"
              >
                <FilePlus className="w-3.5 h-3.5" /> Create new file
              </button>
            </div>
          )}
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between px-4 py-1 border-t border-zinc-800/60 bg-[#111114] shrink-0 text-[10px] text-zinc-600">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <GitBranch className="w-3 h-3" /> main
            </span>
            {activeFile && (
              <span>{getLanguage(activeFile.name)}</span>
            )}
          </div>
          <div className="flex items-center gap-4">
            {saving && <span className="text-violet-400">Saving…</span>}
            <span>UTF-8</span>
            <span>LF</span>
            {activeFile && <span>{getLanguage(activeFile.name).toUpperCase()}</span>}
          </div>
        </div>
      </main>

      {/* ══════════════════════════════════════════════════════
          RIGHT SIDEBAR — TEAM CHAT
      ══════════════════════════════════════════════════════ */}
      <aside className="w-[280px] shrink-0 flex flex-col bg-[#111114] border-l border-zinc-800/60 overflow-hidden">

        {/* Chat header */}
        <div className="flex items-center justify-between gap-2 px-4 py-3.5 border-b border-zinc-800/60 shrink-0">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold text-white">Team Chat</p>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-600" />
          </div>
          <div className="flex items-center gap-1">
            <button type="button" className="p-1.5 rounded text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition">
              <Search className="w-3.5 h-3.5" />
            </button>
            <button type="button" className="p-1.5 rounded text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition">
              <UserPlus className="w-3.5 h-3.5" />
            </button>
            <button type="button" className="p-1.5 rounded text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition">
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Channel label */}
        <div className="px-4 py-2 border-b border-zinc-800/40 shrink-0">
          <span className="text-[11px] text-zinc-500 flex items-center gap-1">
            <Hash className="w-3 h-3" /> general
          </span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 scrollbar-thin scrollbar-thumb-zinc-800">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <p className="text-xs text-zinc-600">No messages yet. Say hello! 👋</p>
            </div>
          )}
          {messages.map((msg) => (
            <ChatMessage
              key={msg._id}
              msg={msg}
              isOwn={msg.sender?._id === currentUser?._id}
            />
          ))}
          <div ref={chatBottomRef} />
        </div>

        {/* Message input */}
        <div className="px-3 py-3 border-t border-zinc-800/60 shrink-0">
          <form onSubmit={handleSendMessage} className="flex items-end gap-2">
            <div className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 flex flex-col gap-1">
              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                placeholder="Type a message..."
                rows={1}
                className="w-full bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none resize-none leading-relaxed"
                style={{ maxHeight: '80px', overflowY: 'auto' }}
              />
              <div className="flex items-center gap-1.5">
                <button type="button" className="text-zinc-600 hover:text-zinc-400 transition">
                  <Smile className="w-3.5 h-3.5" />
                </button>
                <button type="button" className="text-zinc-600 hover:text-zinc-400 transition">
                  <Paperclip className="w-3.5 h-3.5" />
                </button>
                <button type="button" className="text-zinc-600 hover:text-zinc-400 transition">
                  <Code2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={!chatInput.trim() || sendingMsg}
              className="p-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white rounded-xl transition shrink-0"
            >
              {sendingMsg
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Send className="w-4 h-4" />
              }
            </button>
          </form>
        </div>
      </aside>

    </div>
  );
};

export default TeamWorkspace;