#!/usr/bin/env node

const DeepMem = require('../lib/memory');
const path = require('path');

const args = process.argv.slice(2);
const command = args[0];

// Parse flags
function parseFlags(args) {
  const flags = {};
  const positional = [];
  
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      if (args[i + 1] && !args[i + 1].startsWith('--')) {
        flags[key] = args[i + 1];
        i++;
      } else {
        flags[key] = true;
      }
    } else if (args[i].startsWith('-')) {
      const key = args[i].slice(1);
      if (args[i + 1] && !args[i + 1].startsWith('-')) {
        flags[key] = args[i + 1];
        i++;
      } else {
        flags[key] = true;
      }
    } else {
      positional.push(args[i]);
    }
  }
  
  return { flags, positional };
}

const { flags, positional } = parseFlags(args.slice(1));

// Initialize DeepMem with custom path if provided
const storagePath = flags.storage || flags.s || null;
const mem = new DeepMem(storagePath);

function printHelp() {
  console.log(`
DeepMem - AI Agent Memory System

Usage: deepmem <command> [options]

Commands:
  add <content>           Add a new memory
    --tags, -t            Comma-separated tags
    --category, -c        Category (default: general)
    --importance, -i      Importance 1-10 (default: 5)

  get <id>                Get a memory by ID

  update <id>             Update a memory
    --content             New content
    --tags, -t            New tags (comma-separated)
    --category, -c        New category
    --importance, -i      New importance

  delete <id>             Delete a memory

  search <query>          Search memories
    --category, -c        Filter by category
    --tag                 Filter by tag
    --min-importance      Minimum importance
    --limit, -l           Limit results

  list                    List all memories
    --category, -c        Filter by category
    --tag                 Filter by tag
    --min-importance      Minimum importance
    --limit, -l           Limit results

  tags                    List all tags
  categories              List all categories
  stats                   Show statistics

  export [file]           Export memories to JSON
  import <file>           Import memories from JSON
    --merge               Merge with existing (skip duplicates)

  clear                   Delete all memories (careful!)

Global Options:
  --storage, -s           Custom storage path
  --help, -h              Show help

Examples:
  deepmem add "User prefers dark mode" -t preferences,ui -i 7
  deepmem search "preferences" --min-importance 5
  deepmem list --category work --limit 10
  deepmem export ./backup.json
`);
}

function formatMemory(m, verbose = true) {
  if (verbose) {
    console.log(`\n[${m.id}] (★${m.importance})`);
    console.log(`  Content: ${m.content}`);
    console.log(`  Category: ${m.category}`);
    console.log(`  Tags: ${m.tags.length > 0 ? m.tags.join(', ') : '(none)'}`);
    console.log(`  Created: ${m.created}`);
  } else {
    console.log(`[${m.id}] ★${m.importance} | ${m.category} | ${m.content.substring(0, 60)}${m.content.length > 60 ? '...' : ''}`);
  }
}

