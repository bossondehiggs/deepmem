import fs from 'fs';
import path from 'path';
import os from 'os';

const DATA_DIR = path.join(os.homedir(), '.deepmem');
const DATA_FILE = path.join(DATA_DIR, 'memories.json');

export class MemoryStore {
  constructor() {
    this.memories = [];
    this.load();
  }

  load() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DATA_FILE)) {
        this.memories = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      }
    } catch (e) {
      this.memories = [];
    }
  }

  save() {
    fs.writeFileSync(DATA_FILE, JSON.stringify(this.memories, null, 2));
  }

  generateId() {
    return 'm_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4);
  }

  add(content, options = {}) {
    const memory = {
      id: this.generateId(),
      content,
      tags: options.tags || [],
      importance: Math.max(1, Math.min(10, options.importance || 5)),
      category: options.category || 'note',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.memories.push(memory);
    this.save();
    return memory;
  }

  get(id) {
    return this.memories.find(m => m.id === id);
  }

  search(query, options = {}) {
    const queryLower = query.toLowerCase();
    const words = queryLower.split(/\s+/);
    
    let results = this.memories.filter(m => {
      const contentLower = m.content.toLowerCase();
      const tagsLower = m.tags.join(' ').toLowerCase();
      
      // Match if any word is found in content or tags
      return words.some(word => 
        contentLower.includes(word) || tagsLower.includes(word)
      );
    });

    // Filter by category if specified
    if (options.category) {
      results = results.filter(m => m.category === options.category);
    }

    // Sort by relevance (how many words match) and importance
    results.sort((a, b) => {
      const aMatches = words.filter(w => a.content.toLowerCase().includes(w)).length;
      const bMatches = words.filter(w => b.content.toLowerCase().includes(w)).length;
      if (bMatches !== aMatches) return bMatches - aMatches;
      return b.importance - a.importance;
    });

    return results.slice(0, options.limit || 10);
  }

  list(options = {}) {
    let results = [...this.memories];

    if (options.category) {
      results = results.filter(m => m.category === options.category);
    }

    if (options.sort === 'importance') {
      results.sort((a, b) => b.importance - a.importance);
    } else {
      results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return results.slice(0, parseInt(options.limit) || 20);
  }

  delete(id) {
    const index = this.memories.findIndex(m => m.id === id);
    if (index === -1) return false;
    this.memories.splice(index, 1);
    this.save();
    return true;
  }

  update(id, updates) {
    const memory = this.get(id);
    if (!memory) return null;
    
    Object.assign(memory, updates, { updatedAt: new Date().toISOString() });
    this.save();
    return memory;
  }

  export(filename) {
    fs.writeFileSync(filename, JSON.stringify(this.memories, null, 2));
  }

  import(filename, merge = false) {
    const data = JSON.parse(fs.readFileSync(filename, 'utf8'));
    if (!merge) {
      this.memories = data;
    } else {
      const existingIds = new Set(this.memories.map(m => m.id));
      const newMemories = data.filter(m => !existingIds.has(m.id));
      this.memories.push(...newMemories);
    }
    this.save();
    return data.length;
  }

  stats() {
    const byCategory = {};
    let totalImportance = 0;

    for (const m of this.memories) {
      byCategory[m.category] = (byCategory[m.category] || 0) + 1;
      totalImportance += m.importance;
    }

    const dataSize = Buffer.byteLength(JSON.stringify(this.memories));

    return {
      total: this.memories.length,
      byCategory,
      avgImportance: this.memories.length ? totalImportance / this.memories.length : 0,
      sizeKB: dataSize / 1024
    };
  }
}
