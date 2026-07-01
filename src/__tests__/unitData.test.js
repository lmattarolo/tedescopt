import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Unit Data Validation', () => {
  it('should have all nouns present in at least one story in einheit_1.json', () => {
    const filePath = path.resolve(__dirname, '../../zanichelli_vocabulary/einheit_1.json');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(fileContent);

    const nouns = data.words.filter(w => w.partOfSpeech === 'noun' && w.gender !== null);
    const stories = data.stories || [];

    // Collect all words used across all paragraphs in all stories
    const allWordsUsed = new Set();
    stories.forEach(story => {
      story.paragraphs.forEach(para => {
        if (para.wordsUsed) {
          para.wordsUsed.forEach(word => allWordsUsed.add(word.toLowerCase()));
        }
      });
    });

    const missingNouns = [];

    nouns.forEach(noun => {
      const italianTokens = noun.italian.toLowerCase().split(/[^a-zà-öø-ÿ]+/);
      
      // Check if any of the italian tokens are in the wordsUsed set
      const isUsed = italianTokens.some(token => allWordsUsed.has(token));
      
      if (!isUsed) {
        missingNouns.push(`${noun.german} (${noun.italian})`);
      }
    });

    expect(missingNouns, `The following nouns are missing from the stories: ${missingNouns.join(', ')}`).toEqual([]);
  });
});
