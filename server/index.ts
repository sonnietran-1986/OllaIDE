import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Helper to get absolute path and prevent directory traversal outside project
const getSafePath = (targetPath: string) => {
  // In a real app, you'd want to restrict this to the project directory.
  // For now, we trust the absolute path provided by the agent.
  return targetPath;
};

// 1. Read File
app.post('/api/fs/read', async (req, res) => {
  try {
    const { AbsolutePath, StartLine, EndLine } = req.body;
    if (!AbsolutePath) {
      return res.status(400).json({ error: 'AbsolutePath is required' });
    }

    const safePath = getSafePath(AbsolutePath);
    const content = await fs.readFile(safePath, 'utf-8');

    if (StartLine !== undefined || EndLine !== undefined) {
      const lines = content.split('\n');
      const start = StartLine ? Math.max(0, StartLine - 1) : 0;
      const end = EndLine ? Math.min(lines.length, EndLine) : lines.length;
      return res.json({ content: lines.slice(start, end).join('\n') });
    }

    res.json({ content });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Write File (Create/Overwrite)
app.post('/api/fs/write', async (req, res) => {
  try {
    const { TargetFile, Content, Overwrite } = req.body;
    if (!TargetFile) {
      return res.status(400).json({ error: 'TargetFile is required' });
    }

    const safePath = getSafePath(TargetFile);
    
    try {
      await fs.access(safePath);
      // File exists
      if (!Overwrite) {
        return res.status(400).json({ error: 'File already exists and Overwrite is false' });
      }
    } catch {
      // File does not exist, create directory if needed
      await fs.mkdir(path.dirname(safePath), { recursive: true });
    }

    await fs.writeFile(safePath, Content || '', 'utf-8');
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Edit File (Search and Replace)
app.post('/api/fs/edit', async (req, res) => {
  try {
    const { TargetFile, TargetContent, ReplacementContent } = req.body;
    if (!TargetFile || TargetContent === undefined || ReplacementContent === undefined) {
      return res.status(400).json({ error: 'TargetFile, TargetContent, and ReplacementContent are required' });
    }

    const safePath = getSafePath(TargetFile);
    const content = await fs.readFile(safePath, 'utf-8');

    if (!content.includes(TargetContent)) {
      return res.status(400).json({ error: 'TargetContent not found in file' });
    }

    const newContent = content.replace(TargetContent, ReplacementContent);
    await fs.writeFile(safePath, newContent, 'utf-8');
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Multi Edit File
app.post('/api/fs/multi-edit', async (req, res) => {
  try {
    const { TargetFile, ReplacementChunks } = req.body;
    if (!TargetFile || !Array.isArray(ReplacementChunks)) {
      return res.status(400).json({ error: 'TargetFile and ReplacementChunks array are required' });
    }

    const safePath = getSafePath(TargetFile);
    let content = await fs.readFile(safePath, 'utf-8');

    for (const chunk of ReplacementChunks) {
      if (!content.includes(chunk.TargetContent)) {
        return res.status(400).json({ error: `TargetContent not found: ${chunk.TargetContent.substring(0, 50)}...` });
      }
      content = content.replace(chunk.TargetContent, chunk.ReplacementContent);
    }

    await fs.writeFile(safePath, content, 'utf-8');
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Shell Exec
app.post('/api/shell/exec', async (req, res) => {
  try {
    const { command } = req.body;
    if (!command) {
      return res.status(400).json({ error: 'command is required' });
    }

    // Security warning: In a real app, executing arbitrary shell commands from the frontend is dangerous.
    // This is for the local companion server used by the agent.
    try {
      const { stdout, stderr } = await execAsync(command, { cwd: process.cwd() });
      res.json({ stdout, stderr, exitCode: 0 });
    } catch (error: any) {
      res.json({ 
        stdout: error.stdout || '', 
        stderr: error.stderr || error.message, 
        exitCode: error.code || 1 
      });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`[OllaIDE Companion Server] Running on http://localhost:${PORT}`);
});
