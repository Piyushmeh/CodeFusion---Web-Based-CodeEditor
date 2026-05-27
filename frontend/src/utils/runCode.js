export const isWebProject = (lang) => ['HTML', 'CSS', 'JavaScript'].includes(lang);

export const buildPreviewHtml = (files) => {
  const htmlFile = files.find((f) => f.name.endsWith('.html'));
  const cssFile = files.find((f) => f.name.endsWith('.css'));
  const jsFile = files.find((f) => f.name.endsWith('.js'));

  let html = htmlFile?.content || '<html><body><p>No HTML file</p></body></html>';
  if (cssFile?.content && !html.includes('style.css')) {
    html = html.replace('</head>', `<style>${cssFile.content}</style></head>`);
    if (!html.includes('</head>')) {
      html = html.replace('<body>', `<style>${cssFile.content}</style><body>`);
    }
  }
  if (jsFile?.content && !html.includes('script.js')) {
    html = html.replace('</body>', `<script>${jsFile.content}<\/script></body>`);
  }
  return html;
};
