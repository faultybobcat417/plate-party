const fs = require('fs');
const content = fs.readFileSync('drizzle/migrations.ts', 'utf8');
const match = content.match(/"m0000":\s*"([\s\S]*)"/);
if (!match) {
  console.log('no match');
  process.exit(1);
}
const sql = match[1]
  .replace(/\\n/g, '\n')
  .replace(/\\t/g, '\t')
  .replace(/\\"/g, '"');
const stmts = sql.split('--> statement-breakpoint');
console.log('statements:', stmts.length);
stmts.forEach((s, i) => {
  const t = s.trim();
  const m = t.match(/CREATE TABLE `([a-z_]+)`/);
  console.log(i, m ? m[1] : t.slice(0, 60).replace(/\n/g, ' '));
});
