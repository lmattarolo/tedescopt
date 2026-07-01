import React from 'react';
import { capitalizeItalianIfNoun } from '../utils/db';

export default function StoryCard({ story }) {
  if (!story || !story.paragraphs) return null;

  // Highlight words in the text based on gender
  const highlightText = (text, wordsToHighlight, gender) => {
    if (!wordsToHighlight || wordsToHighlight.length === 0) return text;
    
    // Tokenize text into words (including Italian accents) and non-words
    // This perfectly handles cases like "caffè" and "città" which break \b regex boundaries
    const pattern = /([a-zA-ZÀ-ÖØ-öø-ÿ]+)/g;
    const parts = text.split(pattern);
    
    return parts.map((part, i) => {
      const isMatch = wordsToHighlight.some(w => w.toLowerCase() === part.toLowerCase());
      if (isMatch) {
        return (
          <span key={i} className={`gender-badge ${gender} inline-badge`} style={{ margin: '0 2px' }}>
            {capitalizeItalianIfNoun(part, 'nome')}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="story-card panel" style={{ marginBottom: '20px' }}>
      {story.unit && (
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          {story.unit}
        </div>
      )}
      
      <div className="story-paragraphs" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {story.paragraphs.map((para, idx) => (
          <div key={idx} className="story-paragraph">
            <div className="story-character-title" style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '8px', color: 'var(--text-primary)' }}>
              {para.character} <span style={{ opacity: 0.5, fontSize: '0.9rem', fontWeight: '400' }}>({para.gender})</span>
            </div>
            <p className="story-text" style={{ lineHeight: '1.6', fontSize: '1.05rem', color: 'var(--text-secondary)' }}>
              {highlightText(para.text, para.wordsUsed, para.gender)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
