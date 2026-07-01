import React, { useState, useEffect, useRef } from 'react';
import StoryCard from './StoryCard';

export default function StoriesView({ stories }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(5);
  const observerTarget = useRef(null);

  // Reset visible count when search changes
  useEffect(() => {
    setVisibleCount(5);
  }, [searchQuery]);

  const filteredStories = stories.filter(story => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    
    // Check if any of the wordsUsed in any paragraph match the query
    return story.paragraphs.some(para => 
      para.wordsUsed && para.wordsUsed.some(word => word.toLowerCase().includes(query))
    );
  });

  const visibleStories = filteredStories.slice(0, visibleCount);

  // Intersection Observer for infinite scrolling
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && visibleCount < filteredStories.length) {
          setVisibleCount(prev => prev + 5);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [observerTarget, visibleCount, filteredStories.length]);

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <h2 style={{ marginBottom: '16px' }}>Storie Mnemoniche</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem', lineHeight: '1.5' }}>
        Usa queste storie per ricordare il genere tedesco delle parole (der, die, das).<br/>
        <strong>Superman</strong> è associato alle parole maschili (der).<br/>
        <strong>La Regina</strong> è associata alle parole femminili (die).<br/>
        <strong>Il Bambino</strong> è associato alle parole neutre (das).
      </p>

      <div className="form-group" style={{ marginBottom: '24px' }}>
        <input 
          type="text" 
          className="input-control" 
          placeholder="Cerca una parola in italiano (es. sedia)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="stories-list" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {filteredStories.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🕵️</div>
            <p>Nessuna storia trovata.</p>
          </div>
        ) : (
          <>
            {visibleStories.map(story => (
              <StoryCard key={story.id} story={story} />
            ))}
            
            {/* Invisible target for IntersectionObserver to trigger loading more */}
            {visibleCount < filteredStories.length && (
              <div ref={observerTarget} style={{ height: '20px', display: 'flex', justifyContent: 'center', color: 'var(--text-muted)' }}>
                Caricamento altre storie...
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
