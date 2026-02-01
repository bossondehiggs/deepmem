const fs = require('fs');
const path = require('path');

class DeepMem {
  constructor(storagePath = null) {
    this.storagePath = storagePath || path.join(process.env.HOME || '.', '.deepmem', 'memories.json');
    this.memories = [];
    this.load();
  }

  // Ensure storage directory exists
  ensureDir() {
    const dir = path.dirname(this.storagePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  // Load memories from disk
  load() {
    try {
      if (fs.existsSync(this.storagePath)) {
        const data = fs.readFileSync(this.storagePath, 'utf8');
        this.memories = JSON.parse(data);
      }
    } catch (err) {
      console.error('Error loading memories:', err.message);
      this.memories = [];
    }
  }

  // Save memories to disk
  save() {
    this.ensureDir();
    fs.writeFileSync(this.storagePath, JSON.stringify(this.memories, null, 2));
  }

  // Generate unique ID
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  // Add a new memory
  add(content, options = {}) {
    const memory = {
      id: this.generateId(),
      content: content,
      tags: options.tags || [],
      category: options.category || 'general',
      importance: Math.min(10, Math.max(1, options.importance || 5)),
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      metadata: options.metadata || {}
    };
    this.memories.push(memory);
    this.save();
    return memory;
  }

  // Get memory by ID
  get(id) {
    return this.memories.find(m => m.id === id);
  }

  // Update a memory
  update(id, updates) {
    const index = this.memories.findIndex(m => m.id === id);
    if (index === -1) return null;
    
    const memory = this.memories[index];
    if (updates.content) memory.content = updates.content;
    if (updates.tags) memory.tags = updates.tags;
    if (updates.category) memory.category = updates.category;
    if (updates.importance) memory.importance = Math.min(10, Math.max(1, updates.importance));
    if (updates.metadata) memory.metadata = { ...memory.metadata, ...updates.metadata };
    memory.updated = new Date().toISOString();
    
    this.save();
    return memory;
  }

  // Delete a memory
  delete(id) {
    const index = this.memories.findIndex(m => m.id === id);
    if (index === -1) return false;
    this.memories.splice(index, 1);
    this.save();
    return true;
  }

  // Search memories by keyword (searches content, tags, category)
  search(query, options = {}) {
    const q = query.toLowerCase();
    let results = this.memories.filter(m => {
      const inContent = m.content.toLowerCase().includes(q);
      const inTags = m.tags.some(t => t.toLowerCase().includes(q));
      const inCategory = m.category.toLowerCase().includes(q);
      return inContent || inTags || inCategory;
    });

    // Filter by minimum importance
    if (options.minImportance) {
      results = results.filter(m => m.importance >= options.minImportance);
    }

    // Filter by category
    if (options.category) {
      results = results.filter(m => m.category === options.category);
    }

    // Filter by tag
    if (options.tag) {
      results = results.filter(m => m.tags.includes(options.tag));
    }

    // Sort by importance (descending) then by date (newest first)
    results.sort((a, b) => {
      if (b.importance !== a.importance) return b.importance - a.importance;
      return new Date(b.created) - new Date(a.created);
    });

    // Limit results
    if (options.limit) {
      results = results.slice(0, options.limit);
    }

    return results;
  }

  // List all memories with optional filters
  list(options = {}) {
    let results = [...this.memories];

    if (options.category) {
      results = results.filter(m => m.category === options.category);
    }

    if (options.tag) {
      results = results.filter(m => m.tags.includes(options.tag));
    }

    if (options.minImportance) {
      results = results.filter(m => m.importance >= options.minImportance);
    }

    // Sort by importance then date
    results.sort((a, b) => {
      if (b.importance !== a.importance) return b.importance - a.importance;
      return new Date(b.created) - new Date(a.created);
    });

    if (options.limit) {
      results = results.slice(0, options.limit);
    }

    return results;
  }

  // Get all unique tags
  getTags() {
    const tags = new Set();
    this.memories.forEach(m => m.tags.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }

  // Get all unique categories
  getCategories() {
    const categories = new Set();
    this.memories.forEach(m => categories.add(m.category));
    return Array.from(categories).sort();
  }

  // Export memories to JSON
  export(filepath = null) {
    const data = JSON.stringify(this.memories, null, 2);
    if (filepath) {
      fs.writeFileSync(filepath, data);
      return filepath;
    }
    return data;
  }

  // Import memories from JSON
  import(source, options = {}) {
    let data;
    if (typeof source === 'string' && fs.existsSync(source)) {
      data = JSON.parse(fs.readFileSync(source, 'utf8'));
    } else if (typeof source === 'string') {
      data = JSON.parse(source);
    } else {
      data = source;
    }

    if (!Array.isArray(data)) {
      throw new Error('Import data must be an array of memories');
    }

    let imported = 0;
    data.forEach(m => {
      // Skip duplicates by ID if merge mode
      if (options.merge && this.memories.some(existing => existing.id === m.id)) {
        return;
      }
      
      // Validate and add
      const memory = {
        id: m.id || this.generateId(),
        content: m.content || '',
        tags: Array.isArray(m.tags) ? m.tags : [],
        category: m.category || 'general',
        importance: Math.min(10, Math.max(1, m.importance || 5)),
        created: m.created || new Date().toISOString(),
        updated: m.updated || new Date().toISOString(),
        metadata: m.metadata || {}
      };
      this.memories.push(memory);
      imported++;
    });

    this.save();
    return imported;
  }

  // Get statistics
  stats() {
    const totalMemories = this.memories.length;
    const categories = this.getCategories();
    const tags = this.getTags();
    const avgImportance = totalMemories > 0 
      ? (this.memories.reduce((sum, m) => sum + m.importance, 0) / totalMemories).toFixed(1)
      : 0;
    
    const importanceDistribution = {};
    for (let i = 1; i <= 10; i++) {
      importanceDistribution[i] = this.memories.filter(m => m.importance === i).length;
    }

    return {
      totalMemories,
      categories: categories.length,
      tags: tags.length,
      avgImportance: parseFloat(avgImportance),
      importanceDistribution,
      oldestMemory: totalMemories > 0 ? this.memories.reduce((oldest, m) => 
        new Date(m.created) < new Date(oldest.created) ? m : oldest
      ).created : null,
      newestMemory: totalMemories > 0 ? this.memories.reduce((newest, m) => 
        new Date(m.created) > new Date(newest.created) ? m : newest
      ).created : null
    };
  }

  // Clear all memories
  clear() {
    this.memories = [];
    this.save();
  }
}

module.exports = DeepMem;
