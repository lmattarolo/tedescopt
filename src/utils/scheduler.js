// Spaced repetition scheduling using weighted random selection

/**
 * Selects the next card to review.
 * @param {Array} words - Array of vocabulary word objects.
 * @param {Object} progress - Progress map containing weights keyed by word ID.
 * @param {string|null} lastWordId - ID of the last reviewed card to prevent immediate repetition.
 * @returns {Object|null} The selected card object or null if list is empty.
 */
export function getNextCard(words, progress, lastWordId = null) {
  if (!words || words.length === 0) return null;

  // If there's only 1 card, return it regardless
  if (words.length === 1) return words[0];

  // Filter out the last word ID to prevent immediate repetition, unless it's the only one left
  let candidateWords = words;
  if (lastWordId) {
    const filtered = words.filter(w => w.id !== lastWordId);
    if (filtered.length > 0) {
      candidateWords = filtered;
    }
  }

  // Calculate weights for candidates
  const weightedCandidates = candidateWords.map(word => {
    const stats = progress[word.id];
    // Default weight is 100 if no progress exists
    const weight = stats && typeof stats.weight === 'number' ? stats.weight : 100;
    return { word, weight };
  });

  // Calculate sum of weights
  const totalWeight = weightedCandidates.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight <= 0) {
    // Fallback if weights are somehow 0
    return candidateWords[Math.floor(Math.random() * candidateWords.length)];
  }

  // Draw random number in the range [0, totalWeight)
  let randomValue = Math.random() * totalWeight;

  // Walk through candidate list to select the item
  for (const item of weightedCandidates) {
    randomValue -= item.weight;
    if (randomValue <= 0) {
      return item.word;
    }
  }

  // Fallback (should rarely be reached)
  return candidateWords[candidateWords.length - 1];
}
