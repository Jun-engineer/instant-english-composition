/**
 * Fix overly generous hints in customCards.json
 * 
 * Strategy:
 * - For each card where hint gives away >80% of the answer,
 *   reduce from the existing hint parts, keeping the most useful 2.
 * - Prefer parts with key vocab/phrases over common words.
 * - Preserve multi-word expressions (e.g., "take a walk", "each other", "how much")
 */

const fs = require('fs');
const path = require('path');

const cardsPath = path.join(__dirname, '..', 'api', 'shared', 'customCards.json');
const cards = JSON.parse(fs.readFileSync(cardsPath, 'utf-8'));

// Words that don't add much value as standalone hints
const LOW_VALUE = new Set([
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
  'my', 'your', 'his', 'its', 'our', 'their',
  'a', 'an', 'the', 'this', 'that', 'these', 'those',
  'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being',
  'do', 'does', 'did', 'done',
  'will', 'would', 'shall', 'should', 'can', 'could', 'may', 'might', 'must',
  'not', 'no', 'yes',
  'and', 'but', 'or', 'so', 'if',
  'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from',
  'what', 'who', 'where', 'how', 'why', 'which',
  'very', 'also', 'just', 'too',
  'there', 'here', 'then', 'now',
]);

function partValue(part) {
  // Score a hint part by how useful it is
  const words = part.trim().toLowerCase().split(/\s+/);
  
  // Multi-word phrases are usually more valuable (idioms, collocations)
  const isPhrase = words.length >= 2;
  
  // Count non-trivial words in this part
  const meaningfulWords = words.filter(w => w.length > 2 && !LOW_VALUE.has(w));
  
  // High value: contains uncommon vocabulary
  let score = meaningfulWords.length * 3;
  
  // Bonus for multi-word phrases (these teach patterns)
  if (isPhrase && meaningfulWords.length >= 1) score += 2;
  
  // Penalty for parts that are just pronouns/articles/prepositions
  if (meaningfulWords.length === 0) score -= 5;
  
  // Penalty for very short single common words
  if (words.length === 1 && LOW_VALUE.has(words[0])) score = -10;
  
  return score;
}

function improveHint(card) {
  const answerWords = card.answer.toLowerCase().replace(/[^a-z' ]/g, '').split(/\s+/).filter(w => w.length > 2);
  const hintParts = card.hint.split(/\s*\/\s*/).map(p => p.trim()).filter(p => p);
  const hintAllWords = card.hint.toLowerCase().replace(/[^a-z'~ ]/g, '').split(/\s+/).filter(w => w.length > 2);
  
  // Calculate match ratio
  const matchCount = hintAllWords.filter(hw => answerWords.includes(hw)).length;
  const ratio = answerWords.length > 0 ? matchCount / answerWords.length : 0;
  
  if (ratio < 0.8 || answerWords.length < 3) return null;
  if (card.hint.includes('~')) return null;
  
  // Already concise (2 or fewer parts with short content)
  if (hintParts.length <= 2) {
    // Check if total hint words are already <= 3
    const totalWords = hintParts.join(' ').split(/\s+/).filter(w => w.length > 1).length;
    if (totalWords <= 3) return null;
  }
  
  // Score each part and keep the top 2
  const scored = hintParts.map((part, i) => ({ part, score: partValue(part), index: i }));
  scored.sort((a, b) => b.score - a.score);
  
  // Keep top 2 parts (preserve original order)
  const kept = scored.slice(0, 2).sort((a, b) => a.index - b.index);
  const newHint = kept.map(k => k.part).join(' / ');
  
  // Don't "fix" if we'd end up with the same thing
  if (newHint === card.hint) return null;
  
  // Don't reduce to nothing useful
  const newWords = newHint.toLowerCase().split(/\s+/).filter(w => w.length > 1);
  if (newWords.length === 0) return null;
  
  return newHint;
}

let fixCount = 0;
const changes = [];

cards.forEach(card => {
  const newHint = improveHint(card);
  if (newHint) {
    changes.push({
      id: card.id,
      level: card.cefrLevel,
      prompt: card.prompt,
      answer: card.answer,
      oldHint: card.hint,
      newHint: newHint,
    });
    card.hint = newHint;
    fixCount++;
  }
});

// Show changes for review
console.log(`Fixed ${fixCount} hints\n`);
for (const level of ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']) {
  const lvlChanges = changes.filter(c => c.level === level);
  if (lvlChanges.length === 0) continue;
  console.log(`--- ${level} (${lvlChanges.length} fixed) ---`);
  lvlChanges.slice(0, 5).forEach(c => {
    console.log(`  P: ${c.prompt}`);
    console.log(`  A: ${c.answer}`);
    console.log(`  Old: ${c.oldHint}`);
    console.log(`  New: ${c.newHint}`);
    console.log();
  });
}

// Save
fs.writeFileSync(cardsPath, JSON.stringify(cards, null, 2) + '\n');
console.log('Saved to', cardsPath);
