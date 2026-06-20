import React, { useState, useEffect } from 'react';

/**
 * Flashcard Component
 * Handles flipping state (Front -> Back -> Plural if exists) and user rating.
 */
export default function Flashcard({ card, onRate }) {
  // Flip states: 'front', 'back', 'plural'
  const [flipState, setFlipState] = useState('front');

  // Reset flip state when card changes
  useEffect(() => {
    setFlipState('front');
  }, [card]);

  if (!card) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📚</div>
        <p>No cards available. Import some units or add words in "Manage Decks" to start!</p>
      </div>
    );
  }

  const hasPlural = card.partOfSpeech === 'noun' && card.plural && card.plural.trim() !== '';

  // Handle clicking the card to advance state
  const handleCardClick = () => {
    if (flipState === 'front') {
      setFlipState('back');
    } else if (flipState === 'back' && hasPlural) {
      setFlipState('plural');
    }
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        handleCardClick();
      } else if (e.code === 'Digit1' || e.code === 'ArrowLeft') {
        // Rate as wrong if back or plural is visible
        if (flipState !== 'front') {
          onRate(false);
        }
      } else if (e.code === 'Digit2' || e.code === 'ArrowRight') {
        // Rate as correct if back or plural is visible
        if (flipState !== 'front') {
          onRate(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [flipState, card, onRate]);

  // Determine wrapper class for 3D flip animation
  let wrapperClass = 'card-wrapper';
  if (flipState === 'back') {
    wrapperClass += ' flipped-back';
  } else if (flipState === 'plural') {
    wrapperClass += ' flipped-plural';
  }

  // Helper to format part of speech
  const getPosLabel = (pos) => {
    switch (pos) {
      case 'noun': return 'Noun';
      case 'verb': return 'Verb';
      case 'adjective': return 'Adjective';
      default: return 'Other';
    }
  };

  return (
    <div className="study-container">
      <div 
        className={wrapperClass} 
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
        aria-label={`Flashcard: ${card.italian}. Press Space to flip.`}
      >
        <div className="flashcard">
          {/* FRONT FACE (Italian Word) */}
          <div className="card-face card-front">
            <span className="card-unit-badge">{card.unit}</span>
            <span className="card-pos-badge">{getPosLabel(card.partOfSpeech)}</span>
            <h2 className="card-text">{card.italian}</h2>
            <div className="flip-prompt">Tap or Press Space to flip</div>
          </div>

          {/* BACK FACE (German Word + Details) */}
          <div className="card-face card-back">
            <span className="card-unit-badge">{card.unit}</span>
            <span className="card-pos-badge">{getPosLabel(card.partOfSpeech)}</span>
            
            <div className="german-container">
              {card.partOfSpeech === 'noun' && card.gender && (
                <span className={`gender-badge ${card.gender}`}>
                  {card.gender}
                </span>
              )}
              <h2 className="german-word">
                {card.partOfSpeech === 'noun' && card.gender ? (
                  <>
                    <span style={{ opacity: 0.5, marginRight: '8px' }}>
                      {card.gender === 'der' ? 'der' : card.gender === 'die' ? 'die' : 'das'}
                    </span>
                    {card.german}
                  </>
                ) : (
                  card.german
                )}
              </h2>
            </div>

            {/* PLURAL DISPLAY STATE */}
            {hasPlural && (
              <>
                {flipState === 'plural' ? (
                  <div className="plural-container">
                    <div className="plural-title">Plural</div>
                    <div className="plural-word">{card.plural}</div>
                  </div>
                ) : (
                  <div className="plural-guess-hint">
                    Tap again to reveal plural ({card.plural ? 'Plural exists' : ''})
                  </div>
                )}
              </>
            )}

            <div className="flip-prompt">
              {flipState === 'back' && hasPlural ? 'Tap again to see plural' : 'Rate your guess below'}
            </div>
          </div>
        </div>
      </div>

      {/* REVIEW RATING ACTIONS (Only shown when card is flipped) */}
      {flipState !== 'front' && (
        <div className="rating-container">
          <button 
            className="rate-btn wrong" 
            onClick={() => onRate(false)}
            aria-label="Mark as incorrect (Press 1 or Left Arrow)"
          >
            <span>❌</span> Wrong
          </button>
          <button 
            className="rate-btn correct" 
            onClick={() => onRate(true)}
            aria-label="Mark as correct (Press 2 or Right Arrow)"
          >
            <span>✨</span> Correct
          </button>
        </div>
      )}
    </div>
  );
}
