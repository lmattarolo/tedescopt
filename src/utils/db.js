// LocalStorage helpers for TedescoPT

const STORAGE_KEYS = {
  WORDS: 'tedescopt_words',
  PROGRESS: 'tedescopt_progress',
  STORIES: 'tedescopt_stories',
};

// Generates a unique ID (simple browser-compatible UUID replacement)
export function generateId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID 
    ? crypto.randomUUID() 
    : Math.random().toString(36).substring(2, 9);
}

// Normalizes part of speech values to Italian equivalents
export function normalizePartOfSpeech(pos) {
  const normalized = (pos || '').trim().toLowerCase();
  switch (normalized) {
    case 'noun':
    case 'nome':
      return 'nome';
    case 'verb':
    case 'verbo':
      return 'verbo';
    case 'adjective':
    case 'aggettivo':
      return 'aggettivo';
    default:
      return 'altro';
  }
}

// Capitalizes the first letter of the Italian word if it is a noun
export function capitalizeItalianIfNoun(italian, partOfSpeech) {
  const normalizedPos = normalizePartOfSpeech(partOfSpeech);
  const trimmed = (italian || '').trim();
  if (normalizedPos === 'nome' && trimmed) {
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  }
  return trimmed;
}

// Prepends the plural article "die" to German plurals if it's not already present
export function formatGermanPlural(plural) {
  if (!plural) return '';
  const trimmed = plural.trim();
  if (/^die\s+/i.test(trimmed)) {
    return trimmed;
  }
  return `die ${trimmed}`;
}

// Get all vocabulary words
export function getWords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WORDS);
    const parsed = raw ? JSON.parse(raw) : [];
    return parsed.map(w => {
      const normalizedPos = normalizePartOfSpeech(w.partOfSpeech);
      return {
        ...w,
        partOfSpeech: normalizedPos,
        italian: capitalizeItalianIfNoun(w.italian, normalizedPos)
      };
    });
  } catch (e) {
    console.error('Error reading words from LocalStorage:', e);
    return [];
  }
}

// Save all vocabulary words
export function saveWords(words) {
  try {
    localStorage.setItem(STORAGE_KEYS.WORDS, JSON.stringify(words));
  } catch (e) {
    console.error('Error saving words to LocalStorage:', e);
  }
}

// Get study progress statistics for each word ID
export function getProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROGRESS);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error('Error reading progress from LocalStorage:', e);
    return {};
  }
}

// Save progress stats
export function saveProgress(progress) {
  try {
    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(progress));
  } catch (e) {
    console.error('Error saving progress to LocalStorage:', e);
  }
}

// Get all stories
export function getStories() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STORIES);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error reading stories from LocalStorage:', e);
    return [];
  }
}

// Save all stories
export function saveStories(stories) {
  try {
    localStorage.setItem(STORAGE_KEYS.STORIES, JSON.stringify(stories));
  } catch (e) {
    console.error('Error saving stories to LocalStorage:', e);
  }
}

// Import a new unit vocabulary JSON
export function importUnit(unitName, newWords, newStories = []) {
  const currentWords = getWords();
  
  // Format and assign IDs to new words if missing
  const formattedNewWords = newWords.map(word => {
    const normalizedPos = normalizePartOfSpeech(word.partOfSpeech);
    return {
      id: word.id || generateId(),
      italian: capitalizeItalianIfNoun(word.italian, normalizedPos),
      german: (word.german || '').trim(),
      gender: word.gender ? word.gender.trim().toLowerCase() : null,
      plural: word.plural ? word.plural.trim() : null,
      partOfSpeech: normalizedPos,
      unit: unitName,
    };
  });

  // Filter out any duplicate entries (e.g. matching Italian and German in the same unit)
  const mergedWords = [...currentWords];
  
  formattedNewWords.forEach(newWord => {
    const duplicateIndex = mergedWords.findIndex(
      w => w.unit === newWord.unit && 
           w.italian.toLowerCase() === newWord.italian.toLowerCase() &&
           w.german.toLowerCase() === newWord.german.toLowerCase()
    );
    if (duplicateIndex !== -1) {
      // Overwrite the existing one with new metadata
      mergedWords[duplicateIndex] = { ...mergedWords[duplicateIndex], ...newWord };
    } else {
      mergedWords.push(newWord);
    }
  });

  saveWords(mergedWords);

  // Handle stories
  if (newStories && newStories.length > 0) {
    const currentStories = getStories();
    const mergedStories = [...currentStories];
    
    newStories.forEach(newStory => {
      const duplicateIndex = mergedStories.findIndex(s => s.id === newStory.id);
      if (duplicateIndex !== -1) {
        mergedStories[duplicateIndex] = { ...mergedStories[duplicateIndex], ...newStory, unit: unitName };
      } else {
        mergedStories.push({ ...newStory, unit: unitName, id: newStory.id || generateId() });
      }
    });
    saveStories(mergedStories);
  }

  return mergedWords;
}

