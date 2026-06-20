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
  const [formPartOfSpeech, setFormPartOfSpeech] = useState('noun');
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
    setFormPartOfSpeech('noun');
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
    setFormPartOfSpeech(word.partOfSpeech || 'noun');
    setFormGender(word.gender || '');
    setFormPlural(word.plural || '');
    setIsModalOpen(true);
  };

  // Handle save form (Add or Edit)
  const handleSave = (e) => {
    e.preventDefault();
    if (!formItalian.trim() || !formGerman.trim()) {
      alert('Italian and German fields are required!');
      return;
    }

    const wordData = {
      italian: formItalian,
      german: formGerman,
      unit: formUnit,
      partOfSpeech: formPartOfSpeech,
      gender: formPartOfSpeech === 'noun' ? formGender || null : null,
      plural: formPartOfSpeech === 'noun' ? formPlural || null : null,
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
    if (confirm('Are you sure you want to delete this word?')) {
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
          alert('Invalid file format. Must contain a "unit" string and "words" array.');
          return;
        }
        importUnit(data.unit, data.words);
        alert(`Successfully imported Unit "${data.unit}" with ${data.words.length} words!`);
        onDataChange();
      } catch (err) {
        alert('Failed to parse JSON file.');
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
        alert('Backup database imported successfully!');
        onDataChange();
      } catch (err) {
        alert('Failed to restore backup: ' + err.message);
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
      alert('Failed to export backup: ' + err.message);
    }
  };

  // Reset database completely
  const handleResetDatabase = () => {
    if (confirm('CRITICAL: This will wipe out all imported units and study progress history. Do you want to continue?')) {
      resetDatabase();
      onDataChange();
    }
  };

  return (
    <div className="panel">
      <h2>Manage Vocabulary</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '0.9rem' }}>
        Import new glossary units parsed by Antigravity, add words manually, edit typos, and backup/restore progress.
      </p>

      {/* Control Buttons Panel */}
      <div className="deck-controls">
        <button className="btn-primary" onClick={openAddModal}>
          ➕ Add Word Manually
        </button>
        
        <div className="file-input-wrapper">
          <button className="btn-secondary">📥 Import Unit JSON</button>
          <input type="file" accept=".json" onChange={handleUnitFileImport} />
        </div>

        <button className="btn-secondary" onClick={handleBackupExport}>
          💾 Export Backup
        </button>

        <div className="file-input-wrapper">
          <button className="btn-secondary">🔄 Import Backup</button>
          <input type="file" accept=".json" onChange={handleBackupImport} />
        </div>

        <button className="btn-secondary" style={{ borderColor: 'rgba(239, 68, 68, 0.3)', color: 'var(--danger)' }} onClick={handleResetDatabase}>
          ⚠️ Reset Database
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
                {unit === 'All' ? 'All Units' : unit}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group" style={{ flex: '2', minWidth: '240px', marginBottom: '0' }}>
          <input 
            type="text" 
            className="input-control" 
            placeholder="Search by Italian or German word..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Word Table List */}
      {filteredWords.length === 0 ? (
        <div className="empty-state">
          <p>No words match the selected filters.</p>
        </div>
      ) : (
        <div className="word-table-wrapper">
          <table className="word-table">
            <thead>
              <tr>
                <th>Unit</th>
                <th>Italian</th>
                <th>German</th>
                <th>Type</th>
                <th>Gender</th>
                <th>Plural</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredWords.map(word => (
                <tr key={word.id}>
                  <td><span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{word.unit}</span></td>
                  <td><strong>{word.italian}</strong></td>
                  <td>
                    {word.partOfSpeech === 'noun' && word.gender ? (
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
                      <button className="btn-icon" onClick={() => openEditModal(word)} title="Edit word">
                        ✏️
                      </button>
                      <button className="btn-icon delete" onClick={() => handleDelete(word.id)} title="Delete word">
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
              {modalMode === 'add' ? 'Add New Word' : 'Edit Word Details'}
            </h3>
            
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Italian Word</label>
                <input 
                  type="text" 
                  className="input-control" 
                  value={formItalian}
                  onChange={(e) => setFormItalian(e.target.value)}
                  placeholder="e.g. la sedia"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">German Word (Root)</label>
                <input 
                  type="text" 
                  className="input-control" 
                  value={formGerman}
                  onChange={(e) => setFormGerman(e.target.value)}
                  placeholder="e.g. Stuhl (no gender prefix)"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Unit</label>
                <input 
                  type="text" 
                  className="input-control" 
                  value={formUnit}
                  onChange={(e) => setFormUnit(e.target.value)}
                  placeholder="e.g. Einheit 1"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Part of Speech</label>
                <select 
                  className="input-control"
                  value={formPartOfSpeech}
                  onChange={(e) => setFormPartOfSpeech(e.target.value)}
                >
                  <option value="noun">Noun</option>
                  <option value="verb">Verb</option>
                  <option value="adjective">Adjective</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {formPartOfSpeech === 'noun' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Gender</label>
                    <select 
                      className="input-control"
                      value={formGender}
                      onChange={(e) => setFormGender(e.target.value)}
                    >
                      <option value="">No Gender</option>
                      <option value="der">der (Masculine)</option>
                      <option value="die">die (Feminine)</option>
                      <option value="das">das (Neuter)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Plural Form (if exists)</label>
                    <input 
                      type="text" 
                      className="input-control" 
                      value={formPlural}
                      onChange={(e) => setFormPlural(e.target.value)}
                      placeholder="e.g. Stühle"
                    />
                  </div>
                </>
              )}

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {modalMode === 'add' ? 'Create Word' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
