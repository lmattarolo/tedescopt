import React, { useState } from 'react';
import { 
  importUnit, 
  addWord, 
  updateWord, 
  deleteWord, 
  exportBackup, 
  importBackup, 
  resetDatabase 
} from '../utils/db';

export default function DeckManager({ words, onDataChange }) {
  const [selectedUnitFilter, setSelectedUnitFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states for Add/Edit Word
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [editingWord, setEditingWord] = useState(null);

  // Form states
  const [formItalian, setFormItalian] = useState('');
  const [formGerman, setFormGerman] = useState('');
  const [formUnit, setFormUnit] = useState('Einheit 1');
  const [formPartOfSpeech, setFormPartOfSpeech] = useState('nome');
  const [formGender, setFormGender] = useState('');
  const [formPlural, setFormPlural] = useState('');

  // Get list of unique units for filtering
  const units = ['All', ...new Set(words.map(w => w.unit))].sort((a, b) => 
    a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
  );

  // Filtered words for display
  const filteredWords = words.filter(word => {
    const matchesUnit = selectedUnitFilter === 'All' || word.unit === selectedUnitFilter;
    const matchesSearch = 
      word.italian.toLowerCase().includes(searchQuery.toLowerCase()) ||
      word.german.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesUnit && matchesSearch;
  });

  // Handle open add modal
  const openAddModal = () => {
    setModalMode('add');
    setEditingWord(null);
    setFormItalian('');
    setFormGerman('');
    setFormUnit(selectedUnitFilter !== 'All' ? selectedUnitFilter : 'Einheit 1');
    setFormPartOfSpeech('nome');
    setFormGender('');
    setFormPlural('');
    setIsModalOpen(true);
  };

  // Handle open edit modal
  const openEditModal = (word) => {
    setModalMode('edit');
    setEditingWord(word);
    setFormItalian(word.italian);
    setFormGerman(word.german);
    setFormUnit(word.unit);
    setFormPartOfSpeech(word.partOfSpeech || 'nome');
    setFormGender(word.gender || '');
    setFormPlural(word.plural || '');
    setIsModalOpen(true);
  };

  // Handle save form (Add or Edit)
  const handleSave = (e) => {
    e.preventDefault();
    if (!formItalian.trim() || !formGerman.trim()) {
      alert('I campi in italiano e tedesco sono obbligatori!');
      return;
    }

    const wordData = {
      italian: formItalian,
      german: formGerman,
      unit: formUnit,
      partOfSpeech: formPartOfSpeech,
      gender: formPartOfSpeech === 'nome' ? formGender || null : null,
      plural: formPartOfSpeech === 'nome' ? formPlural || null : null,
    };

    if (modalMode === 'add') {
      addWord(wordData);
    } else {
      updateWord({ ...wordData, id: editingWord.id });
    }

    setIsModalOpen(false);
    onDataChange(); // Notify parent of database changes
  };

  // Handle word deletion
  const handleDelete = (wordId) => {
    if (confirm('Sei sicuro di voler eliminare questa parola?')) {
      deleteWord(wordId);
      onDataChange();
    }
  };

  // File import (Single Unit JSON)
  const handleUnitFileImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (!data.unit || !data.words || !Array.isArray(data.words)) {
          alert('Formato file non valido. Deve contenere una stringa "unit" e un array "words".');
          return;
        }
        importUnit(data.unit, data.words);
        alert(`Unità "${data.unit}" importata con successo con ${data.words.length} parole!`);
        onDataChange();
      } catch (err) {
        alert('Impossibile analizzare il file JSON.');
      }
    };
    reader.readAsText(file);
    // Reset file input value
    e.target.value = null;
  };

  // Database Backup Import
  const handleBackupImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        importBackup(event.target.result);
        alert('Database di backup importato con successo!');
        onDataChange();
      } catch (err) {
        alert('Ripristino del backup fallito: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  // Database Backup Export
  const handleBackupExport = () => {
    try {
      const dataStr = exportBackup();
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `tedescopt_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Esportazione del backup fallita: ' + err.message);
    }
  };

  // Reset database completely
  const handleResetDatabase = () => {
    if (confirm('CRITICO: Questo eliminerà tutte le unità importate e la cronologia dei progressi di studio. Vuoi continuare?')) {
      resetDatabase();
      onDataChange();
    }
  };

  return (
    <div className="panel">
      <h2>Gestione Vocabolario</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '0.9rem' }}>
        Importa nuove unità di glossario analizzate da Antigravity, aggiungi parole manualmente, correggi refusi e fai il backup/ripristino dei progressi.
      </p>

      {/* Control Buttons Panel */}
      <div className="deck-controls">
        <button className="btn-primary" onClick={openAddModal}>
          ➕ Aggiungi parola manualmente
        </button>
        
        <div className="file-input-wrapper">
          <button className="btn-secondary">📥 Importa JSON Unità</button>
          <input type="file" accept=".json" onChange={handleUnitFileImport} />
        </div>

        <button className="btn-secondary" onClick={handleBackupExport}>
          💾 Esporta Backup
        </button>

        <div className="file-input-wrapper">
          <button className="btn-secondary">🔄 Importa Backup</button>
          <input type="file" accept=".json" onChange={handleBackupImport} />
        </div>

        <button className="btn-secondary" style={{ borderColor: 'rgba(239, 68, 68, 0.3)', color: 'var(--danger)' }} onClick={handleResetDatabase}>
          ⚠️ Ripristina Database
        </button>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '20px 0' }} />

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <div className="form-group" style={{ flex: '1', minWidth: '160px', marginBottom: '0' }}>
          <select 
            className="input-control" 
            value={selectedUnitFilter}
            onChange={(e) => setSelectedUnitFilter(e.target.value)}
          >
            {units.map(unit => (
              <option key={unit} value={unit}>
                {unit === 'All' ? 'Tutte le unità' : unit}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group" style={{ flex: '2', minWidth: '240px', marginBottom: '0' }}>
          <input 
            type="text" 
            className="input-control" 
            placeholder="Cerca per parola in italiano o tedesco..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Word Table List */}
      {filteredWords.length === 0 ? (
        <div className="empty-state">
          <p>Nessuna parola corrisponde ai filtri selezionati.</p>
        </div>
      ) : (
        <div className="word-table-wrapper">
          <table className="word-table">
            <thead>
              <tr>
                <th>Unità</th>
                <th>Italiano</th>
                <th>Tedesco</th>
                <th>Tipo</th>
                <th>Genere</th>
                <th>Plurale</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {filteredWords.map(word => (
                <tr key={word.id}>
                  <td><span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{word.unit}</span></td>
                  <td><strong>{word.italian}</strong></td>
                  <td>
                    {word.partOfSpeech === 'nome' && word.gender ? (
                      <>
                        <span style={{ color: 'var(--text-muted)', marginRight: '6px' }}>
                          {word.gender}
                        </span>
                        {word.german}
                      </>
                    ) : (
                      word.german
                    )}
                  </td>
                  <td><span style={{ fontSize: '0.8rem', opacity: 0.8 }}>{word.partOfSpeech}</span></td>
                  <td>
                    {word.gender ? (
                      <span className={`gender-badge ${word.gender}`} style={{ fontSize: '0.7rem' }}>
                        {word.gender}
                      </span>
                    ) : '-'}
                  </td>
                  <td><span style={{ color: 'var(--secondary)' }}>{word.plural || '-'}</span></td>
                  <td>
                    <div className="action-cell">
                      <button className="btn-icon" onClick={() => openEditModal(word)} title="Modifica parola">
                        ✏️
                      </button>
                      <button className="btn-icon delete" onClick={() => handleDelete(word.id)} title="Elimina parola">
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Dialog for Add / Edit */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-header">
              {modalMode === 'add' ? 'Aggiungi nuova parola' : 'Modifica dettagli parola'}
            </h3>
            
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Parola in italiano</label>
                <input 
                  type="text" 
                  className="input-control" 
                  value={formItalian}
                  onChange={(e) => setFormItalian(e.target.value)}
                  placeholder="es. la sedia"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Parola in tedesco (radice)</label>
                <input 
                  type="text" 
                  className="input-control" 
                  value={formGerman}
                  onChange={(e) => setFormGerman(e.target.value)}
                  placeholder="es. Stuhl (senza articolo)"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Unità</label>
                <input 
                  type="text" 
                  className="input-control" 
                  value={formUnit}
                  onChange={(e) => setFormUnit(e.target.value)}
                  placeholder="es. Einheit 1"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Parte del discorso</label>
                <select 
                  className="input-control"
                  value={formPartOfSpeech}
                  onChange={(e) => setFormPartOfSpeech(e.target.value)}
                >
                  <option value="nome">Sostantivo</option>
                  <option value="verbo">Verbo</option>
                  <option value="aggettivo">Aggettivo</option>
                  <option value="altro">Altro</option>
                </select>
              </div>

              {formPartOfSpeech === 'nome' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Genere</label>
                    <select 
                      className="input-control"
                      value={formGender}
                      onChange={(e) => setFormGender(e.target.value)}
                    >
                      <option value="">Nessun genere</option>
                      <option value="der">der (Maschile)</option>
                      <option value="die">die (Femminile)</option>
                      <option value="das">das (Neutro)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Forma plurale (se esiste)</label>
                    <input 
                      type="text" 
                      className="input-control" 
                      value={formPlural}
                      onChange={(e) => setFormPlural(e.target.value)}
                      placeholder="es. Stühle"
                    />
                  </div>
                </>
              )}

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Annulla
                </button>
                <button type="submit" className="btn-primary">
                  {modalMode === 'add' ? 'Crea parola' : 'Salva modifiche'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
