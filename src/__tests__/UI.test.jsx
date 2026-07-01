import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import App from '../App';
import StoriesView from '../components/StoriesView';
import * as db from '../utils/db';

vi.mock('../utils/db', () => ({
  getWords: vi.fn(),
  getStories: vi.fn(),
  getProgress: vi.fn(() => ({})),
  importUnit: vi.fn(),
  saveWords: vi.fn(),
  saveProgress: vi.fn(),
  recordReview: vi.fn(),
  exportBackup: vi.fn(),
  importBackup: vi.fn(),
  resetDatabase: vi.fn(),
  capitalizeItalianIfNoun: vi.fn(w => w),
}));

// Mock IntersectionObserver for StoriesView
class IntersectionObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.IntersectionObserver = IntersectionObserverMock;

describe('UI Feature Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('filters stories correctly based on search query', () => {
    const mockStories = [
      {
        id: 's1',
        paragraphs: [
          { character: 'Superman', text: 'Superman beve un caffè.', wordsUsed: ['caffè'] }
        ]
      },
      {
        id: 's2',
        paragraphs: [
          { character: 'Regina', text: 'La regina ama la città.', wordsUsed: ['città'] }
        ]
      }
    ];

    render(<StoriesView stories={mockStories} />);

    // Initially shows both stories (checking fragments since text is split by badges)
    expect(screen.getAllByText(/Superman/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/caffè/i)).toBeInTheDocument();
    expect(screen.getByText(/La regina ama la/i)).toBeInTheDocument();
    expect(screen.getByText(/città/i)).toBeInTheDocument();

    // Type in the search box
    const searchInput = screen.getByPlaceholderText(/Cerca una parola in italiano/i);
    fireEvent.change(searchInput, { target: { value: 'caffè' } });

    // Should only show s1
    expect(screen.getAllByText(/Superman/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/La regina ama la/i)).not.toBeInTheDocument();
  });

  it('shows wrong words and the Mostra Storia button at the end of a session', async () => {
    // Setup mock data
    const mockWords = [
      { id: '1', italian: 'caffè (bevanda)', german: 'Kaffee', gender: 'der', unit: 'Unit 1' }
    ];
    const mockStories = [
      {
        id: 's1',
        paragraphs: [
          { character: 'Superman', text: 'Beve un caffè.', wordsUsed: ['caffè'] }
        ]
      }
    ];

    db.getWords.mockReturnValue(mockWords);
    db.getStories.mockReturnValue(mockStories);

    render(<App />);

    // Start session
    const startBtn = screen.getByText(/Inizia sessione/i);
    fireEvent.click(startBtn);

    // Should be in active session now, seeing the flashcard
    expect(screen.getByText(/Parola 1 di 1/i)).toBeInTheDocument();

    // Reveal the card by clicking it
    const flashcard = screen.getByRole('button', { name: /Flashcard:/i });
    fireEvent.click(flashcard);

    // Mark as wrong
    const wrongBtn = screen.getByText(/Errato/i);
    fireEvent.click(wrongBtn);

    // Session should complete and show summary
    expect(screen.getByText(/Sessione completata/i)).toBeInTheDocument();

    // Check that 'caffè (bevanda)' is listed in wrong words
    expect(screen.getByText(/caffè \(bevanda\)/i)).toBeInTheDocument();

    // Check that 'Mostra Storia' button is rendered
    expect(screen.getByText(/Mostra Storia/i)).toBeInTheDocument();
  });
});
