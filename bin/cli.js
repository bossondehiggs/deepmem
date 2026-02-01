#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { MemoryStore } from '../lib/store.js';

const store = new MemoryStore();
const program = new Command();

program
  .name('deepmem')
  .description('Semantic memory system for OpenClaw agents')
  .version('1.0.0');

program
  .command('add <content>')
  .description('Add a new memory')
  .option('-t, --tags <tags>', 'Comma-separated tags')
  .option('-i, --importance <level>', 'Importance 1-10', '5')
  .option('-c, --category <cat>', 'Category: fact, preference, task, conversation, note', 'note')
  .action((content, options) => {
    const tags = options.tags ? options.tags.split(',').map(t => t.trim()) : [];
    const memory = store.add(content, {
      tags,
      importance: parseInt(options.importance),
      category: options.category
    });
    console.log(chalk.green(`✓ Memory added (ID: ${memory.id})`));
  });

program
  .command('search <query>')
  .description('Search memories by keyword')
  .option('-l, --limit <n>', 'Max results', '10')
  .option('-c, --category <cat>', 'Filter by category')
  .action((query, options) => {
    const results = store.search(query, {
      limit: parseInt(options.limit),
      category: options.category
    });
    
    if (results.length === 0) {
      console.log(chalk.yellow('No memories found'));
      return;
    }

    console.log(chalk.bold(`\n📚 Found ${results.length} memories:\n`));
    results.forEach((m, i) => {
      const importance = '★'.repeat(Math.min(m.importance, 5)) + '☆'.repeat(5 - Math.min(m.importance, 5));
      console.log(chalk.cyan(`[${m.id}]`) + ` ${importance}`);
      console.log(`  ${m.content}`);
      if (m.tags.length) console.log(chalk.dim(`  Tags: ${m.tags.join(', ')}`));
      console.log(chalk.dim(`  ${m.category} • ${new Date(m.createdAt).toLocaleDateString()}`));
      console.log();
    });
  });

program
  .command('list')
  .description('List all memories')
  .option('-c, --category <cat>', 'Filter by category')
  .option('-l, --limit <n>', 'Max results', '20')
  .option('--sort <field>', 'Sort by: date, importance', 'date')
  .action((options) => {
    const memories = store.list(options);
    
    if (memories.length === 0) {
      console.log(chalk.yellow('No memories stored'));
      return;
    }

    console.log(chalk.bold(`\n📚 ${memories.length} memories:\n`));
    memories.forEach(m => {
      const importance = '★'.repeat(Math.min(m.importance, 5));
      console.log(chalk.cyan(`[${m.id}]`) + chalk.dim(` ${m.category}`) + ` ${importance}`);
      console.log(`  ${m.content.substring(0, 80)}${m.content.length > 80 ? '...' : ''}`);
    });
  });

program
  .command('get <id>')
  .description('Get a specific memory')
  .action((id) => {
    const memory = store.get(id);
    if (!memory) {
      console.log(chalk.red('Memory not found'));
      return;
    }
    console.log(chalk.bold('\n📝 Memory Details:\n'));
    console.log(`ID: ${memory.id}`);
    console.log(`Content: ${memory.content}`);
    console.log(`Category: ${memory.category}`);
    console.log(`Importance: ${'★'.repeat(memory.importance)}`);
    console.log(`Tags: ${memory.tags.join(', ') || 'none'}`);
    console.log(`Created: ${new Date(memory.createdAt).toLocaleString()}`);
    console.log(`Updated: ${new Date(memory.updatedAt).toLocaleString()}`);
  });

program
  .command('delete <id>')
  .description('Delete a memory')
  .action((id) => {
    const deleted = store.delete(id);
    if (deleted) {
      console.log(chalk.green('✓ Memory deleted'));
    } else {
      console.log(chalk.red('Memory not found'));
    }
  });

program
  .command('export')
  .description('Export all memories to JSON')
  .option('-o, --output <file>', 'Output file', 'memories.json')
  .action((options) => {
    store.export(options.output);
    console.log(chalk.green(`✓ Exported to ${options.output}`));
  });

program
  .command('import <file>')
  .description('Import memories from JSON')
  .option('--merge', 'Merge with existing memories', false)
  .action((file, options) => {
    const count = store.import(file, options.merge);
    console.log(chalk.green(`✓ Imported ${count} memories`));
  });

program
  .command('stats')
  .description('Show memory statistics')
  .action(() => {
    const stats = store.stats();
    console.log(chalk.bold('\n📊 Memory Statistics:\n'));
    console.log(`Total memories: ${stats.total}`);
    console.log(`Categories: ${Object.entries(stats.byCategory).map(([k,v]) => `${k}(${v})`).join(', ')}`);
    console.log(`Avg importance: ${stats.avgImportance.toFixed(1)}`);
    console.log(`Storage size: ${stats.sizeKB.toFixed(1)} KB`);
  });

program.parse();
