import React, { useState } from 'react';
import {
  ArrowLeftRight,
  Award,
  AlertTriangle,
  UserMinus,
  Users,
  X,
} from 'lucide-react';
import { ROLE_META } from '../data/formations';
import {
  FormationDefinition,
  FormationSlot,
  JerseyPattern,
  Player,
  PlayerRole,
  TeamSettings,
} from '../types';
import { JerseySvg } from './JerseySvg';

interface TacticalPitchProps {
  formation: FormationDefinition;
  starters: Record<string, string>;
  players: Player[];
  team: TeamSettings;
  captainId: string | null;
  selectedSlotId: string | null;
  swapSourceSlotId: string | null;
  onSelectSlot: (slotId: string) => void;
  onStartSwap: (slotId: string) => void;
  onCancelSwap: () => void;
  onSwapSlots: (slotA: string, slotB: string) => void;
  onDropPlayerOnSlot: (slotId: string, playerId: string) => void;
  onToggleCaptain: (playerId: string) => void;
  onMoveStarterToBench: (slotId: string) => void;
  onClearSlot: (slotId: string) => void;
  onOpenMobilePicker?: (slotId: string) => void;
}

export const TacticalPitch: React.FC<TacticalPitchProps> = ({
  formation,
  starters,
  players,
  team,
  captainId,
  selectedSlotId,
  swapSourceSlotId,
  onSelectSlot,
  onStartSwap,
  onCancelSwap,
  onSwapSlots,
  onDropPlayerOnSlot,
  onToggleCaptain,
  onMoveStarterToBench,
  onClearSlot,
  onOpenMobilePicker,
}) => {
  const [dragOverSlotId, setDragOverSlotId] = useState<string | null>(null);
  const playerMap = new Map(players.map((p) => [p.id, p]));

  const selectedSlot: FormationSlot | undefined = formation.slots.find(
    (s) => s.slotId === selectedSlotId
  );
  const selectedPlayer = selectedSlotId
    ? playerMap.get(starters[selectedSlotId] ?? '')
    : undefined;

  const handleSlotClick = (slot: FormationSlot) => {
    if (swapSourceSlotId) {
      if (swapSourceSlotId === slot.slotId) {
        onCancelSwap();
      } else {
        onSwapSlots(swapSourceSlotId, slot.slotId);
      }
      return;
    }

    onSelectSlot(slot.slotId);
    // On touch/mobile viewports, tapping an empty slot opens the picker sheet directly
    if (!starters[slot.slotId] && onOpenMobilePicker && window.innerWidth < 1024) {
      onOpenMobilePicker(slot.slotId);
    }
  };

  const handleDragStartFromSlot = (
    e: React.DragEvent,
    slotId: string,
    playerId: string
  ) => {
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({ type: 'slot', slotId, playerId })
    );
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDropOnSlot = (e: React.DragEvent, targetSlotId: string) => {
    e.preventDefault();
    setDragOverSlotId(null);
    const raw = e.dataTransfer.getData('application/json');
    if (!raw) return;
    try {
      const payload = JSON.parse(raw) as {
        type: 'slot' | 'roster' | 'bench';
        slotId?: string;
        playerId: string;
      };
      if (payload.type === 'slot' && payload.slotId) {
        if (payload.slotId !== targetSlotId) {
          onSwapSlots(payload.slotId, targetSlotId);
        }
      } else if (payload.playerId) {
        onDropPlayerOnSlot(targetSlotId, payload.playerId);
      }
    } catch {
      // Ignore malformed drop data
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Swap Mode Notice Banner */}
      {swapSourceSlotId && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-[#111815] text-white rounded-xl text-sm">
          <div className="flex items-center gap-2 min-w-0">
            <ArrowLeftRight className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">
              Seleziona una seconda posizione in campo per scambiare{' '}
              <strong className="font-semibold">
                {playerMap.get(starters[swapSourceSlotId] ?? '')?.shirtName ?? 'questo slot'}
              </strong>
            </span>
          </div>
          <button
            type="button"
            onClick={onCancelSwap}
            className="px-3 py-1 text-xs font-medium bg-white/15 hover:bg-white/25 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Annulla
          </button>
        </div>
      )}

      {/* Main Pitch Canvas — Primary Visual Anchor */}
      <div
        className="relative w-full aspect-[3/4] sm:aspect-[4/4.85] lg:aspect-[10/11.5] max-h-[710px] rounded-2xl overflow-hidden border border-[#194C2C]/30 shadow-sm select-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(180deg, #1E6B3A 0%, #1E6B3A 10%, #237641 10%, #237641 20%)',
        }}
      >
        {/* Subtle Radial Lighting Overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at 50% 45%, rgba(255,255,255,0.07) 0%, rgba(0,0,0,0.18) 100%)',
          }}
        />

        {/* Crisp SVG Pitch Lines */}
        <svg
          viewBox="0 0 1000 1150"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full pointer-events-none"
          aria-hidden="true"
        >
          <g
            fill="none"
            stroke="rgba(255,255,255,0.58)"
            strokeWidth="4"
            vectorEffect="non-scaling-stroke"
          >
            {/* Outer Boundary */}
            <rect x="34" y="34" width="932" height="1082" />
            {/* Halfway Line */}
            <line x1="34" y1="575" x2="966" y2="575" />
            {/* Center Circle */}
            <circle cx="500" cy="575" r="122" />
            {/* Top Penalty & 6-yard Box */}
            <rect x="240" y="34" width="520" height="170" />
            <rect x="378" y="34" width="244" height="62" />
            <path d="M 408 204 A 104 104 0 0 0 592 204" />
            {/* Bottom Penalty & 6-yard Box */}
            <rect x="240" y="946" width="520" height="170" />
            <rect x="378" y="1054" width="244" height="62" />
            <path d="M 408 946 A 104 104 0 0 1 592 946" />
            {/* Corner Arcs */}
            <path d="M 34 62 A 28 28 0 0 0 62 34" />
            <path d="M 938 34 A 28 28 0 0 0 966 62" />
            <path d="M 966 1088 A 28 28 0 0 0 938 1116" />
            <path d="M 62 1116 A 28 28 0 0 0 34 1088" />
          </g>
          {/* Center & Penalty Spots */}
          <circle cx="500" cy="575" r="6" fill="rgba(255,255,255,0.72)" />
          <circle cx="500" cy="148" r="5" fill="rgba(255,255,255,0.65)" />
          <circle cx="500" cy="1002" r="5" fill="rgba(255,255,255,0.65)" />
        </svg>

        {/* Subtle Formation Label in Top-Right Grass Margin */}
        <div className="absolute top-3.5 right-4 pointer-events-none flex items-center gap-1.5 text-white/75 text-xs font-medium">
          <span className="font-athletic text-lg font-bold tracking-wide text-white/90">
            {formation.name}
          </span>
        </div>

        {/* Interactive Player Slots */}
        {formation.slots.map((slot) => {
          const playerId = starters[slot.slotId];
          const player = playerId ? playerMap.get(playerId) : undefined;
          const isGk = slot.role === PlayerRole.POR;
          const isSelected = selectedSlotId === slot.slotId;
          const isSwapSource = swapSourceSlotId === slot.slotId;
          const isDragOver = dragOverSlotId === slot.slotId;
          const isCaptain = Boolean(player && captainId === player.id);
          const isOutOfPosition = Boolean(player && player.role !== slot.role);
          const isUnavailable = Boolean(player && !player.available);

          return (
            <button
              key={slot.slotId}
              type="button"
              draggable={Boolean(player)}
              onDragStart={(e) => {
                if (player) handleDragStartFromSlot(e, slot.slotId, player.id);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                if (dragOverSlotId !== slot.slotId) setDragOverSlotId(slot.slotId);
              }}
              onDragLeave={() => {
                if (dragOverSlotId === slot.slotId) setDragOverSlotId(null);
              }}
              onDrop={(e) => handleDropOnSlot(e, slot.slotId)}
              onClick={() => handleSlotClick(slot)}
              style={{
                left: `${slot.x}%`,
                top: `${slot.y}%`,
              }}
              aria-label={
                player
                  ? `${player.name}, numero ${player.number}, ruolo ${slot.label}`
                  : `Slot vuoto ${slot.label}`
              }
              className={`group absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-xl p-1 transition-transform duration-150 cursor-pointer ${
                isSelected || isSwapSource || isDragOver
                  ? 'scale-105 z-20'
                  : 'hover:scale-105 z-10'
              }`}
            >
              {/* Selection Halo */}
              <div
                className={`relative rounded-xl p-1 transition-colors ${
                  isSwapSource
                    ? 'ring-2 ring-amber-300 bg-amber-400/20'
                    : isDragOver
                    ? 'ring-2 ring-white bg-white/25'
                    : isSelected
                    ? 'ring-2 ring-white bg-white/15'
                    : 'group-hover:bg-white/10'
                }`}
              >
                <JerseySvg
                  primaryColor={isGk ? team.gkColor : team.primaryColor}
                  secondaryColor={isGk ? team.gkSecondaryColor : team.secondaryColor}
                  numberColor={isGk ? team.gkNumberColor : team.numberColor}
                  pattern={isGk ? JerseyPattern.SOLID : team.pattern}
                  number={player?.number}
                  size={52}
                  isEmpty={!player}
                  isCaptain={isCaptain}
                  className="w-11 h-11 sm:w-[54px] sm:h-[54px]"
                />

                {/* Out of position or unavailable small corner cue */}
                {(isUnavailable || isOutOfPosition) && (
                  <span
                    title={
                      isUnavailable
                        ? 'Giocatore segnato come indisponibile'
                        : `Adattato: ruolo naturale ${ROLE_META[player!.role].label}`
                    }
                    className={`absolute -top-1 -left-1 w-5 h-5 rounded-full flex items-center justify-center border border-[#111815] ${
                      isUnavailable
                        ? 'bg-rose-600 text-white'
                        : 'bg-amber-400 text-[#111815]'
                    }`}
                  >
                    <AlertTriangle className="w-3 h-3" />
                  </span>
                )}
              </div>

              {/* Player Nameplate */}
              <div
                className={`mt-0.5 px-2 py-0.5 rounded-md max-w-[96px] sm:max-w-[112px] text-center shadow-sm transition-colors ${
                  player
                    ? isSelected
                      ? 'bg-white text-[#111815]'
                      : 'bg-[#101A15]/92 text-white'
                    : isSelected
                    ? 'bg-white text-[#111815]'
                    : 'bg-[#101A15]/60 text-white/90'
                }`}
              >
                <div className="text-[11px] sm:text-xs font-semibold leading-tight truncate">
                  {player ? player.shirtName : slot.label}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Slot Context Action Bar (Zero Overlap with Pitch) */}
      {selectedSlot && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-white border border-[#E2E6E1] rounded-xl">
          <div className="flex items-center gap-3 min-w-0">
            <span
              className={`w-7 h-7 rounded-md text-white text-xs font-bold flex items-center justify-center shrink-0 ${
                ROLE_META[selectedSlot.role].badgeBg
              }`}
            >
              {selectedSlot.label}
            </span>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-[#111815] truncate">
                {selectedPlayer ? (
                  <>
                    <span className="font-mono tabular-nums text-[#52605A] mr-1.5">
                      #{selectedPlayer.number}
                    </span>
                    {selectedPlayer.name}
                  </>
                ) : (
                  `Posizione libera (${ROLE_META[selectedSlot.role].label})`
                )}
              </div>
              <div className="text-xs text-[#52605A] truncate">
                {selectedPlayer ? (
                  <>
                    {ROLE_META[selectedPlayer.role].label}
                    {selectedPlayer.role !== selectedSlot.role && ' · Adattato fuori ruolo'}
                    {!selectedPlayer.available && ' · Segnato indisponibile'}
                    {captainId === selectedPlayer.id && ' · Capitano'}
                  </>
                ) : (
                  'Scegli un giocatore dalla rosa oppure trascinalo su questo ruolo'
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {onOpenMobilePicker && (
              <button
                type="button"
                onClick={() => onOpenMobilePicker(selectedSlot.slotId)}
                className="lg:hidden px-3 py-2 text-xs font-semibold bg-[#15803D] text-white rounded-lg hover:bg-[#166534] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {selectedPlayer ? 'Sostituisci' : 'Scegli giocatore'}
              </button>
            )}

            {selectedPlayer && (
              <>
                <button
                  type="button"
                  onClick={() => onStartSwap(selectedSlot.slotId)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#111815] bg-[#F2F5F2] hover:bg-[#E5ECE6] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  Scambia
                </button>
                <button
                  type="button"
                  onClick={() => onToggleCaptain(selectedPlayer.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    captainId === selectedPlayer.id
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'text-[#111815] bg-[#F2F5F2] hover:bg-[#E5ECE6]'
                  }`}
                >
                  <Award className="w-3.5 h-3.5" />
                  {captainId === selectedPlayer.id ? 'Capitano' : 'Fai Capitano'}
                </button>
                <button
                  type="button"
                  onClick={() => onMoveStarterToBench(selectedSlot.slotId)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#111815] bg-[#F2F5F2] hover:bg-[#E5ECE6] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5" />
                  In panchina
                </button>
                <button
                  type="button"
                  onClick={() => onClearSlot(selectedSlot.slotId)}
                  title="Togli dal campo"
                  className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <UserMinus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Togli</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => onSelectSlot('')}
              aria-label="Chiudi selezione"
              className="p-2 text-[#52605A] hover:text-[#111815] hover:bg-[#F2F5F2] rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
