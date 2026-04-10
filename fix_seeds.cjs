const fs = require('fs');
const files = [
  'server/seed-data.ts',
  'server/seed-lesson-content.ts',
  'server/seed-lessons.ts',
  'server/seed-quizzes.ts',
  'server/seed-rich-content.ts',
  'server/migrations/add-crop-columns.ts',
  'server/migrations/check-columns.ts'
];

files.forEach(f => {
  try {
    let c = fs.readFileSync(f, 'utf8');

    // Comment out createClient calls (lines like: const supabase = createClient(...))
    c = c.replace(/^(const supabase\s*=\s*createClient\([^)]*\));?/gm, '// $1 // auto-commented: supabase removed');
    c = c.replace(/^(const supabase\s*=\s*createClient\(\s*[\s\S]*?\));?(\r?\n)/gm, '// AUTO-REMOVED\n');

    fs.writeFileSync(f, c);
    console.log(`Updated ${f}`);
  } catch (e) {
    console.log(`Failed ${f}: ${e.message}`);
  }
});
