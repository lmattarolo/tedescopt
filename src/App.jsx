import React, { useState, useEffect } from 'react';
import { getWords, getProgress, recordReview, importUnit } from './utils/db';
import { getNextCard, generateSessionSequence } from './utils/scheduler';
import Flashcard from './components/Flashcard';
import DeckManager from './components/DeckManager';
import Stats from './components/Stats';

export default function App() {
  const [activeTab, setActiveTab] = useState('study');
  const [words, setWords] = useState([]);
  const [progress, setProgress] = useState({});
  const [selectedUnits, setSelectedUnits] = useState([]);

  // Session state
  const [sessionState, setSessionState] = useState('config'); // 'config', 'active', 'summary'
  const [sessionWordCount, setSessionWordCount] = useState(20);
  const [sessionWords, setSessionWords] = useState([]);
  const [sessionIndex, setSessionIndex] = useState(0);
  const [sessionStats, setSessionStats] = useState({ correct: 0, wrong: 0 });

  // Fetch words and progress from LocalStorage on mount
  useEffect(() => {
    const loadedWords = getWords();
    if (loadedWords.length === 0) {
      loadDefaultUnits();
    } else {
      refreshData();
    }
  }, []);

  const loadDefaultUnits = async () => {
    const defaultUnits = Array.from({ length: 12 }, (_, i) => `einheit_${i + 1}.json`);
    const baseUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) || '/';
    try {
      for (const unitFile of defaultUnits) {
        try {
          const response = await fetch(`${baseUrl}zanichelli_vocabulary/${unitFile}`);
          if (response.ok) {
            const data = await response.json();
            if (data.unit && data.words) {
              importUnit(data.unit, data.words);
            }
          }
        } catch (e) {
          // ignore missing files as user will add them over time
        }
      }
      refreshData();
    } catch (error) {
      console.error('Error loading default vocabulary:', error);
      refreshData();
    }
  };

  // Reload data from DB
  const refreshData = () => {
    const loadedWords = getWords();
    const loadedProgress = getProgress();
    setWords(loadedWords);
    setProgress(loadedProgress);
  };

  // Get list of all available units in the database
  const availableUnits = [...new Set(words.map(w => w.unit || 'Default'))].sort((a, b) => 
    a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
  );

  // Filter words based on selected units
  const getFilteredWords = () => {
    if (selectedUnits.length === 0) return words; // If none selected, default to all
    return words.filter(w => selectedUnits.includes(w.unit || 'Default'));
  };

  // Start a new study session
  const startSession = () => {
    const filtered = getFilteredWords();
    if (filtered.length === 0) {
      alert('Seleziona almeno un\'unità con parole, o lascia vuoto per studiare tutte le parole disponibili.');
      return;
    }
    const sequence = generateSessionSequence(filtered, progress, sessionWordCount);
    setSessionWords(sequence);
    setSessionIndex(0);
    setSessionStats({ correct: 0, wrong: 0 });
    setSessionState('active');
  };

  // Handle rating feedback (Correct/Wrong)
  const handleRate = (isCorrect) => {
    const currentWord = sessionWords[sessionIndex];
    if (!currentWord) return;

    // Record review stats
    recordReview(currentWord.id, isCorrect);
    
    // Refresh state from database
    const loadedProgress = getProgress();
    setProgress(loadedProgress);

    // Update session stats
    setSessionStats(prev => ({
      ...prev,
      correct: prev.correct + (isCorrect ? 1 : 0),
      wrong: prev.wrong + (!isCorrect ? 1 : 0)
    }));

    // Go to next card or summary
    if (sessionIndex + 1 < sessionWords.length) {
      setSessionIndex(sessionIndex + 1);
    } else {
      setSessionState('summary');
    }
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
          📖 Studia
        </button>
        <button 
          className={`tab-btn ${activeTab === 'manage' ? 'active' : ''}`}
          onClick={() => setActiveTab('manage')}
        >
          ⚙️ Gestisci mazzi
        </button>
        <button 
          className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          📊 Progressi
        </button>
      </nav>

      {/* Tab content renderer */}
      <main className="tab-content">
        {activeTab === 'study' && (
          <div className="panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {sessionState === 'config' && (
              <>
                {/* Unit Selector Checkboxes */}
                {availableUnits.length > 0 && (
                  <div className="unit-selector-wrapper">
                    <span className="form-label" style={{ fontSize: '0.85rem' }}>Seleziona le unità da studiare (lascia vuoto per studiarle tutte):</span>
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
                
                {availableUnits.length > 0 && (
                  <div className="word-count-selector">
                    <span className="form-label" style={{ fontSize: '0.85rem' }}>Quante parole?</span>
                    <div className="word-count-options">
                      {[20, 30, 40, 50].map(count => (
                        <label key={count} className="word-count-label">
                          <input
                            type="radio"
                            name="wordCount"
                            value={count}
                            checked={sessionWordCount === count}
                            onChange={() => setSessionWordCount(count)}
                          />
                          {count}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                
                <button 
                  className="start-session-btn" 
                  onClick={startSession}
                  disabled={words.length === 0}
                >
                  Inizia sessione
                </button>
              </>
            )}

            {sessionState === 'active' && sessionWords.length > 0 && (
              <>
                <div className="session-progress-header">
                  Parola {sessionIndex + 1} di {sessionWords.length}
                </div>
                <Flashcard key={sessionWords[sessionIndex].id} card={sessionWords[sessionIndex]} onRate={handleRate} />
              </>
            )}

            {sessionState === 'summary' && (
              <div className="session-summary-container">
                <h2>Sessione completata! 🎉</h2>
                <div className="session-stats">
                  <div className="stat-box correct">
                    <span className="stat-icon">✨</span>
                    <span className="stat-value">{sessionStats.correct}</span>
                    <span className="stat-label">Corrette</span>
                  </div>
                  <div className="stat-box wrong">
                    <span className="stat-icon">❌</span>
                    <span className="stat-value">{sessionStats.wrong}</span>
                    <span className="stat-label">Errate</span>
                  </div>
                </div>
                <button 
                  className="start-session-btn" 
                  onClick={() => setSessionState('config')}
                >
                  Torna alla configurazione
                </button>
              </div>
            )}
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
