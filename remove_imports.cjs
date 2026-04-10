const fs = require('fs');
const files = [
  'server/migrations/add-crop-columns.ts',
  'server/migrations/check-columns.ts',
  'server/seed-data.ts',
  'server/seed-lesson-content.ts',
  'server/seed-lessons.ts',
  'server/seed-quizzes.ts',
  'server/seed-rich-content.ts'
];

files.forEach(f => {
  try {
    let c = fs.readFileSync(f, 'utf8');
    c = c.replace(/import\s+\{\s*createClient\s*\}\s*from\s+['"]@supabase\/supabase-js['"];?/g, '// import removed');
    fs.writeFileSync(f, c);
    console.log(`Updated ${f}`);
  } catch (e) {
    console.log(`Failed to update ${f}: ${e.message}`);
  }
});
