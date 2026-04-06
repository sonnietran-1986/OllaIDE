export let workspaceHandle: FileSystemDirectoryHandle | null = null;

export async function selectWorkspace(): Promise<boolean> {
  try {
    workspaceHandle = await window.showDirectoryPicker({
      mode: 'readwrite'
    });
    return true;
  } catch (error) {
    console.error("Error selecting workspace:", error);
    return false;
  }
}

export async function getFileHandle(path: string, create = false): Promise<FileSystemFileHandle | null> {
  if (!workspaceHandle) return null;
  
  const parts = path.split('/').filter(p => p);
  let currentHandle = workspaceHandle;
  
  for (let i = 0; i < parts.length - 1; i++) {
    try {
      currentHandle = await currentHandle.getDirectoryHandle(parts[i], { create });
    } catch (e) {
      return null;
    }
  }
  
  try {
    return await currentHandle.getFileHandle(parts[parts.length - 1], { create });
  } catch (e) {
    return null;
  }
}

export async function readFile(path: string): Promise<string | null> {
  const handle = await getFileHandle(path);
  if (!handle) return null;
  const file = await handle.getFile();
  return await file.text();
}

export async function writeFile(path: string, content: string): Promise<boolean> {
  const handle = await getFileHandle(path, true);
  if (!handle) return false;
  const writable = await handle.createWritable();
  await writable.write(content);
  await writable.close();
  return true;
}

export async function ensureDirectory(path: string): Promise<boolean> {
  if (!workspaceHandle) return false;
  const parts = path.split('/').filter(p => p);
  let currentHandle = workspaceHandle;
  for (const part of parts) {
    try {
      currentHandle = await currentHandle.getDirectoryHandle(part, { create: true });
    } catch (e) {
      return false;
    }
  }
  return true;
}