// Execute command
switch (command) {
  case 'add': {
    const content = positional.join(' ');
    if (!content) {
      console.error('Error: Content is required');
      process.exit(1);
    }
    const tags = (flags.tags || flags.t || '').split(',').filter(t => t.trim()).map(t => t.trim());
    const category = flags.category || flags.c || 'general';
    const importance = parseInt(flags.importance || flags.i || 5);
    
    const memory = mem.add(content, { tags, category, importance });
    console.log('Memory added:');
    formatMemory(memory);
    break;
  }

  case 'get': {
    const id = positional[0];
    if (!id) {
      console.error('Error: ID is required');
      process.exit(1);
    }
    const memory = mem.get(id);
    if (memory) {
      formatMemory(memory);
    } else {
      console.error('Memory not found');
      process.exit(1);
    }
    break;
  }

  case 'update': {
    const id = positional[0];
    if (!id) {
      console.error('Error: ID is required');
      process.exit(1);
    }
    const updates = {};
    if (flags.content) updates.content = flags.content;
    if (flags.tags || flags.t) updates.tags = (flags.tags || flags.t).split(',').map(t => t.trim());
    if (flags.category || flags.c) updates.category = flags.category || flags.c;
    if (flags.importance || flags.i) updates.importance = parseInt(flags.importance || flags.i);
    
    const memory = mem.update(id, updates);
    if (memory) {
      console.log('Memory updated:');
      formatMemory(memory);
    } else {
      console.error('Memory not found');
      process.exit(1);
    }
    break;
  }

  case 'delete': {
    const id = positional[0];
    if (!id) {
      console.error('Error: ID is required');
      process.exit(1);
    }
    if (mem.delete(id)) {
      console.log('Memory deleted');
    } else {
      console.error('Memory not found');
      process.exit(1);
    }
    break;
  }

  case 'search': {
    const query = positional.join(' ');
    if (!query) {
      console.error('Error: Search query is required');
      process.exit(1);
    }
    const options = {};
    if (flags.category || flags.c) options.category = flags.category || flags.c;
    if (flags.tag) options.tag = flags.tag;
    if (flags['min-importance']) options.minImportance = parseInt(flags['min-importance']);
    if (flags.limit || flags.l) options.limit = parseInt(flags.limit || flags.l);
    
    const results = mem.search(query, options);
    console.log(`Found ${results.length} memories:`);
    results.forEach(m => formatMemory(m, false));
    break;
  }

  case 'list': {
    const options = {};
    if (flags.category || flags.c) options.category = flags.category || flags.c;
    if (flags.tag) options.tag = flags.tag;
    if (flags['min-importance']) options.minImportance = parseInt(flags['min-importance']);
    if (flags.limit || flags.l) options.limit = parseInt(flags.limit || flags.l);
    
    const results = mem.list(options);
    console.log(`Total: ${results.length} memories`);
    results.forEach(m => formatMemory(m, false));
    break;
  }

  case 'tags': {
    const tags = mem.getTags();
    console.log(`Tags (${tags.length}):`);
    tags.forEach(t => console.log(`  - ${t}`));
    break;
  }

  case 'categories': {
    const categories = mem.getCategories();
    console.log(`Categories (${categories.length}):`);
    categories.forEach(c => console.log(`  - ${c}`));
    break;
  }

  case 'stats': {
    const stats = mem.stats();
    console.log('\nDeepMem Statistics');
    console.log('==================');
    console.log(`Total memories: ${stats.totalMemories}`);
    console.log(`Categories: ${stats.categories}`);
    console.log(`Tags: ${stats.tags}`);
    console.log(`Average importance: ${stats.avgImportance}`);
    if (stats.oldestMemory) {
      console.log(`Oldest: ${stats.oldestMemory}`);
      console.log(`Newest: ${stats.newestMemory}`);
    }
    console.log('\nImportance distribution:');
    for (let i = 10; i >= 1; i--) {
      const count = stats.importanceDistribution[i];
      const bar = '█'.repeat(count);
      console.log(`  ${i.toString().padStart(2)}: ${bar} (${count})`);
    }
    break;
  }

  case 'export': {
    const filepath = positional[0];
    if (filepath) {
      mem.export(filepath);
      console.log(`Exported to ${filepath}`);
    } else {
      console.log(mem.export());
    }
    break;
  }

  case 'import': {
    const filepath = positional[0];
    if (!filepath) {
      console.error('Error: File path is required');
      process.exit(1);
    }
    const options = { merge: flags.merge || false };
    const count = mem.import(filepath, options);
    console.log(`Imported ${count} memories`);
    break;
  }

  case 'clear': {
    if (!flags.confirm && !flags.y) {
      console.log('This will delete ALL memories. Use --confirm or -y to proceed.');
      process.exit(1);
    }
    mem.clear();
    console.log('All memories cleared');
    break;
  }

  case 'help':
  case '--help':
  case '-h':
  case undefined:
    printHelp();
    break;

  default:
    console.error(`Unknown command: ${command}`);
    console.log('Use --help to see available commands');
    process.exit(1);
}
