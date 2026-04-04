const path = require('path');
const cards = require(path.resolve(__dirname, '..', 'api', 'shared', 'customCards.json'));

const issues = [];

for (const card of cards) {
  const p = card.prompt.trim();
  const a = card.answer.trim();
  const id = card.id;

  // 1. Empty or very short
  if (p.length < 5) issues.push({ id, type: 'short-prompt', prompt: p, answer: a });
  if (a.length < 3) issues.push({ id, type: 'short-answer', prompt: p, answer: a });

  // 2. English in Japanese prompt (should be mostly Japanese)
  const jpChars = (p.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/g) || []).length;
  if (jpChars < 3 && p.length > 5) issues.push({ id, type: 'non-japanese-prompt', prompt: p, answer: a });

  // 3. Japanese in English answer (should be English)
  const jpInAnswer = (a.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/g) || []).length;
  if (jpInAnswer > 0) issues.push({ id, type: 'japanese-in-answer', prompt: p, answer: a });

  // 4. Prompt and answer are identical
  if (p === a) issues.push({ id, type: 'identical', prompt: p, answer: a });

  // 5. Answer doesn't end with punctuation
  if (!/[.!?'"]$/.test(a)) issues.push({ id, type: 'no-punctuation', prompt: p, answer: a });

  // 6. Very long for level (A1 should be simple)
  if (card.cefrLevel === 'A1' && a.split(' ').length > 15) {
    issues.push({ id, type: 'too-long-for-A1', prompt: p, answer: a, words: a.split(' ').length });
  }

  // 7. Very short for C2
  if (card.cefrLevel === 'C2' && a.split(' ').length < 8) {
    issues.push({ id, type: 'too-short-for-C2', prompt: p, answer: a, words: a.split(' ').length });
  }

  // 8. Prompt that looks like English
  if (/^[A-Za-z\s,.!?]+$/.test(p) && p.length > 10) {
    issues.push({ id, type: 'english-prompt', prompt: p, answer: a });
  }

  // 9. Broken encoding / garbled text
  if (/[\uFFFD]/.test(p) || /[\uFFFD]/.test(a)) {
    issues.push({ id, type: 'encoding-issue', prompt: p, answer: a });
  }

  // 10. Prompt ends with English period instead of Japanese 。
  if (/\.$/.test(p) && jpChars > 3) {
    issues.push({ id, type: 'wrong-punctuation-jp', prompt: p, answer: a });
  }

  // 11. Answer starts lowercase (likely fragment)
  if (/^[a-z]/.test(a)) {
    issues.push({ id, type: 'lowercase-start', prompt: p, answer: a });
  }
}

// Group by type
const byType = {};
issues.forEach(i => {
  if (!byType[i.type]) byType[i.type] = [];
  byType[i.type].push(i);
});

console.log('=== Quality Issues Found ===');
console.log('Total issues:', issues.length);
console.log('Total cards:', cards.length);
console.log();
for (const [type, items] of Object.entries(byType)) {
  console.log(`${type}: ${items.length}`);
  items.slice(0, 5).forEach(i => {
    console.log(`  ${i.id}`);
    console.log(`    JP: ${i.prompt.slice(0, 70)}`);
    console.log(`    EN: ${i.answer.slice(0, 70)}`);
  });
  if (items.length > 5) console.log(`  ... and ${items.length - 5} more`);
  console.log();
}
