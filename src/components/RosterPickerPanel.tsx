import React, { useMemo, useState } from 'react';
import { Check, GripVertical, Plus, Search, UserX } from 'lucide-react';
import { ROLE_META } from '../data/formations';
import { FormationSlot, Player, PlayerRole } from '../types';

interface RosterPickerPanelProps {
  players: Player[];
  starters: Record<string, string>;
  bench: string[];
  activeSlot: FormationSlot | null;
  targetMode: 'slot' | 'bench';
  onAssignPlayerToActiveSlot: (playerId: string) => void;
  onAddPlayerToBench: (playerId: string) => void;
  onQuickAddPlayerClick: () => void;
}

const ROLE_FILTERS: { id: 'ALL' | PlayerRole; label: string }[] = [
  { id: 'ALL', label: 'Tutti' },
  { id: PlayerRole.POR, label: 'POR' },
  { id: PlayerRole.DIF, label: 'DIF' },
  { id: PlayerRole.CEN, label: 'CEN' },
  { id: PlayerRole.ATT, label: 'ATT' },
];

export const RosterPickerPanel: React.FC<RosterPickerPanelProps> = ({
  players,
  starters,
  bench,
  activeSlot,
  targetMode,
  onAssignPlayerToActiveSlot,
  onAddPlayerToBench,
  onQuickAddPlayerClick,
}) => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | PlayerRole>('ALL');

  const starterSlotByPlayer = useMemo(() => {
    const map = new Map<string, string>();
    Object.entries(starters).forEach(([slotId, playerId]) => {
      if (playerId) map.set(playerId, slotId);
    });
    return map;
  }, [starters]);

  const benchSet = useMemo(() => new Set(bench), [bench]);

  const filteredPlayers = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = players.filter((p) => {
      if (roleFilter !== 'ALL' && p.role !== roleFilter) return false;
      if (q) {
        return (
          p.name.toLowerCase().includes(q) ||
          p.shirtName.toLowerCase().includes(q) ||
          String(p.number).includes(q)
        );
      }
      return true;
    });

    // Sort: available first -> natural match to selected slot -> not yet fielded -> shirt number
    return [...list].sort((a, b) => {
      if (a.available !== b.available) return a.available ? -1 : 1;

      if (targetMode === 'slot' && activeSlot) {
        const aMatch = a.role === activeSlot.role ? 0 : 1;
        const bMatch = b.role === activeSlot.role ? 0 : 1;
        if (aMatch !== bMatch) return aMatch - bMatch;
      }

      const aUsed = starterSlotByPlayer.has(a.id) ? 2 : benchSet.has(a.id) ? 1 : 0;
      const bUsed = starterSlotByPlayer.has(b.id) ? 2 : benchSet.has(b.id) ? 1 : 0;
      if (aUsed !== bUsed) return aUsed - bUsed;

      return a.number - b.number;
    });
  }, [players, search, roleFilter, activeSlot, targetMode, starterSlotByPlayer, benchSet]);

  const handlePlayerClick = (player: Player) => {
    if (targetMode === 'bench') {
      onAddPlayerToBench(player.id);
    } else {
      onAssignPlayerToActiveSlot(player.id);
    }
  };

  const handleDragStart = (e: React.DragEvent, player: Player) => {
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({ type: 'roster', playerId: player.id })
    );
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="flex flex-col h-full bg-white border border-[#E2E6E1] rounded-2xl overflow-hidden">
      {/* Contextual Header */}
      <div className="px-4 pt-4 pb-3 border-b border-[#ECEFEA]">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="font-athletic text-2xl font-bold tracking-tight text-[#111815] leading-none">
              {targetMode === 'bench'
                ? 'Seleziona per Panchina'
                : activeSlot
                ? `Schiera ${activeSlot.label} · ${ROLE_META[activeSlot.role].label}`
                : 'Rosa Squadra'}
            </h2>
            <p className="text-xs text-[#52605A] mt-1">
              {targetMode === 'bench'
                ? 'Tocca un giocatore per aggiungerlo ai sostituti'
                : activeSlot
                ? 'Clicca un giocatore per inserirlo nello slot selezionato'
                : 'Clicca un ruolo in campo o trascina un giocatore sul terreno'}
            </p>
          </div>
          <button
            type="button"
            onClick={onQuickAddPlayerClick}
            title="Aggiungi nuovo calciatore alla rosa"
            className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-semibold text-[#15803D] hover:bg-[#EDF7F0] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Nuovo
          </button>
        </div>

        {/* Search Input */}
        <div className="relative mt-3">
          <Search className="w-4 h-4 text-[#6B7A73] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cerca nome o numero..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-[#F5F6F4] border border-transparent focus:border-[#15803D] focus:bg-white rounded-lg text-[#111815] placeholder:text-[#75847D] outline-none transition-colors"
          />
        </div>

        {/* Interactive Role Segmented Filter */}
        <div className="grid grid-cols-5 gap-1 p-1 mt-2.5 bg-[#F2F4F1] rounded-lg">
          {ROLE_FILTERS.map((f) => {
            const active = roleFilter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setRoleFilter(f.id)}
                className={`py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-white text-[#111815] shadow-xs'
                    : 'text-[#52605A] hover:text-[#111815]'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Scrollable Roster List */}
      <div className="flex-1 overflow-y-auto roster-scroll divide-y divide-[#F0F2EF] max-h-[540px] lg:max-h-[610px]">
        {filteredPlayers.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-sm font-medium text-[#111815]">Nessun calciatore trovato</p>
            <p className="text-xs text-[#52605A] mt-1">
              Prova a cambiare filtro o aggiungi un nuovo giocatore in rosa.
            </p>
          </div>
        ) : (
          filteredPlayers.map((player) => {
            const assignedSlotId = starterSlotByPlayer.get(player.id);
            const isStarter = Boolean(assignedSlotId);
            const isOnBench = benchSet.has(player.id);
            const isRoleMatch =
              targetMode === 'slot' && activeSlot && player.role === activeSlot.role;
            const roleInfo = ROLE_META[player.role];

            return (
              <div
                key={player.id}
                draggable
                onDragStart={(e) => handleDragStart(e, player)}
                onClick={() => handlePlayerClick(player)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handlePlayerClick(player);
                  }
                }}
                className={`group flex items-center justify-between gap-2.5 px-3.5 py-2.5 min-h-[52px] transition-colors cursor-pointer select-none ${
                  !player.available
                    ? 'opacity-55 bg-[#FAFAFA] hover:bg-[#F3F5F3]'
                    : isStarter
                    ? 'bg-[#F3F8F4] hover:bg-[#E7F2EA]'
                    : 'hover:bg-[#F5F7F5]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <GripVertical className="w-3.5 h-3.5 text-[#A5B1AA] hidden lg:block shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />

                  {/* Role square + shirt number */}
                  <span
                    className={`w-6 h-6 rounded text-[11px] font-bold text-white flex items-center justify-center shrink-0 ${roleInfo.badgeBg}`}
                  >
                    {roleInfo.short}
                  </span>

                  <span className="font-mono tabular-nums text-xs font-semibold text-[#52605A] w-6 text-right shrink-0">
                    {player.number}
                  </span>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-[#111815] truncate">
                        {player.name}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#52605A] truncate">
                      {!player.available ? (
                        <span className="text-rose-700 font-medium">Indisponibile</span>
                      ) : isRoleMatch && !isStarter ? (
                        <span className="text-[#15803D] font-medium">Ruolo ideale</span>
                      ) : (
                        <span>Piede {player.foot}</span>
                      )}
                      {player.note ? ` · ${player.note}` : ''}
                    </div>
                  </div>
                </div>

                {/* Clean unboxed state indicator (Zero Pill) */}
                <div className="shrink-0 text-right">
                  {isStarter ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#15803D]">
                      <Check className="w-3.5 h-3.5" />
                      Titolare
                    </span>
                  ) : isOnBench ? (
                    <span className="text-xs font-medium text-[#52605A]">Panchina</span>
                  ) : !player.available ? (
                    <UserX className="w-4 h-4 text-rose-600" />
                  ) : (
                    <span className="text-xs font-medium text-[#15803D] opacity-0 group-hover:opacity-100 transition-opacity">
                      Schiera
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
