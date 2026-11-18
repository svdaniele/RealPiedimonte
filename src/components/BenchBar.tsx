import React from 'react';
import { ArrowLeftRight, ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { ROLE_META } from '../data/formations';
import { Player } from '../types';

interface BenchBarProps {
  bench: string[];
  players: Player[];
  selectedSlotId: string | null;
  isPickingBench: boolean;
  onStartPickingBench: () => void;
  onRemoveFromBench: (playerId: string) => void;
  onReorderBench: (playerId: string, direction: -1 | 1) => void;
  onSubBenchIntoSelectedSlot: (playerId: string) => void;
}

export const BenchBar: React.FC<BenchBarProps> = ({
  bench,
  players,
  selectedSlotId,
  isPickingBench,
  onStartPickingBench,
  onRemoveFromBench,
  onReorderBench,
  onSubBenchIntoSelectedSlot,
}) => {
  const playerMap = new Map(players.map((p) => [p.id, p]));
  const benchPlayers = bench
    .map((id) => playerMap.get(id))
    .filter((p): p is Player => Boolean(p));

  const handleDragStart = (e: React.DragEvent, playerId: string) => {
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({ type: 'bench', playerId })
    );
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="bg-white border border-[#E2E6E1] rounded-2xl p-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <h3 className="text-sm font-bold text-[#111815]">
            Panchina{' '}
            <span className="font-mono tabular-nums font-medium text-[#52605A]">
              ({benchPlayers.length})
            </span>
          </h3>
          <p className="text-xs text-[#52605A]">
            Ordine dei cambi · Trascina un sostituto in campo per farlo entrare
          </p>
        </div>

        <button
          type="button"
          onClick={onStartPickingBench}
          className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            isPickingBench
              ? 'bg-[#111815] text-white'
              : 'bg-[#F2F5F2] text-[#111815] hover:bg-[#E5ECE6]'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          Aggiungi sostituto
        </button>
      </div>

      {benchPlayers.length === 0 ? (
        <div className="py-5 text-center border border-dashed border-[#D6DDD7] rounded-xl text-xs text-[#52605A]">
          Nessun giocatore in panchina. Clicca &ldquo;Aggiungi sostituto&rdquo; per compilare i cambi.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
          {benchPlayers.map((player, index) => {
            const roleInfo = ROLE_META[player.role];
            return (
              <div
                key={player.id}
                draggable
                onDragStart={(e) => handleDragStart(e, player.id)}
                className="flex items-center justify-between gap-2 px-3 py-2 bg-[#F7F8F6] hover:bg-[#EFF2EE] border border-[#E6EAE5] rounded-xl transition-colors cursor-grab active:cursor-grabbing"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono tabular-nums text-[11px] font-semibold text-[#6B7A73] w-4 shrink-0">
                    {index + 1}°
                  </span>
                  <span
                    className={`w-5 h-5 rounded text-[10px] font-bold text-white flex items-center justify-center shrink-0 ${roleInfo.badgeBg}`}
                  >
                    {roleInfo.short}
                  </span>
                  <span className="font-mono tabular-nums text-xs font-semibold text-[#52605A] shrink-0">
                    {player.number}
                  </span>
                  <span className="text-sm font-semibold text-[#111815] truncate">
                    {player.shirtName}
                  </span>
                </div>

                <div className="flex items-center gap-0.5 shrink-0">
                  {selectedSlotId && (
                    <button
                      type="button"
                      onClick={() => onSubBenchIntoSelectedSlot(player.id)}
                      title="Inserisci nello slot selezionato in campo"
                      className="p-1.5 text-[#15803D] hover:bg-[#DCFCE7] rounded-md transition-colors cursor-pointer"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => onReorderBench(player.id, -1)}
                    aria-label="Sposta prima in panchina"
                    className="p-1 text-[#52605A] hover:text-[#111815] disabled:opacity-30 rounded cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={index === benchPlayers.length - 1}
                    onClick={() => onReorderBench(player.id, 1)}
                    aria-label="Sposta dopo in panchina"
                    className="p-1 text-[#52605A] hover:text-[#111815] disabled:opacity-30 rounded cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveFromBench(player.id)}
                    aria-label={`Rimuovi ${player.shirtName} dalla panchina`}
                    className="p-1 text-[#6B7A73] hover:text-rose-700 rounded cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
