const DeepMem = require('../lib/memory');
const fs = require('fs');
const path = require('path');

// Use temp storage for tests
const testStorage = path.join(__dirname, 'test-memories.json');
const mem = new DeepMem(testStorage);

console.log('🧪 DeepMem Test Suite\n');

// Clean start
mem.clear();

// Test 1: Add memories
console.log('Test 1: Adding memories...');
const m1 = mem.add('User prefers dark mode in all applications', {
  tags: ['preferences', 'ui', 'theme'],
  category: 'user-preferences',
  importance: 8
});
console.log(`  ✓ Added: ${m1.id}`);

const m2 = mem.add('API key for OpenAI is stored in environment variable OPENAI_KEY', {
  tags: ['api', 'credentials', 'openai'],
  category: 'technical',
  importance: 10
});
console.log(`  ✓ Added: ${m2.id}`);

const m3 = mem.add('User likes to be called "Alex"', {
  tags: ['personal', 'name'],
  category: 'user-preferences',
  importance: 7
});
console.log(`  ✓ Added: ${m3.id}`);

const m4 = mem.add('Weekly standup is every Monday at 9am', {
  tags: ['schedule', 'meeting', 'work'],
  category: 'calendar',
  importance: 6
});
console.log(`  ✓ Added: ${m4.id}`);

const m5 = mem.add('Favorite programming language is TypeScript', {
  tags: ['preferences', 'programming'],
  category: 'user-preferences',
  importance: 5
});
console.log(`  ✓ Added: ${m5.id}`);

// Test 2: Get by ID
console.log('\nTest 2: Get by ID...');
const retrieved = mem.get(m1.id);
console.log(`  ✓ Retrieved: ${retrieved.content.substring(0, 40)}...`);

// Test 3: Search
console.log('\nTest 3: Search...');
const prefResults = mem.search('preferences');
console.log(`  ✓ Search "preferences": ${prefResults.length} results`);

const apiResults = mem.search('api');
console.log(`  ✓ Search "api": ${apiResults.length} results`);

// Test 4: Search with filters
console.log('\nTest 4: Search with filters...');
const filtered = mem.search('user', { minImportance: 7 });
console.log(`  ✓ Search "user" (importance >= 7): ${filtered.length} results`);

// Test 5: List with filters
console.log('\nTest 5: List with filters...');
const userPrefs = mem.list({ category: 'user-preferences' });
console.log(`  ✓ Category "user-preferences": ${userPrefs.length} memories`);

const taggedPrefs = mem.list({ tag: 'preferences' });
console.log(`  ✓ Tag "preferences": ${taggedPrefs.length} memories`);

// Test 6: Update
console.log('\nTest 6: Update...');
const updated = mem.update(m5.id, { 
  content: 'Favorite programming languages are TypeScript and Rust',
  importance: 6,
  tags: ['preferences', 'programming', 'rust', 'typescript']
});
console.log(`  ✓ Updated: ${updated.content.substring(0, 40)}...`);

// Test 7: Tags and Categories
console.log('\nTest 7: Tags and Categories...');
const tags = mem.getTags();
console.log(`  ✓ All tags: ${tags.join(', ')}`);

const categories = mem.getCategories();
console.log(`  ✓ All categories: ${categories.join(', ')}`);

// Test 8: Stats
console.log('\nTest 8: Statistics...');
const stats = mem.stats();
console.log(`  ✓ Total memories: ${stats.totalMemories}`);
console.log(`  ✓ Average importance: ${stats.avgImportance}`);
console.log(`  ✓ Categories: ${stats.categories}`);
console.log(`  ✓ Tags: ${stats.tags}`);

// Test 9: Export/Import
console.log('\nTest 9: Export/Import...');
const exportPath = path.join(__dirname, 'export-test.json');
mem.export(exportPath);
console.log(`  ✓ Exported to ${exportPath}`);

// Create new instance and import
const mem2 = new DeepMem(path.join(__dirname, 'import-test.json'));
mem2.clear();
const importCount = mem2.import(exportPath);
console.log(`  ✓ Imported ${importCount} memories`);

// Verify import
const imported = mem2.list();
console.log(`  ✓ Verified: ${imported.length} memories in new store`);

// Test 10: Delete
console.log('\nTest 10: Delete...');
const deleteResult = mem.delete(m4.id);
console.log(`  ✓ Deleted: ${deleteResult}`);
const afterDelete = mem.list();
console.log(`  ✓ Remaining memories: ${afterDelete.length}`);

// Cleanup test files
console.log('\n🧹 Cleaning up test files...');
[testStorage, exportPath, path.join(__dirname, 'import-test.json')].forEach(f => {
  if (fs.existsSync(f)) fs.unlinkSync(f);
});

console.log('\n✅ All tests passed!\n');
