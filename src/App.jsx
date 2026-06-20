import React, { useState, useEffect } from 'react';
import { getWords, getProgress, recordReview } from './utils/db';
import { getNextCard } from './utils/scheduler';
import Flashcard from './components/Flashcard';
import DeckManager from './components/DeckManager';
import Stats from './components/Stats';

export default function App() {
  const [activeTab, setActiveTab] = useState('study');
  const [words, setWords] = useState([]);
  const [progress, setProgress] = useState({});
  const [currentCard, setCurrentCard] = useState(null);
  const [selectedUnits, setSelectedUnits] = useState([]);

  // Fetch words and progress from LocalStorage on mount
  useEffect(() => {
    refreshData();
  }, []);

  // Reload data from DB
  const refreshData = () => {
    const loadedWords = getWords();
    const loadedProgress = getProgress();
    setWords(loadedWords);
    setProgress(loadedProgress);
  };

  // Get list of all available units in the database
  const availableUnits = [...new Set(words.map(w => w.unit))].sort((a, b) => 
    a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
  );

  // Filter words based on selected units
  const getFilteredWords = () => {
    if (selectedUnits.length === 0) return words; // If none selected, default to all
    return words.filter(w => selectedUnits.includes(w.unit));
  };

  // Update current card when selected units or words list change
  useEffect(() => {
    const filtered = getFilteredWords();
    if (filtered.length > 0) {
      // If we don't have a current card, or the current card is no longer in the filtered list, pick a new one
      if (!currentCard || !filtered.some(w => w.id === currentCard.id)) {
        const next = getNextCard(filtered, progress, null);
        setCurrentCard(next);
      }
    } else {
      setCurrentCard(null);
    }
  }, [selectedUnits, words]);

  // Handle rating feedback (Correct/Wrong)
  const handleRate = (isCorrect) => {
    if (!currentCard) return;

    // Record review stats
    recordReview(currentCard.id, isCorrect);
    
    // Refresh state from database
    const loadedProgress = getProgress();
    setProgress(loadedProgress);

    // Pick the next card
    const filtered = getFilteredWords();
    const next = getNextCard(filtered, loadedProgress, currentCard.id);
    setCurrentCard(next);
  };

  // Toggle unit filter selection
  const handleUnitToggle = (unit) => {
    setSelectedUnits(prev => 
      prev.includes(unit) 
        ? prev.filter(u => u !== unit) 
        : [...prev, unit]
    );
  };

  return (
    <div id="root">
      <header className="app-header">
        <h1 className="app-title">TedescoPT</h1>
        <p className="app-subtitle">Impara il vocabolario tedesco (Zanichelli Glossary Companion)</p>
      </header>

      {/* Navigation tabs */}
      <nav className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'study' ? 'active' : ''}`}
          onClick={() => setActiveTab('study')}
        >
          📖 Study Cards
        </button>
        <button 
          className={`tab-btn ${activeTab === 'manage' ? 'active' : ''}`}
          onClick={() => setActiveTab('manage')}
        >
          ⚙️ Manage Decks
        </button>
        <button 
          className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          📊 Progress
        </button>
      </nav>

      {/* Tab content renderer */}
      <main className="tab-content">
        {activeTab === 'study' && (
          <div className="panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Unit Selector Checkboxes */}
            {availableUnits.length > 0 && (
              <div className="unit-selector-wrapper">
                <span className="form-label" style={{ fontSize: '0.85rem' }}>Select Units to Study (Leave empty to study all):</span>
                <div className="unit-checkbox-grid">
                  {availableUnits.map(unit => (
                    <label key={unit} className="unit-checkbox-label">
                      <input 
                        type="checkbox" 
                        checked={selectedUnits.includes(unit)}
                        onChange={() => handleUnitToggle(unit)}
                      />
                      {unit}
                    </label>
                  ))}
                </div>
              </div>
            )}
            
            {/* Active Card display */}
            <Flashcard card={currentCard} onRate={handleRate} />
          </div>
        )}

        {activeTab === 'manage' && (
          <DeckManager 
            words={words} 
            onDataChange={() => {
              refreshData();
            }} 
          />
        )}

        {activeTab === 'stats' && (
          <Stats words={words} progress={progress} />
        )}
      </main>
    </div>
  );
}
