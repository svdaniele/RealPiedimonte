import React, { useMemo, useState } from 'react';
import {
  Bookmark,
  Copy,
  Play,
  Share2,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { getFormationById } from '../data/formations';
import { Player, SavedLineup, TeamSettings } from '../types';
import { MiniPitchPreview } from './JerseySvg';

interface SavedLineupsViewProps {
  savedLineups: SavedLineup[];
  players: Player[];
  team: TeamSettings;
  activeSavedId: string | null;
  onLoadLineup: (lineup: SavedLineup) => void;
  onToggleFavorite: (id: string) => void;
  onDuplicateLineup: (lineup: SavedLineup) => void;
  onDeleteLineup: (id: string) => void;
  onShareLineup: (lineup: SavedLineup) => void;
  onSaveCurrentClick: () => void;
}

export const SavedLineupsView: React.FC<SavedLineupsViewProps> = ({
  savedLineups,
  players,
  team,
  activeSavedId,
  onLoadLineup,
  onToggleFavorite,
  onDuplicateLineup,
  onDeleteLineup,
  onShareLineup,
  onSaveCurrentClick,
}) => {
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const playerMap = useMemo(() => new Map(players.map((p) => [p.id, p])), [players]);

  const sortedLineups = useMemo(() => {
    const filtered =
      filter === 'favorites' ? savedLineups.filter((s) => s.favorite) : savedLineups;
    return [...filtered].sort((a, b) => {
      if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [savedLineups, filter]);

  const favCount = savedLineups.filter((s) => s.favorite).length;

  const formatDate = (iso: string) => {
    try {
      return new Intl.DateTimeFormat('it-IT', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(new Date(iso));
    } catch {
      return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-athletic text-3xl sm:text-4xl font-bold text-[#111815] leading-none">
            Formazioni Salvate
          </h1>
          <p className="text-sm text-[#52605A] mt-1.5">
            <span className="font-mono tabular-nums font-semibold text-[#111815]">
              {savedLineups.length}
            </span>{' '}
            salvate ·{' '}
            <span className="font-mono tabular-nums font-semibold text-amber-700">{favCount}</span>{' '}
            preferite pronte per le prossime partite
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1 p-1 bg-[#E9EDE8] rounded-xl">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                filter === 'all'
                  ? 'bg-white text-[#111815] shadow-xs'
                  : 'text-[#52605A] hover:text-[#111815]'
              }`}
            >
              Tutte ({savedLineups.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('favorites')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                filter === 'favorites'
                  ? 'bg-white text-[#111815] shadow-xs'
                  : 'text-[#52605A] hover:text-[#111815]'
              }`}
            >
              Solo Preferite ({favCount})
            </button>
          </div>

          <button
            type="button"
            onClick={onSaveCurrentClick}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-[#15803D] hover:bg-[#166534] text-white rounded-xl transition-colors whitespace-nowrap cursor-pointer"
          >
            <Bookmark className="w-4 h-4" />
            Salva formazione attuale
          </button>
        </div>
      </div>

      {/* Empty State */}
      {sortedLineups.length === 0 ? (
        <div className="bg-white border border-[#E2E6E1] rounded-2xl py-16 px-6 text-center">
          <p className="text-base font-semibold text-[#111815]">
            {filter === 'favorites'
              ? 'Nessuna formazione contrassegnata come preferita'
              : 'Non hai ancora salvato nessuna formazione'}
          </p>
          <p className="text-sm text-[#52605A] mt-1 max-w-md mx-auto">
            Salva gli schieramenti migliori per ricaricarli in un clic prima delle partite future.
          </p>
          <button
            type="button"
            onClick={onSaveCurrentClick}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-[#15803D] text-white rounded-xl hover:bg-[#166534] cursor-pointer"
          >
            <Bookmark className="w-4 h-4" />
            Salva la formazione attuale
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sortedLineups.map((item) => {
            const formation = getFormationById(item.formationId);
            const starterIds = Object.values(item.starters).filter((id) => playerMap.has(id));
            const captain = item.captainId ? playerMap.get(item.captainId) : undefined;
            const isLoaded = activeSavedId === item.id;

            return (
              <article
                key={item.id}
                className={`bg-white border rounded-2xl p-4 flex flex-col justify-between gap-4 transition-colors ${
                  isLoaded ? 'border-[#15803D] ring-1 ring-[#15803D]/30' : 'border-[#E2E6E1]'
                }`}
              >
                <div className="flex gap-4">
                  {/* Miniature Tactical Pitch */}
                  <div className="w-[96px] h-[126px] shrink-0">
                    <MiniPitchPreview
                      formation={formation}
                      starters={item.starters}
                      team={team}
                    />
                  </div>

                  {/* Details (Zero Pill Metadata) */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-base font-bold text-[#111815] leading-snug line-clamp-2">
                          {item.title}
                        </h3>
                        <button
                          type="button"
                          onClick={() => onToggleFavorite(item.id)}
                          aria-label={
                            item.favorite ? 'Rimuovi dalle preferite' : 'Segna come preferita'
                          }
                          className="p-1 -mr-1 -mt-0.5 text-[#75847D] hover:text-amber-500 transition-colors shrink-0 cursor-pointer"
                        >
                          <Star
                            className={`w-4.5 h-4.5 ${
                              item.favorite ? 'fill-amber-400 text-amber-500' : ''
                            }`}
                          />
                        </button>
                      </div>

                      <div className="mt-1.5 text-xs text-[#52605A] flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                        <span className="font-athletic text-base font-bold text-[#111815]">
                          {formation.name}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>Calcio a {item.format}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">
                          {starterIds.length}/{formation.slots.length}
                        </span>
                      </div>

                      {captain && (
                        <div className="mt-1 text-xs text-[#52605A] truncate">
                          Capitano: <span className="font-medium text-[#111815]">{captain.shirtName}</span>
                        </div>
                      )}

                      {item.matchInfo.notes && (
                        <p className="mt-2 text-xs text-[#52605A] line-clamp-2 leading-relaxed">
                          {item.matchInfo.notes}
                        </p>
                      )}
                    </div>

                    <div className="mt-2 text-[11px] text-[#75847D] flex items-center gap-1.5">
                      <span>Aggiornata il {formatDate(item.updatedAt)}</span>
                      {isLoaded && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-semibold text-[#15803D]">In campo ora</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Footer */}
                <div className="pt-3 border-t border-[#F0F2EF] flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onLoadLineup(item)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#15803D] hover:bg-[#166534] text-white rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Carica in campo
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onShareLineup(item)}
                      title="Esporta screenshot WhatsApp"
                      className="p-2 text-[#52605A] hover:text-[#15803D] hover:bg-[#EDF7F0] rounded-lg transition-colors cursor-pointer"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDuplicateLineup(item)}
                      title="Duplica formazione"
                      className="p-2 text-[#52605A] hover:text-[#111815] hover:bg-[#F2F5F2] rounded-lg transition-colors cursor-pointer"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    {confirmDeleteId === item.id ? (
                      <div className="inline-flex items-center gap-1 ml-1">
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteLineup(item.id);
                            setConfirmDeleteId(null);
                          }}
                          className="px-2 py-1 text-xs font-semibold bg-rose-600 text-white rounded-md hover:bg-rose-700 cursor-pointer"
                        >
                          Elimina
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="p-1 text-[#52605A] cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(item.id)}
                        title="Elimina formazione"
                        className="p-2 text-[#52605A] hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