// Record a study session outcome (correct / incorrect)
export function recordReview(wordId, isCorrect) {
  const progress = getProgress();
  const current = progress[wordId] || {
    weight: 100, // Starting weight
    correctCount: 0,
    totalCount: 0,
  };

  current.totalCount += 1;
  if (isCorrect) {
    current.correctCount += 1;
    // Divide weight by 2 on correct, but keep a minimum floor of 5
    current.weight = Math.max(5, Math.round(current.weight / 2));
  } else {
    // Multiply weight by 2 on incorrect, capping at 1000 to avoid runaway numbers
    current.weight = Math.min(1000, current.weight * 2);
  }

  progress[wordId] = current;
  saveProgress(progress);
  return current;
}

// Add a single word manually
export function addWord(word) {
  const words = getWords();
  const normalizedPos = normalizePartOfSpeech(word.partOfSpeech);
  const newWord = {
    id: generateId(),
    italian: capitalizeItalianIfNoun(word.italian, normalizedPos),
    german: (word.german || '').trim(),
    gender: word.gender ? word.gender.trim().toLowerCase() : null,
    plural: word.plural ? word.plural.trim() : null,
    partOfSpeech: normalizedPos,
    unit: (word.unit || 'Manual').trim(),
  };
  words.push(newWord);
  saveWords(words);
  return newWord;
}

// Update an existing word
export function updateWord(updatedWord) {
  const words = getWords();
  const index = words.findIndex(w => w.id === updatedWord.id);
  if (index !== -1) {
    const normalizedPos = normalizePartOfSpeech(updatedWord.partOfSpeech);
    words[index] = {
      ...words[index],
      ...updatedWord,
      italian: capitalizeItalianIfNoun(updatedWord.italian, normalizedPos),
      german: (updatedWord.german || '').trim(),
      gender: updatedWord.gender ? updatedWord.gender.trim().toLowerCase() : null,
      plural: updatedWord.plural ? updatedWord.plural.trim() : null,
      partOfSpeech: normalizedPos,
    };
    saveWords(words);
    return true;
  }
  return false;
}

// Delete a single word and its progress
export function deleteWord(wordId) {
  const words = getWords();
  const filteredWords = words.filter(w => w.id !== wordId);
  saveWords(filteredWords);

  const progress = getProgress();
  if (progress[wordId]) {
    delete progress[wordId];
    saveProgress(progress);
  }
}

// Export complete data backup as a JSON string
export function exportBackup() {
  const words = getWords();
  const progress = getProgress();
  const stories = getStories();
  return JSON.stringify({
    version: '1.0.0',
    words,
    progress,
    stories,
    exportedAt: new Date().toISOString(),
  }, null, 2);
}

// Import complete data backup
export function importBackup(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    if (!data.words || !Array.isArray(data.words)) {
      throw new Error('Invalid backup file format: missing words array.');
    }
    const normalizedWords = data.words.map(w => ({
      ...w,
      partOfSpeech: normalizePartOfSpeech(w.partOfSpeech)
    }));
    saveWords(normalizedWords);
    saveProgress(data.progress || {});
    if (data.stories && Array.isArray(data.stories)) {
      saveStories(data.stories);
    }
    return true;
  } catch (e) {
    console.error('Error importing backup:', e);
    throw e;
  }
}

// Clear all database
export function resetDatabase() {
  localStorage.removeItem(STORAGE_KEYS.WORDS);
  localStorage.removeItem(STORAGE_KEYS.PROGRESS);
  localStorage.removeItem(STORAGE_KEYS.STORIES);
}
