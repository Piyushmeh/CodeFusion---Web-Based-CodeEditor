import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { Save, FilePlus, Trash2, FolderOpen, Play, Terminal, X, Square } from 'lucide-react';
import { projectAPI, fileAPI } from '../api/services';
import { monacoLanguage } from '../utils/helpers';
import { isWebProject, buildPreviewHtml } from '../utils/runCode';
import { useTerminalRunner } from '../hooks/useTerminalRunner';
import CompilerTerminal from '../components/CompilerTerminal';
import Logo from '../components/Logo';
import toast from 'react-hot-toast';

const CodeEditorPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [project, setProject] = useState(null);
  const [files, setFiles] = useState([]);
  const [activeFile, setActiveFile] = useState(null);
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [previewHtml, setPreviewHtml] = useState('');
  const [terminalHeight, setTerminalHeight] = useState(200);
  const [showTerminal, setShowTerminal] = useState(true);
  const [stdin, setStdin] = useState('');
  const saveTimer = useRef(null);
  const previewTimer = useRef(null);
  const dragging = useRef(false);
  const editorRef = useRef(null);

  const goToLine = useCallback((lineNumber) => {
    const editor = editorRef.current;
    if (!editor || !lineNumber) return;
    editor.revealLineInCenter(lineNumber);
    editor.setPosition({ lineNumber, column: 1 });
    editor.focus();
  }, []);

  const { terminal, execute, stop, clearTerminal } = useTerminalRunner();
  const running = terminal.running;

  const webProject = isWebProject(project?.language);

  const loadProject = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, fRes] = await Promise.all([
        projectAPI.getOne(projectId),
        fileAPI.getByProject(projectId),
      ]);
      setProject(pRes.data);
      setFiles(fRes.data);
      if (isWebProject(pRes.data.language)) {
        setPreviewHtml(buildPreviewHtml(fRes.data));
      }

      const fileId = searchParams.get('file');
      const initial = fileId
        ? fRes.data.find((f) => f._id === fileId) || fRes.data[0]
        : fRes.data[0];

      if (initial) {
        setActiveFile(initial);
        setContent(initial.content);
      }
    } catch {
      toast.error('Failed to load project');
    } finally {
      setLoading(false);
    }
  }, [projectId, searchParams]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  useEffect(() => {
    const onMove = (e) => {
      if (!dragging.current) return;
      const h = window.innerHeight - e.clientY;
      setTerminalHeight(Math.min(480, Math.max(120, h)));
    };
    const onUp = () => {
      dragging.current = false;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  const selectFile = async (file) => {
    if (activeFile?._id === file._id) return;
    if (activeFile && content !== activeFile.content) {
      await saveFile(activeFile._id, content, false);
    }
    setActiveFile(file);
    setContent(file.content);
  };

  const saveFile = async (fileId, fileContent, showToast = true) => {
    setSaving(true);
    try {
      const { data } = await fileAPI.save(fileId, fileContent);
      setActiveFile(data);
      const updated = files.map((f) => (f._id === data._id ? data : f));
      setFiles(updated);
      if (showToast) toast.success('Saved!');
      return updated;
    } catch {
      toast.error('Save failed');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => {
    if (activeFile) saveFile(activeFile._id, content);
  };

  const updateWebPreview = useCallback((allFiles) => {
    setPreviewHtml(buildPreviewHtml(allFiles));
  }, []);

  const handleChange = (value) => {
    const next = value || '';
    setContent(next);

    if (webProject) {
      if (previewTimer.current) clearTimeout(previewTimer.current);
      previewTimer.current = setTimeout(() => {
        const allFiles = files.map((f) =>
          f._id === activeFile?._id ? { ...f, content: next } : f
        );
        updateWebPreview(allFiles);
      }, 350);
    }

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      if (activeFile) saveFile(activeFile._id, next, false);
    }, 2000);
  };

  const handleRun = async () => {
    if (!activeFile) {
      toast.error('Select a file to run');
      return;
    }

    const allFiles = files.map((f) =>
      f._id === activeFile._id ? { ...f, content } : f
    );

    if (webProject) {
      updateWebPreview(allFiles);
      setShowTerminal(true);
      saveFile(activeFile._id, content, false);
      return;
    }

    setShowTerminal(true);

    try {
      await saveFile(activeFile._id, content, false);
      await execute({
        language: project?.language,
        code: content,
        fileName: activeFile.name,
        stdin,
      });
    } catch (err) {
      toast.error(err.message || 'Run failed');
    }
  };

  const handleStop = () => {
    stop();
  };

  const handleDeleteProject = async () => {
    if (!confirm(`Delete project "${project?.title}" permanently?`)) return;
    try {
      await projectAPI.delete(projectId);
      toast.success('Project deleted');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleDeleteFile = async (file, e) => {
    e?.stopPropagation();
    if (!confirm(`Delete file "${file.name}"?`)) return;
    try {
      await fileAPI.delete(file._id);
      const remaining = files.filter((f) => f._id !== file._id);
      setFiles(remaining);
      if (webProject) updateWebPreview(remaining);
      if (activeFile?._id === file._id) {
        if (remaining[0]) {
          setActiveFile(remaining[0]);
          setContent(remaining[0].content);
        } else {
          setActiveFile(null);
          setContent('');
        }
      }
      toast.success('File deleted');
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleNewFile = async () => {
    const name = prompt('File name (e.g. utils.java):');
    if (!name) return;
    try {
      const { data } = await fileAPI.create(projectId, {
        name,
        path: name,
        content: '',
        language: 'plaintext',
      });
      setFiles([...files, data]);
      selectFile(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center text-zinc-400">
        Loading editor...
      </div>
    );
  }

  const lang =
    monacoLanguage[activeFile?.language] ||
    monacoLanguage[project?.language] ||
    monacoLanguage[project?.language?.toLowerCase()] ||
    'plaintext';

  const needsStdin =
    !webProject && ['Python', 'Java', 'C++', 'JavaScript'].includes(project?.language);

  return (
    <div className="h-screen flex flex-col bg-[#1e1e1e] overflow-hidden">
      <header className="flex items-center justify-between px-4 py-2 bg-zinc-950 border-b border-zinc-800 shrink-0 h-12">
        <Logo className="shrink-0 hover:opacity-90" />
        <p className="text-xs text-zinc-500 truncate mx-4 hidden sm:block">
          {project?.title} · {project?.language}
        </p>
        <div className="flex items-center gap-2 shrink-0">
          {running ? (
            <button
              type="button"
              onClick={handleStop}
              className="bg-red-600 hover:bg-red-500 text-white text-sm py-1.5 px-3 rounded-lg flex items-center gap-1"
            >
              <Square className="w-4 h-4 fill-current" /> Stop
            </button>
          ) : (
            <button
              type="button"
              onClick={handleRun}
              className="bg-green-600 hover:bg-green-500 text-white text-sm py-1.5 px-3 rounded-lg flex items-center gap-1"
            >
              <Play className="w-4 h-4 fill-current" /> Run
            </button>
          )}
          <button type="button" onClick={handleNewFile} className="btn-outline text-sm py-1.5 flex items-center gap-1">
            <FilePlus className="w-4 h-4" /> New
          </button>
          <button
            type="button"
            onClick={handleDeleteProject}
            className="text-red-400 hover:bg-red-500/10 p-2 rounded-lg flex items-center gap-1 text-sm"
            title="Delete entire project"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
          <button type="button" onClick={handleSave} disabled={saving} className="btn-primary text-sm py-1.5 flex items-center gap-1">
            <Save className="w-4 h-4" /> {saving ? '...' : 'Save'}
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <aside className="w-44 md:w-52 bg-zinc-950 border-r border-zinc-800 shrink-0 hidden sm:flex flex-col overflow-hidden">
          <p className="text-xs text-zinc-500 uppercase px-3 py-2 flex items-center gap-1 shrink-0">
            <FolderOpen className="w-3 h-3" /> Files
          </p>
          <div className="flex-1 overflow-y-auto">
            {files.map((f) => (
              <div
                key={f._id}
                className={`flex items-center group ${
                  activeFile?._id === f._id ? 'bg-violet-600/30' : 'hover:bg-zinc-800'
                }`}
              >
                <button
                  type="button"
                  onClick={() => selectFile(f)}
                  className={`flex-1 text-left px-3 py-1.5 text-xs truncate ${
                    activeFile?._id === f._id ? 'text-violet-300' : 'text-zinc-400'
                  }`}
                >
                  {f.name}
                </button>
                <button
                  type="button"
                  onClick={(e) => handleDeleteFile(f, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-red-400"
                  title="Delete file"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
          <div className="flex flex-1 min-h-0 overflow-hidden">
            <div className={`flex flex-col min-h-0 overflow-hidden ${webProject ? 'flex-1' : 'w-full'}`}>
              {activeFile && (
                <div className="px-3 py-1 text-xs text-violet-300 bg-zinc-900 border-b border-zinc-800 shrink-0 flex items-center justify-between">
                  <span>{activeFile.name}</span>
                  {running && (
                    <span className="text-green-400 animate-pulse text-[10px]">● running</span>
                  )}
                </div>
              )}
              <div className="flex-1 min-h-0 relative">
                {activeFile ? (
                  <div className="absolute inset-0">
                    <Editor
                      height="100%"
                      language={lang}
                      theme="vs-dark"
                      value={content}
                      onChange={handleChange}
                      onMount={(editor) => {
                        editorRef.current = editor;
                      }}
                      options={{
                        fontSize: 14,
                        minimap: { enabled: false },
                        wordWrap: 'on',
                        automaticLayout: true,
                        scrollBeyondLastLine: false,
                        padding: { top: 8, bottom: 8 },
                        smoothScrolling: true,
                        quickSuggestions: true,
                        renderValidationDecorations: 'off',
                      }}
                    />
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-zinc-500">No files</div>
                )}
              </div>
            </div>

            {webProject && (
              <div className="w-1/2 max-w-md border-l border-zinc-800 flex flex-col bg-white shrink-0 hidden md:flex min-h-0">
                <p className="text-xs text-zinc-600 bg-zinc-100 px-3 py-1.5 border-b font-medium shrink-0">
                  Live Preview
                </p>
                <iframe
                  title="preview"
                  srcDoc={previewHtml}
                  className="flex-1 w-full bg-white min-h-0"
                  sandbox="allow-scripts"
                />
              </div>
            )}
          </div>

          {showTerminal && !webProject && (
            <CompilerTerminal
              blocks={terminal.blocks}
              running={running}
              durationMs={terminal.durationMs}
              stdin={stdin}
              onStdinChange={setStdin}
              needsStdin={needsStdin}
              onClear={clearTerminal}
              onHide={() => setShowTerminal(false)}
              terminalHeight={terminalHeight}
              onResizeStart={() => {
                dragging.current = true;
              }}
              disabled={running}
              onGoToLine={goToLine}
              activeFileName={activeFile?.name}
            />
          )}

          {showTerminal && webProject && (
            <div className="shrink-0 px-3 py-2 text-xs text-zinc-500 border-t border-zinc-800 bg-zinc-950">
              HTML preview updates live in the side panel.
            </div>
          )}

          {!showTerminal && (
            <button
              type="button"
              onClick={() => setShowTerminal(true)}
              className="shrink-0 flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-400 border-t border-zinc-800 bg-zinc-950"
            >
              <Terminal className="w-3.5 h-3.5" /> Show Terminal ▲
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CodeEditorPage;
