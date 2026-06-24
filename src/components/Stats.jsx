import React from 'react';

export default function Stats({ words, progress }) {
  if (!words || words.length === 0) {
    return (
      <div className="panel empty-state">
        <div className="empty-state-icon">📊</div>
        <p>Nessuna statistica da mostrare al momento. Inizia a ripassare le carte per tracciare i tuoi progressi!</p>
      </div>
    );
  }

  // General Statistics Calculations
  const totalWords = words.length;
  const reviewedIds = Object.keys(progress).filter(id => words.some(w => w.id === id));
  const totalReviewed = reviewedIds.length;
  
  let totalCorrectSessions = 0;
  let totalSessionReviews = 0;
  let learnedCount = 0; // weight <= 25
  let strugglingCount = 0; // weight >= 200

  reviewedIds.forEach(id => {
    const stats = progress[id];
    if (stats) {
      totalCorrectSessions += stats.correctCount || 0;
      totalSessionReviews += stats.totalCount || 0;
      if (stats.weight <= 25) {
        learnedCount++;
      } else if (stats.weight >= 200) {
        strugglingCount++;
      }
    }
  });

  const averageCorrectness = totalSessionReviews > 0 
    ? Math.round((totalCorrectSessions / totalSessionReviews) * 100) 
    : 0;

  // Group stats by Unit
  const units = [...new Set(words.map(w => w.unit || 'Default'))];
  const unitStats = units.map(unitName => {
    const unitWords = words.filter(w => (w.unit || 'Default') === unitName);
    const unitWordIds = unitWords.map(w => w.id);
    const unitReviewed = unitWordIds.filter(id => progress[id]);
    
    let unitCorrect = 0;
    let unitTotal = 0;
    let unitLearned = 0;

    unitWordIds.forEach(id => {
      const stats = progress[id];
      if (stats) {
        unitCorrect += stats.correctCount || 0;
        unitTotal += stats.totalCount || 0;
        if (stats.weight <= 25) {
          unitLearned++;
        }
      }
    });

    const unitAccuracy = unitTotal > 0 ? Math.round((unitCorrect / unitTotal) * 100) : 0;
    
    return {
      name: unitName,
      totalCount: unitWords.length,
      reviewedCount: unitReviewed.length,
      learnedCount: unitLearned,
      accuracy: unitAccuracy,
      totalReviews: unitTotal,
    };
  }).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

  return (
    <div className="panel">
      <h2 style={{ marginBottom: '20px' }}>I tuoi progressi</h2>
      
      {/* Top Level Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{totalWords}</div>
          <div className="stat-label">Parole totali</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{learnedCount}</div>
          <div className="stat-label">Imparate (Consolidate)</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{strugglingCount}</div>
          <div className="stat-label">In difficoltà</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{averageCorrectness}%</div>
          <div className="stat-label">Precisione</div>
        </div>
      </div>

      {/* Progress Breakdown by Unit */}
      <h3 style={{ marginTop: '24px', marginBottom: '12px', fontSize: '1.2rem', color: 'var(--text-primary)' }}>
        Progressi per unità
      </h3>
      <div className="word-table-wrapper">
        <table className="word-table">
          <thead>
            <tr>
              <th>Unità</th>
              <th>Parole</th>
              <th>Ripassate</th>
              <th>Imparate</th>
              <th>Ripassi totali</th>
              <th>Precisione</th>
            </tr>
          </thead>
          <tbody>
            {unitStats.map(unit => (
              <tr key={unit.name}>
                <td><strong>{unit.name}</strong></td>
                <td>{unit.totalCount}</td>
                <td>{unit.reviewedCount} ({Math.round((unit.reviewedCount / unit.totalCount) * 100)}%)</td>
                <td>{unit.learnedCount}</td>
                <td>{unit.totalReviews}</td>
                <td>
                  <span style={{ 
                    color: unit.totalReviews === 0 
                      ? 'var(--text-muted)' 
                      : unit.accuracy >= 80 
                        ? 'var(--success)' 
                        : unit.accuracy >= 50 
                          ? 'var(--secondary)' 
                          : 'var(--danger)'
                  }}>
                    {unit.totalReviews > 0 ? `${unit.accuracy}%` : '-'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
