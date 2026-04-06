const API_BASE = 'http://localhost:3001/api';

export const apiClient = {
  async viewFile(args: any) {
    const res = await fetch(`${API_BASE}/fs/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(args),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to read file');
    }
    return res.json();
  },

  async createFile(args: any) {
    const res = await fetch(`${API_BASE}/fs/write`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(args),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create file');
    }
    return res.json();
  },

  async editFile(args: any) {
    const res = await fetch(`${API_BASE}/fs/edit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(args),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to edit file');
    }
    return res.json();
  },

  async multiEditFile(args: any) {
    const res = await fetch(`${API_BASE}/fs/multi-edit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(args),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to multi-edit file');
    }
    return res.json();
  },

  async shellExec(args: any) {
    const res = await fetch(`${API_BASE}/shell/exec`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(args),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to execute shell command');
    }
    return res.json();
  }
};
