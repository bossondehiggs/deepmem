# DeepMem 🧠

A persistent memory system for AI agents. Store, search, and manage memories with semantic tagging, importance scoring, and full export/import capabilities.

Built for [OpenClaw](https://openclaw.dev) agents.

## Features

- **Persistent JSON storage** - Memories survive restarts
- **Semantic tagging** - Organize with tags and categories
- **Keyword search** - Find memories by content, tags, or category
- **Importance scoring** - Rate memories 1-10 for priority-based retrieval
- **Export/Import** - Backup and transfer memory stores
- **CLI interface** - Full command-line control

## Installation

```bash
# Clone and link globally
git clone https://github.com/bossondehiggs/deepmem.git
cd deepmem
npm link

# Or use directly
node bin/cli.js <command>
```

## CLI Usage

```bash
# Add a memory
deepmem add "User prefers dark mode" --tags preferences,ui --importance 8

# Search memories
deepmem search "preferences"
deepmem search "user" --min-importance 5 --limit 10

# List all memories
deepmem list
deepmem list --category work --tag important

# Get/update/delete
deepmem get <id>
deepmem update <id> --importance 10 --tags new,tags
deepmem delete <id>

# View stats
deepmem stats
deepmem tags
deepmem categories

# Export/Import
deepmem export ./backup.json
deepmem import ./backup.json --merge
```

## Programmatic Usage

```javascript
const DeepMem = require('deepmem');

// Initialize (default: ~/.deepmem/memories.json)
const mem = new DeepMem();

// Or with custom path
const mem = new DeepMem('./my-memories.json');

// Add memories
mem.add('User prefers dark mode', {
  tags: ['preferences', 'ui'],
  category: 'user-preferences',
  importance: 8
});

// Search
const results = mem.search('dark mode');
const filtered = mem.search('user', { 
  minImportance: 5,
  category: 'user-preferences',
  limit: 10
});

// List with filters
const prefs = mem.list({ category: 'user-preferences' });
const important = mem.list({ minImportance: 8 });

// Update
mem.update(id, { 
  content: 'Updated content',
  importance: 10
});

// Delete
mem.delete(id);

// Export/Import
mem.export('./backup.json');
mem.import('./backup.json', { merge: true });

// Stats
const stats = mem.stats();
console.log(stats.totalMemories);
```

## Memory Structure

```json
{
  "id": "m3x7k2a9p",
  "content": "User prefers dark mode in all applications",
  "tags": ["preferences", "ui", "theme"],
  "category": "user-preferences",
  "importance": 8,
  "created": "2025-02-01T19:00:00.000Z",
  "updated": "2025-02-01T19:00:00.000Z",
  "metadata": {}
}
```

## Use Cases

- **Agent context persistence** - Remember user preferences across sessions
- **Knowledge management** - Store and retrieve learned information
- **Task tracking** - Keep important tasks with high importance scores
- **Conversation memory** - Save key conversation points
- **Config storage** - Store agent settings with semantic search

## API Reference

### Constructor
- `new DeepMem(storagePath?)` - Create instance with optional custom path

### Methods
- `add(content, options?)` - Add memory (returns memory object)
- `get(id)` - Get memory by ID
- `update(id, updates)` - Update memory fields
- `delete(id)` - Delete memory
- `search(query, options?)` - Search by keyword
- `list(options?)` - List memories with filters
- `getTags()` - Get all unique tags
- `getCategories()` - Get all unique categories
- `stats()` - Get statistics
- `export(filepath?)` - Export to JSON file or string
- `import(source, options?)` - Import from file or JSON
- `clear()` - Delete all memories

### Options
- `tags` - Array of string tags
- `category` - Category string
- `importance` - Number 1-10
- `metadata` - Custom metadata object
- `minImportance` - Filter minimum
- `limit` - Limit results
- `merge` - Merge on import (skip duplicates)

## License

MIT
