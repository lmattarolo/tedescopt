import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Flashcard from '../components/Flashcard';

describe('Flashcard Component', () => {
  const nounCard = {
    id: '1',
    italian: 'la sedia',
    german: 'Stuhl',
    gender: 'der',
    plural: 'Stühle',
    partOfSpeech: 'nome',
    unit: 'Einheit 1'
  };

  const verbCard = {
    id: '2',
    italian: 'studiare',
    german: 'studieren',
    gender: null,
    plural: null,
    partOfSpeech: 'verbo',
    unit: 'Einheit 1'
  };

  it('renders front side showing the Italian word first', () => {
    render(<Flashcard card={nounCard} onRate={() => {}} />);
    
    // Front side should show Italian word
    expect(screen.getByText('la sedia')).toBeInTheDocument();
    
    // Back side elements should not be visible or active yet
    // The rate buttons shouldn't be rendered
    expect(screen.queryByRole('button', { name: /Segna come corretto/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Segna come errato/i })).not.toBeInTheDocument();
  });

  it('reveals German translation on first click', () => {
    render(<Flashcard card={nounCard} onRate={() => {}} />);
    
    const cardElement = screen.getByRole('button', { name: /flashcard/i });
    fireEvent.click(cardElement);

    // German word and gender should be displayed
    expect(screen.getByText('Stuhl')).toBeInTheDocument();
    expect(screen.getAllByText('der')[0]).toBeInTheDocument();
    
    // Rating buttons should now be visible
    expect(screen.getByRole('button', { name: /Segna come corretto/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Segna come errato/i })).toBeInTheDocument();
  });

  it('reveals plural form on second click for nouns with plurals', () => {
    render(<Flashcard card={nounCard} onRate={() => {}} />);
    
    const cardElement = screen.getByRole('button', { name: /flashcard/i });
    
    // 1st click -> Back side
    fireEvent.click(cardElement);
    expect(screen.queryByText('Stühle')).not.toBeInTheDocument();

    // 2nd click -> Plural side
    fireEvent.click(cardElement);
    expect(screen.getByText('Stühle')).toBeInTheDocument();
  });

  it('triggers onRate callback when rating buttons are clicked', () => {
    const handleRate = vi.fn();
    render(<Flashcard card={verbCard} onRate={handleRate} />);
    
    const cardElement = screen.getByRole('button', { name: /flashcard/i });
    fireEvent.click(cardElement); // Flip to back

    // Click Correct button
    const correctBtn = screen.getByRole('button', { name: /Segna come corretto/i });
    fireEvent.click(correctBtn);
    
    expect(handleRate).toHaveBeenCalledWith(true);
  });
});
