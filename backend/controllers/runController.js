import {
  executeCodeStream,
  isSupportedLanguage,
  resultToLines,
} from '../services/compilerService.js';

export const executeCode = async (req, res) => {
  const { language, code, fileName, stdin } = req.body;

  if (!code?.trim()) {
    return res.status(400).json({ message: 'No code to run' });
  }

  if (!isSupportedLanguage(language)) {
    return res.status(400).json({
      message: `${language} is not supported for server execution. Use the in-browser preview for HTML/CSS.`,
    });
  }

  try {
    const result = await executeCodeStream({
      language,
      code,
      fileName,
      stdin: stdin || '',
      hooks: {},
    });

    const lines = resultToLines(result);

    res.json({
      success: result.success,
      lines,
      message: result.message,
    });
  } catch (err) {
    console.error('[run] execute error:', err.message);
    res.status(500).json({
      success: false,
      message: err.message,
      lines: [{ kind: 'error', type: 'Error', message: err.message }],
    });
  }
};
