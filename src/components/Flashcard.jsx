import React, { useState, useEffect } from 'react';
import { formatGermanPlural, capitalizeItalianIfNoun } from '../utils/db';

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

  // Determine if plural exists safely
  const hasPlural = card && (card.partOfSpeech === 'nome' || card.partOfSpeech === 'noun') && card.plural && card.plural.trim() !== '';

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
    if (!card) return; // Don't attach listeners if no card

    const isFinalState = hasPlural ? flipState === 'plural' : flipState === 'back';

    const handleKeyDown = (e) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        handleCardClick();
      } else if (e.code === 'Digit1' || e.code === 'ArrowLeft') {
        if (isFinalState) onRate(false);
      } else if (e.code === 'Digit2' || e.code === 'ArrowRight') {
        if (isFinalState) onRate(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [flipState, card, onRate, hasPlural]);

  if (!card) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📚</div>
        <p>Nessuna carta disponibile. Importa delle unità o aggiungi parole in "Gestisci mazzi" per iniziare!</p>
      </div>
    );
  }

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
      case 'nome':
      case 'noun': return 'Sostantivo';
      case 'verbo':
      case 'verb': return 'Verbo';
      case 'aggettivo':
      case 'adjective': return 'Aggettivo';
      default: return 'Altro';
    }
  };

  return (
    <div className="study-container">
      <div 
        key={card.id}
        className={wrapperClass} 
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
        aria-label={`Flashcard: ${capitalizeItalianIfNoun(card.italian, card.partOfSpeech)}. Premi Spazio per girare.`}
      >
        <div className="flashcard">
          {/* FRONT FACE (Italian Word) */}
          <div className="card-face card-front">
            <span className="card-unit-badge">{card.unit}</span>
            <span className="card-pos-badge">{getPosLabel(card.partOfSpeech)}</span>
            <h2 className="card-text">{capitalizeItalianIfNoun(card.italian, card.partOfSpeech)}</h2>
            <div className="flip-prompt">Tocca o premi Spazio per girare</div>
          </div>

          {/* BACK FACE (German Word + Details) */}
          <div className="card-face card-back">
            <span className="card-unit-badge">{card.unit}</span>
            <span className="card-pos-badge">{getPosLabel(card.partOfSpeech)}</span>
            
            <div className="german-container">
              {card.partOfSpeech === 'nome' && card.gender && (
                <span className={`gender-badge ${card.gender}`}>
                  {card.gender}
                </span>
              )}
              <h2 className="german-word">
                {card.partOfSpeech === 'nome' && card.gender ? (
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
                    <div className="plural-title">Plurale</div>
                    <div className="plural-word">{formatGermanPlural(card.plural)}</div>
                  </div>
                ) : (
                  <div className="plural-guess-hint">
                    Tocca ancora per mostrare il plurale ({card.plural ? 'Il plurale esiste' : ''})
                  </div>
                )}
              </>
            )}

            <div className="flip-prompt">
              {flipState === 'back' && hasPlural ? 'Tocca ancora per vedere il plurale' : 'Valuta la tua risposta qui sotto'}
            </div>
          </div>
        </div>
      </div>

      {/* REVIEW RATING ACTIONS (Only shown when card is flipped to its final state) */}
      {(hasPlural ? flipState === 'plural' : flipState === 'back') && (
        <div className="rating-container">
          <button 
            className="rate-btn wrong" 
            onClick={() => onRate(false)}
            aria-label="Segna come errato (Premi 1 o Freccia Sinistra)"
          >
            <span>❌</span> Errato
          </button>
          <button 
            className="rate-btn correct" 
            onClick={() => onRate(true)}
            aria-label="Segna come corretto (Premi 2 o Freccia Destra)"
          >
            <span>✨</span> Corretto
          </button>
        </div>
      )}
    </div>
  );
}
