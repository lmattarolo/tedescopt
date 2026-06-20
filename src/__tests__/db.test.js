import { describe, it, expect, beforeEach } from 'vitest';
import { 
  getWords, 
  saveWords, 
  getProgress, 
  saveProgress, 
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
  });

  it('should save and get words correctly', () => {
    const mockWords = [{ id: '1', italian: 'cane', german: 'Hund' }];
    saveWords(mockWords);
    expect(getWords()).toEqual(mockWords);
  });

  it('should import a vocabulary unit correctly', () => {
    const newWords = [
      { italian: 'gatto', german: 'Katze', partOfSpeech: 'noun', gender: 'die', plural: 'Katzen' }
    ];
    const imported = importUnit('Einheit 1', newWords);
    
    expect(imported).toHaveLength(1);
    expect(imported[0].unit).toBe('Einheit 1');
    expect(imported[0].italian).toBe('gatto');
    expect(imported[0].german).toBe('Katze');
    expect(imported[0].id).toBeDefined();
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

  it('should export and import backup backups correctly', () => {
    const mockWords = [{ id: '1', italian: 'cane', german: 'Hund', unit: 'Einheit 1' }];
    const mockProgress = { '1': { weight: 50, correctCount: 2, totalCount: 4 } };
    
    saveWords(mockWords);
    saveProgress(mockProgress);

    const backup = exportBackup();
    expect(backup).toContain('"italian": "cane"');

    // Reset database
    resetDatabase();
    expect(getWords()).toEqual([]);

    // Restore backup
    const status = importBackup(backup);
    expect(status).toBe(true);
    expect(getWords()).toEqual(mockWords);
    expect(getProgress()).toEqual(mockProgress);
  });
});
