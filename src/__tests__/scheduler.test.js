import { describe, it, expect } from 'vitest';
import { getNextCard } from '../utils/scheduler';

describe('scheduler - getNextCard', () => {
  it('should return null if word list is empty', () => {
    const result = getNextCard([], {});
    expect(result).toBeNull();
  });

  it('should return the only word when list length is 1', () => {
    const words = [{ id: '1', german: 'Hund' }];
    const result = getNextCard(words, {});
    expect(result).toEqual({ id: '1', german: 'Hund' });
  });

  it('should prevent immediate consecutive repetition if other candidates exist', () => {
    const words = [
      { id: '1', german: 'Hund' },
      { id: '2', german: 'Katze' }
    ];
    // With id '1' as lastWordId, it must return '2'
    const result = getNextCard(words, {}, '1');
    expect(result.id).toBe('2');
  });

  it('should select higher weighted cards more frequently', () => {
    const words = [
      { id: '1', german: 'Hund' },
      { id: '2', german: 'Katze' }
    ];
    // Card 1 has weight 10 (easy/correct card)
    // Card 2 has weight 1000 (difficult/incorrect card)
    const progress = {
      '1': { weight: 10 },
      '2': { weight: 1000 }
    };

    let card1Count = 0;
    let card2Count = 0;

    // Run 1000 times
    for (let i = 0; i < 1000; i++) {
      const selected = getNextCard(words, progress);
      if (selected.id === '1') card1Count++;
      if (selected.id === '2') card2Count++;
    }

    // Card 2 (weight 1000) should be selected much more often than Card 1 (weight 10)
    expect(card2Count).toBeGreaterThan(card1Count);
    expect(card2Count).toBeGreaterThan(800); // Statistically should be ~99% of selections
  });
});
