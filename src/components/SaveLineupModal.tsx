import React, { useEffect, useState } from 'react';
import { Bookmark, Star, X } from 'lucide-react';
import { getFormationById } from '../data/formations';
import { ActiveLineup, SavedLineup } from '../types';

interface SaveLineupModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeLineup: ActiveLineup;
  savedLineups: SavedLineup[];
  editingLineupId: string | null;
  onSave: (payload: {
    title: string;
    favorite: boolean;
    notes: string;
    overwriteId: string | null;
  }) => void;
}

export const SaveLineupModal: React.FC<SaveLineupModalProps> = ({
  isOpen,
  onClose,
  activeLineup,
  savedLineups,
  editingLineupId,
  onSave,
}) => {
  const formation = getFormationById(activeLineup.formationId);
  const existing = savedLineups.find((s) => s.id === editingLineupId);

  const [title, setTitle] = useState('');
  const [favorite, setFavorite] = useState(true);
  const [notes, setNotes] = useState('');
  const [overwriteId, setOverwriteId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (existing) {
      setTitle(existing.title);
      setFavorite(existing.favorite);
      setNotes(activeLineup.matchInfo.notes || existing.matchInfo.notes || '');
      setOverwriteId(existing.id);
    } else {
      const opp = activeLineup.matchInfo.opponent.trim();
      setTitle(opp ? `${formation.name} vs ${opp}` : `Formazione ${formation.name}`);
      setFavorite(true);
      setNotes(activeLineup.matchInfo.notes || '');
      setOverwriteId(null);
    }
  }, [isOpen, existing, activeLineup, formation.name]);

  if (!isOpen) return null;

  const filledCount = Object.values(activeLineup.starters).filter(Boolean).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      favorite,
      notes: notes.trim(),
      overwriteId,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-lineup-title"
    >
      <div className="w-full max-w-md bg-white rounded-2xl border border-[#E2E6E1] shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#ECEFEA]">
          <h2 id="save-lineup-title" className="font-athletic text-2xl font-bold text-[#111815]">
            Salva Formazione
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi"
            className="p-2 text-[#52605A] hover:text-[#111815] hover:bg-[#F2F5F2] rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="text-xs text-[#52605A]">
            Modulo <strong className="text-[#111815]">{formation.name}</strong> · Calcio a{' '}
            {activeLineup.format} ·{' '}
            <span className="font-mono tabular-nums">
              {filledCount}/{formation.slots.length}
            </span>{' '}
            titolari · <span className="font-mono tabular-nums">{activeLineup.bench.length}</span>{' '}
            in panchina
          </div>

          <div>
            <label htmlFor="lineup-title-input" className="block text-xs font-semibold text-[#111815] mb-1.5">
              Nome della formazione
            </label>
            <input
              id="lineup-title-input"
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Es. Titolare 4-3-3 in casa"
              className="w-full px-3.5 py-2.5 text-sm bg-[#F5F6F4] border border-[#DCE1DC] focus:border-[#15803D] focus:bg-white rounded-xl outline-none transition-colors"
            />
          </div>

          <div>
            <label htmlFor="lineup-notes-input" className="block text-xs font-semibold text-[#111815] mb-1.5">
              Note tattiche o indicazioni (opzionale)
            </label>
            <textarea
              id="lineup-notes-input"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Es. Pressing alto, marcature sui calci d'angolo..."
              className="w-full px-3.5 py-2 text-sm bg-[#F5F6F4] border border-[#DCE1DC] focus:border-[#15803D] focus:bg-white rounded-xl outline-none resize-none transition-colors"
            />
          </div>

          {existing && (
            <div className="flex items-center gap-2 p-1 bg-[#F2F4F1] rounded-xl">
              <button
                type="button"
                onClick={() => setOverwriteId(existing.id)}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  overwriteId === existing.id
                    ? 'bg-white text-[#111815] shadow-xs'
                    : 'text-[#52605A]'
                }`}
              >
                Aggiorna esistente
              </button>
              <button
                type="button"
                onClick={() => setOverwriteId(null)}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  overwriteId === null
                    ? 'bg-white text-[#111815] shadow-xs'
                    : 'text-[#52605A]'
                }`}
              >
                Salva come nuova
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setFavorite((f) => !f)}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-colors cursor-pointer ${
              favorite
                ? 'bg-amber-50 border-amber-300 text-amber-950'
                : 'bg-[#F7F8F6] border-[#E2E6E1] text-[#52605A]'
            }`}
          >
            <span className="flex items-center gap-2">
              <Star
                className={`w-4 h-4 ${favorite ? 'fill-amber-500 text-amber-500' : 'text-[#75847D]'}`}
              />
              Aggiungi alle formazioni preferite
            </span>
            <span className="text-xs font-semibold">{favorite ? 'Sì' : 'No'}</span>
          </button>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-[#52605A] hover:text-[#111815] rounded-xl cursor-pointer"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-[#15803D] hover:bg-[#166534] text-white rounded-xl transition-colors cursor-pointer"
            >
              <Bookmark className="w-4 h-4" />
              {overwriteId ? 'Aggiorna' : 'Salva formazione'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
