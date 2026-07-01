import { describe, it, expect, beforeEach } from 'vitest';
import { 
  getWords, 
  saveWords, 
  getProgress, 
  saveProgress, 
  getStories,
  saveStories,
  importUnit, 
  recordReview, 
  addWord, 
  updateWord, 
  deleteWord, 
  exportBackup, 
  importBackup,
  resetDatabase
} from '../utils/db';

describe('db - LocalStorage Database Operations', () => {
  beforeEach(() => {
    // Clear LocalStorage before each test
    resetDatabase();
  });

  it('should initially return empty arrays/objects', () => {
    expect(getWords()).toEqual([]);
    expect(getProgress()).toEqual({});
    expect(getStories()).toEqual([]);
  });

  it('should save and get words correctly', () => {
    const mockWords = [{ id: '1', italian: 'cane', german: 'Hund', partOfSpeech: 'altro' }];
    saveWords(mockWords);
    expect(getWords()).toEqual(mockWords);
  });

  it('should import a vocabulary unit correctly, including stories', () => {
    const newWords = [
      { italian: 'gatto', german: 'Katze', partOfSpeech: 'noun', gender: 'die', plural: 'Katzen' }
    ];
    const newStories = [
      { id: 's1', paragraphs: [{ text: 'Story 1' }] }
    ];
    
    const imported = importUnit('Einheit 1', newWords, newStories);
    
    expect(imported).toHaveLength(1);
    expect(imported[0].unit).toBe('Einheit 1');
    expect(imported[0].italian).toBe('Gatto');
    
    const savedStories = getStories();
    expect(savedStories).toHaveLength(1);
    expect(savedStories[0].id).toBe('s1');
  });

  it('should merge duplicate stories by id on subsequent imports', () => {
    const s1 = { id: 's1', paragraphs: [{ text: 'Old Text' }] };
    const s1Updated = { id: 's1', paragraphs: [{ text: 'New Text' }] };
    const s2 = { id: 's2', paragraphs: [{ text: 'Story 2' }] };
    
    importUnit('Unit 1', [], [s1]);
    expect(getStories()).toHaveLength(1);
    
    importUnit('Unit 1', [], [s1Updated, s2]);
    const savedStories = getStories();
    
    expect(savedStories).toHaveLength(2);
    // Should update s1
    const foundS1 = savedStories.find(s => s.id === 's1');
    expect(foundS1.paragraphs[0].text).toBe('New Text');
  });

  it('should handle recordReview correctness and adjust weights', () => {
    const wordId = 'test-id';
    
    // First review is incorrect
    const firstReview = recordReview(wordId, false);
    expect(firstReview.totalCount).toBe(1);
    expect(firstReview.correctCount).toBe(0);
    // Weight should double (default 100 * 2 = 200)
    expect(firstReview.weight).toBe(200);

    // Second review is correct
    const secondReview = recordReview(wordId, true);
    expect(secondReview.totalCount).toBe(2);
    expect(secondReview.correctCount).toBe(1);
    // Weight should halve (200 / 2 = 100)
    expect(secondReview.weight).toBe(100);
  });

  it('should export and import backup backups correctly, including stories', () => {
    const mockWords = [{ id: '1', italian: 'cane', german: 'Hund', unit: 'Einheit 1', partOfSpeech: 'altro' }];
    const mockProgress = { '1': { weight: 50, correctCount: 2, totalCount: 4 } };
    const mockStories = [{ id: 's1', paragraphs: [] }];
    
    saveWords(mockWords);
    saveProgress(mockProgress);
    saveStories(mockStories);

    const backup = exportBackup();
    expect(backup).toContain('"italian": "cane"');
    expect(backup).toContain('"id": "s1"');

    // Reset database
    resetDatabase();
    expect(getWords()).toEqual([]);
    expect(getStories()).toEqual([]);

    // Restore backup
    const status = importBackup(backup);
    expect(status).toBe(true);
    expect(getWords()).toEqual(mockWords);
    expect(getProgress()).toEqual(mockProgress);
    expect(getStories()).toEqual(mockStories);
  });
});
