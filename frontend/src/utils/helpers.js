export const languageColors = {
  Python: 'text-green-400 bg-green-500/10 border-green-500/30',
  Java: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  'C++': 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  HTML: 'text-orange-300 bg-orange-500/10 border-orange-500/30',
  CSS: 'text-blue-300 bg-blue-500/10 border-blue-500/30',
  JavaScript: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
};

export const monacoLanguage = {
  python: 'python',
  java: 'java',
  cpp: 'cpp',
  'c++': 'cpp',
  html: 'html',
  css: 'css',
  javascript: 'javascript',
  plaintext: 'plaintext',
  Python: 'python',
  Java: 'java',
  'C++': 'cpp',
  HTML: 'html',
  CSS: 'css',
  JavaScript: 'javascript',
};

export const formatTimeAgo = (date) => {
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
  if (seconds < 60) return `Opened ${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Opened ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Opened ${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `Opened ${days}d ago`;
};

export const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
