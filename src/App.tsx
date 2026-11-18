import React, { useEffect, useMemo, useState } from 'react';
import {
  Bookmark,
  ChevronDown,
  ClipboardList,
  Eraser,
  LayoutGrid,
  Share2,
  Shield,
  Sparkles,
  Star,
  Users,
  X,
} from 'lucide-react';
import { BenchBar } from './components/BenchBar';
import { ClubCrestSvg } from './components/JerseySvg';
import { RosterPickerPanel } from './components/RosterPickerPanel';
import { SavedLineupsView } from './components/SavedLineupsView';
import { SaveLineupModal } from './components/SaveLineupModal';
import { SquadManagerView } from './components/SquadManagerView';
import { TacticalPitch } from './components/TacticalPitch';
import { TeamSettingsView } from './components/TeamSettingsView';
import { WhatsAppShareModal } from './components/WhatsAppShareModal';
import {
  DEFAULT_ACTIVE_LINEUP,
  DEFAULT_PLAYERS,
  DEFAULT_SAVED_LINEUPS,
  DEFAULT_TEAM_SETTINGS,
} from './data/defaultData';
import {
  autoFillFormation,
  getFormationById,
  getFormationsByFormat,
  remapStartersToFormation,
} from './data/formations';
import {
  ActiveLineup,
  AppTab,
  Player,
  SavedLineup,
  TeamFormat,
  TeamSettings,
} from './types';
import { loadAppState, saveAppState } from './utils/storage';

const NAV_ITEMS: { id: AppTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'campo', label: 'Campo', icon: LayoutGrid },
  { id: 'rosa', label: 'Rosa', icon: Users },
  { id: 'preferite', label: 'Preferite', icon: Star },
  { id: 'squadra', label: 'Squadra', icon: Shield },
];

export default function App() {
  const initialState = useMemo(() => loadAppState(), []);

  const [activeTab, setActiveTab] = useState<AppTab>('campo');
  const [players, setPlayers] = useState<Player[]>(initialState.players);
  const [teamSettings, setTeamSettings] = useState<TeamSettings>(initialState.teamSettings);
  const [activeLineup, setActiveLineup] = useState<ActiveLineup>(initialState.activeLineup);
  const [savedLineups, setSavedLineups] = useState<SavedLineup[]>(initialState.savedLineups);
  const [activeSavedId, setActiveSavedId] = useState<string | null>(
    initialState.savedLineups[0]?.id ?? null
  );

  // Interactive pitch state
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [pickerMode, setPickerMode] = useState<'slot' | 'bench'>('slot');
  const [swapSourceSlotId, setSwapSourceSlotId] = useState<string | null>(null);
  const [mobilePickerOpen, setMobilePickerOpen] = useState(false);
  const [showMatchDetails, setShowMatchDetails] = useState(true);

  // Modals & notifications
  const [shareLineupTarget, setShareLineupTarget] = useState<ActiveLineup | null>(null);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Persist to localStorage whenever core data changes
  useEffect(() => {
    saveAppState({
      players,
      teamSettings,
      activeLineup,
      savedLineups,
    });
  }, [players, teamSettings, activeLineup, savedLineups]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3200);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const currentFormation = useMemo(
    () => getFormationById(activeLineup.formationId),
    [activeLineup.formationId]
  );

  const availableFormations = useMemo(
    () => getFormationsByFormat(activeLineup.format),
    [activeLineup.format]
  );

  const activeSlotObj = useMemo(
    () => currentFormation.slots.find((s) => s.slotId === selectedSlotId) ?? null,
    [currentFormation, selectedSlotId]
  );

  const favoriteLineups = useMemo(
    () => savedLineups.filter((s) => s.favorite),
    [savedLineups]
  );

  const filledStartersCount = useMemo(() => {
    const validIds = new Set(players.map((p) => p.id));
    return currentFormation.slots.filter((slot) => {
      const pid = activeLineup.starters[slot.slotId];
      return Boolean(pid && validIds.has(pid));
    }).length;
  }, [activeLineup.starters, currentFormation.slots, players]);

  // ===================== FORMATION & PITCH HANDLERS =====================

  const handleSelectFormat = (nextFormat: TeamFormat) => {
    if (nextFormat === activeLineup.format) return;
    const candidates = getFormationsByFormat(nextFormat);
    const nextFormation = candidates[0];
    const remapped = remapStartersToFormation(
      activeLineup.starters,
      activeLineup.bench,
      nextFormation,
      players
    );
    setActiveLineup((prev) => ({
      ...prev,
      format: nextFormat,
      formationId: nextFormation.id,
      starters: remapped.starters,
      bench: remapped.bench,
    }));
    setSelectedSlotId(null);
    setSwapSourceSlotId(null);
    setActiveSavedId(null);
  };

  const handleSelectFormation = (formationId: string) => {
    if (formationId === activeLineup.formationId) return;
    const nextFormation = getFormationById(formationId);
    const remapped = remapStartersToFormation(
      activeLineup.starters,
      activeLineup.bench,
      nextFormation,
      players
    );
    setActiveLineup((prev) => ({
      ...prev,
      formationId: nextFormation.id,
      starters: remapped.starters,
      bench: remapped.bench,
    }));
    setSelectedSlotId(null);
    setSwapSourceSlotId(null);
  };

  const assignPlayerToSlot = (slotId: string, playerId: string, autoAdvance = false) => {
    let nextEmptySlotId: string | null = null;

    setActiveLineup((prev) => {
      const nextStarters = { ...prev.starters };
      let nextBench = [...prev.bench];

      const prevPlayerInTarget = nextStarters[slotId];

      // Check if incoming player already occupies another pitch slot
      const existingSlotOfPlayer = Object.entries(nextStarters).find(
        ([, pid]) => pid === playerId
      )?.[0];

      if (existingSlotOfPlayer && existingSlotOfPlayer !== slotId) {
        // Swap their pitch slots cleanly
        if (prevPlayerInTarget) {
          nextStarters[existingSlotOfPlayer] = prevPlayerInTarget;
        } else {
          delete nextStarters[existingSlotOfPlayer];
        }
      } else {
        // Remove incoming player from bench if they were on the bench
        nextBench = nextBench.filter((id) => id !== playerId);
        // If replacing a starter who wasn't moved elsewhere, keep bench clean
        if (
          prevPlayerInTarget &&
          prevPlayerInTarget !== playerId &&
          !Object.values(nextStarters).includes(prevPlayerInTarget)
        ) {
          // Optionally leave replaced player unassigned in roster
        }
      }

      nextStarters[slotId] = playerId;

      if (autoAdvance) {
        const currentIndex = currentFormation.slots.findIndex((s) => s.slotId === slotId);
        const ordered = [
          ...currentFormation.slots.slice(currentIndex + 1),
          ...currentFormation.slots.slice(0, currentIndex),
        ];
        nextEmptySlotId = ordered.find((s) => !nextStarters[s.slotId])?.slotId ?? null;
      }

      return {
        ...prev,
        starters: nextStarters,
        bench: nextBench,
      };
    });

    if (autoAdvance) {
      setSelectedSlotId(nextEmptySlotId);
      if (!nextEmptySlotId) {
        setMobilePickerOpen(false);
      }
    }
  };

  const handleAssignFromPicker = (playerId: string) => {
    if (selectedSlotId) {
      assignPlayerToSlot(selectedSlotId, playerId, true);
      return;
    }
    // If no slot was explicitly selected, find the first empty slot matching player's role (or first empty overall)
    const player = players.find((p) => p.id === playerId);
    const emptyRoleSlot = currentFormation.slots.find(
      (s) => !activeLineup.starters[s.slotId] && player && s.role === player.role
    );
    const firstEmpty = currentFormation.slots.find((s) => !activeLineup.starters[s.slotId]);
    const targetSlot = emptyRoleSlot ?? firstEmpty;
    if (targetSlot) {
      assignPlayerToSlot(targetSlot.slotId, playerId, false);
    } else {
      showToast('Tutti i titolari sono già occupati: clicca una maglia in campo per sostituirla');
    }
  };

  const handleSwapSlots = (slotA: string, slotB: string) => {
    setActiveLineup((prev) => {
      const nextStarters = { ...prev.starters };
      const pA = nextStarters[slotA];
      const pB = nextStarters[slotB];
      if (pB) nextStarters[slotA] = pB;
      else delete nextStarters[slotA];
      if (pA) nextStarters[slotB] = pA;
      else delete nextStarters[slotB];
      return { ...prev, starters: nextStarters };
    });
    setSwapSourceSlotId(null);
    setSelectedSlotId(slotB);
  };

  const handleToggleCaptain = (playerId: string) => {
    setActiveLineup((prev) => ({
      ...prev,
      captainId: prev.captainId === playerId ? null : playerId,
    }));
  };

  const handleClearSlot = (slotId: string) => {
    setActiveLineup((prev) => {
      const nextStarters = { ...prev.starters };
      const removedId = nextStarters[slotId];
      delete nextStarters[slotId];
      return {
        ...prev,
        starters: nextStarters,
        captainId: prev.captainId === removedId ? null : prev.captainId,
      };
    });
  };

  const handleMoveStarterToBench = (slotId: string) => {
    setActiveLineup((prev) => {
      const pid = prev.starters[slotId];
      if (!pid) return prev;
      const nextStarters = { ...prev.starters };
      delete nextStarters[slotId];
      const nextBench = prev.bench.includes(pid) ? prev.bench : [...prev.bench, pid];
      return {
        ...prev,
        starters: nextStarters,
        bench: nextBench,
        captainId: prev.captainId === pid ? null : prev.captainId,
      };
    });
  };

  const handleAddPlayerToBench = (playerId: string) => {
    setActiveLineup((prev) => {
      if (prev.bench.includes(playerId)) return prev;
      const nextStarters = { ...prev.starters };
      for (const [sid, pid] of Object.entries(nextStarters)) {
        if (pid === playerId) delete nextStarters[sid];
      }
      return {
        ...prev,
        starters: nextStarters,
        bench: [...prev.bench, playerId],
        captainId: prev.captainId === playerId ? null : prev.captainId,
      };
    });
  };

  const handleRemoveFromBench = (playerId: string) => {
    setActiveLineup((prev) => ({
      ...prev,
      bench: prev.bench.filter((id) => id !== playerId),
    }));
  };

  const handleReorderBench = (playerId: string, direction: -1 | 1) => {
    setActiveLineup((prev) => {
      const idx = prev.bench.indexOf(playerId);
      if (idx < 0) return prev;
      const targetIdx = idx + direction;
      if (targetIdx < 0 || targetIdx >= prev.bench.length) return prev;
      const nextBench = [...prev.bench];
      [nextBench[idx], nextBench[targetIdx]] = [nextBench[targetIdx], nextBench[idx]];
      return { ...prev, bench: nextBench };
    });
  };

  const handleSubBenchIntoSelectedSlot = (benchPlayerId: string) => {
    if (!selectedSlotId) return;
    setActiveLineup((prev) => {
      const prevStarterId = prev.starters[selectedSlotId];
      const nextStarters = { ...prev.starters, [selectedSlotId]: benchPlayerId };
      let nextBench = prev.bench.filter((id) => id !== benchPlayerId);
      if (prevStarterId) {
        const oldIdx = prev.bench.indexOf(benchPlayerId);
        nextBench.splice(Math.max(0, oldIdx), 0, prevStarterId);
      }
      return {
        ...prev,
        starters: nextStarters,
        bench: nextBench,
        captainId: prev.captainId === prevStarterId ? null : prev.captainId,
      };
    });
  };

  const handleAutoFill = () => {
    const filled = autoFillFormation(currentFormation, players);
    setActiveLineup((prev) => ({
      ...prev,
      starters: filled.starters,
      bench: filled.bench,
      captainId: filled.captainId,
    }));
    setSelectedSlotId(null);
    setSwapSourceSlotId(null);
    showToast(`Formazione ${currentFormation.name} compilata con i giocatori disponibili`);
  };

  const handleClearPitch = () => {
    setActiveLineup((prev) => ({
      ...prev,
      starters: {},
      bench: [],
      captainId: null,
    }));
    setSelectedSlotId(currentFormation.slots[0]?.slotId ?? null);
    setSwapSourceSlotId(null);
    showToast('Campo svuotato: scegli i titolari dalla rosa');
  };

  // ===================== SAVED LINEUPS HANDLERS =====================

  const handleSaveLineup = ({
    title,
    favorite,
    notes,
    overwriteId,
  }: {
    title: string;
    favorite: boolean;
    notes: string;
    overwriteId: string | null;
  }) => {
    const now = new Date().toISOString();
    const updatedMatchInfo = { ...activeLineup.matchInfo, notes };

    setActiveLineup((prev) => ({ ...prev, matchInfo: updatedMatchInfo }));

    if (overwriteId) {
      setSavedLineups((prev) =>
        prev.map((item) =>
          item.id === overwriteId
            ? {
                ...item,
                title,
                favorite,
                updatedAt: now,
                format: activeLineup.format,
                formationId: activeLineup.formationId,
                starters: { ...activeLineup.starters },
                bench: [...activeLineup.bench],
                captainId: activeLineup.captainId,
                matchInfo: updatedMatchInfo,
              }
            : item
        )
      );
      setActiveSavedId(overwriteId);
      showToast(`Formazione "${title}" aggiornata`);
    } else {
      const newId = `saved-${Date.now()}`;
      const newEntry: SavedLineup = {
        id: newId,
        title,
        favorite,
        createdAt: now,
        updatedAt: now,
        format: activeLineup.format,
        formationId: activeLineup.formationId,
        starters: { ...activeLineup.starters },
        bench: [...activeLineup.bench],
        captainId: activeLineup.captainId,
        matchInfo: updatedMatchInfo,
      };
      setSavedLineups((prev) => [newEntry, ...prev]);
      setActiveSavedId(newId);
      showToast(`Formazione "${title}" salvata${favorite ? ' nei preferiti' : ''}`);
    }
  };

  const handleLoadSavedLineup = (item: SavedLineup) => {
    setActiveLineup({
      format: item.format,
      formationId: item.formationId,
      starters: { ...item.starters },
      bench: [...item.bench],
      captainId: item.captainId,
      matchInfo: { ...item.matchInfo },
    });
    setActiveSavedId(item.id);
    setSelectedSlotId(null);
    setSwapSourceSlotId(null);
    setActiveTab('campo');
    showToast(`Caricata: ${item.title}`);
  };

  const handleToggleSavedFavorite = (id: string) => {
    setSavedLineups((prev) =>
      prev.map((item) => (item.id === id ? { ...item, favorite: !item.favorite } : item))
    );
  };

  const handleDuplicateSaved = (item: SavedLineup) => {
    const now = new Date().toISOString();
    const copy: SavedLineup = {
      ...item,
      id: `saved-${Date.now()}`,
      title: `${item.title} (Copia)`,
      createdAt: now,
      updatedAt: now,
      starters: { ...item.starters },
      bench: [...item.bench],
      matchInfo: { ...item.matchInfo },
    };
    setSavedLineups((prev) => [copy, ...prev]);
    showToast(`Duplicata "${item.title}"`);
  };

  const handleDeleteSaved = (id: string) => {
    setSavedLineups((prev) => prev.filter((item) => item.id !== id));
    if (activeSavedId === id) setActiveSavedId(null);
    showToast('Formazione salvata eliminata');
  };

  // ===================== SQUAD ROSTER CRUD =====================

  const handleAddPlayer = (payload: Omit<Player, 'id'>) => {
    const created: Player = { ...payload, id: `p-${Date.now()}` };
    setPlayers((prev) => [...prev, created]);
    showToast(`${created.name} aggiunto alla rosa`);
  };

  const handleBulkAddPlayers = (imported: Player[]) => {
    setPlayers((prev) => [...prev, ...imported]);
    showToast(`Importati ${imported.length} calciatori in rosa`);
  };

  const handleUpdatePlayer = (updated: Player) => {
    setPlayers((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    showToast(`Scheda di ${updated.name} aggiornata`);
  };

  const handleDeletePlayer = (playerId: string) => {
    setPlayers((prev) => prev.filter((p) => p.id !== playerId));
    setActiveLineup((prev) => {
      const nextStarters = { ...prev.starters };
      for (const [sid, pid] of Object.entries(nextStarters)) {
        if (pid === playerId) delete nextStarters[sid];
      }
      return {
        ...prev,
        starters: nextStarters,
        bench: prev.bench.filter((id) => id !== playerId),
        captainId: prev.captainId === playerId ? null : prev.captainId,
      };
    });
    setSavedLineups((prev) =>
      prev.map((saved) => {
        const nextStarters = { ...saved.starters };
        for (const [sid, pid] of Object.entries(nextStarters)) {
          if (pid === playerId) delete nextStarters[sid];
        }
        return {
          ...saved,
          starters: nextStarters,
          bench: saved.bench.filter((id) => id !== playerId),
          captainId: saved.captainId === playerId ? null : saved.captainId,
        };
      })
    );
    showToast('Calciatore rimosso dalla rosa');
  };

  const handleToggleAvailability = (playerId: string) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === playerId ? { ...p, available: !p.available } : p))
    );
  };

  // ===================== BACKUP & RESET =====================

  const handleExportBackup = () => {
    const payload = JSON.stringify(
      { players, teamSettings, activeLineup, savedLineups },
      null,
      2
    );
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `undici-backup-${teamSettings.shortName.toLowerCase() || 'squadra'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Backup JSON esportato');
  };

  const handleImportBackup = (raw: string) => {
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed.players) || !parsed.teamSettings) {
        showToast('File di backup non valido');
        return;
      }
      setPlayers(parsed.players);
      setTeamSettings({ ...DEFAULT_TEAM_SETTINGS, ...parsed.teamSettings });
      if (parsed.activeLineup) setActiveLineup(parsed.activeLineup);
      if (Array.isArray(parsed.savedLineups)) setSavedLineups(parsed.savedLineups);
      showToast('Backup importato correttamente');
    } catch {
      showToast('Errore durante la lettura del file JSON');
    }
  };

  const handleResetDemoData = () => {
    setPlayers(DEFAULT_PLAYERS);
    setTeamSettings(DEFAULT_TEAM_SETTINGS);
    setActiveLineup(DEFAULT_ACTIVE_LINEUP);
    setSavedLineups(DEFAULT_SAVED_LINEUPS);
    setActiveSavedId(DEFAULT_SAVED_LINEUPS[0].id);
    showToast('Rosa e formazioni demo ripristinate');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F6F4] text-[#111815]">
      {/* Strict 3-Zone Top Navigation Bar */}
      <header className="sticky top-0 z-30 h-[56px] sm:h-[62px] bg-white/95 backdrop-blur-sm border-b border-[#E2E6E1]">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-8">
          {/* Zone 1: Single Wordmark */}
          <button
            type="button"
            onClick={() => setActiveTab('campo')}
            className="font-athletic text-2xl sm:text-[28px] font-extrabold tracking-tight text-[#111815] whitespace-nowrap shrink-0 cursor-pointer"
          >
            Undici
          </button>

          {/* Zone 2: 4 Clean Single-Line Nav Links */}
          <nav
            aria-label="Navigazione principale"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-[#52605A]"
          >
            {NAV_ITEMS.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`relative py-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active ? 'text-[#111815] font-semibold' : 'hover:text-[#111815]'
                  }`}
                >
                  {item.label}
                  {active && (
                    <span className="absolute left-0 right-0 -bottom-[19px] h-[2px] bg-[#15803D]" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 Primary Action */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={() => setShareLineupTarget(activeLineup)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#15803D] hover:bg-[#166534] rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>Condividi WhatsApp</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-6 pb-24 md:pb-10">
        {activeTab === 'campo' && (
          <div className="space-y-5">
            {/* Workspace Contextual Bar (Club summary + Quick-Load Favorites + Save/Auto-fill) */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#E2E6E1]">
              <div className="flex items-center gap-3.5 min-w-0">
                <ClubCrestSvg team={teamSettings} size={44} />
                <div className="min-w-0">
                  <h1 className="font-athletic text-2xl sm:text-3xl font-bold text-[#111815] leading-none truncate">
                    {teamSettings.name}
                  </h1>
                  <div className="mt-1 text-xs text-[#52605A] flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                    <span className="font-semibold text-[#111815]">{currentFormation.name}</span>
                    <span aria-hidden="true">·</span>
                    <span>Calcio a {activeLineup.format}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      {filledStartersCount}/{currentFormation.slots.length} titolari
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      {activeLineup.bench.length} panchina
                    </span>
                  </div>
                </div>
              </div>

              {/* Workspace Actions */}
              <div className="flex flex-wrap items-center gap-2">
                {savedLineups.length > 0 && (
                  <div className="relative">
                    <select
                      aria-label="Carica formazione salvata"
                      value={activeSavedId ?? ''}
                      onChange={(e) => {
                        const found = savedLineups.find((s) => s.id === e.target.value);
                        if (found) handleLoadSavedLineup(found);
                      }}
                      className="appearance-none pl-3.5 pr-8 py-2 text-xs font-semibold bg-white border border-[#DCE1DC] hover:border-[#B6C2B9] rounded-xl text-[#111815] outline-none cursor-pointer max-w-[220px] truncate"
                    >
                      <option value="" disabled>
                        {favoriteLineups.length > 0
                          ? `Carica preferita (${favoriteLineups.length})`
                          : 'Carica salvata...'}
                      </option>
                      {savedLineups.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.favorite ? '★ ' : ''}
                          {s.title}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-[#52605A] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setSaveModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-white hover:bg-[#EDF7F0] text-[#111815] border border-[#DCE1DC] rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Bookmark className="w-3.5 h-3.5 text-[#15803D]" />
                  Salva preferita
                </button>

                <button
                  type="button"
                  onClick={handleAutoFill}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white hover:bg-[#F2F5F2] text-[#111815] border border-[#DCE1DC] rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#52605A]" />
                  Auto-compila
                </button>

                <button
                  type="button"
                  onClick={handleClearPitch}
                  title="Svuota titolari e panchina"
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#52605A] hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Eraser className="w-3.5 h-3.5" />
                  Svuota
                </button>
              </div>
            </div>

            {/* Format & Module Selector Strip */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white border border-[#E2E6E1] rounded-2xl p-3">
              {/* Format Switch (11 / 7 / 5) */}
              <div className="flex items-center gap-1 p-1 bg-[#F2F4F1] rounded-xl shrink-0 self-start">
                {(
                  [
                    { id: TeamFormat.ELEVEN, label: 'Calcio a 11' },
                    { id: TeamFormat.SEVEN, label: 'A 7' },
                    { id: TeamFormat.FIVE, label: 'A 5' },
                  ] as const
                ).map((fmt) => (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => handleSelectFormat(fmt.id)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                      activeLineup.format === fmt.id
                        ? 'bg-[#111815] text-white'
                        : 'text-[#52605A] hover:text-[#111815]'
                    }`}
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>

              {/* Tactical Modules */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 md:pb-0">
                {availableFormations.map((f) => {
                  const active = f.id === activeLineup.formationId;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => handleSelectFormation(f.id)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-athletic font-bold tracking-wide transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        active
                          ? 'bg-[#15803D] text-white'
                          : 'bg-[#F5F6F4] text-[#323E38] hover:bg-[#E7ECE7]'
                      }`}
                    >
                      {f.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Main 2-Column Tactical Workspace */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left: Pitch + Bench */}
              <div className="lg:col-span-7 space-y-4">
                <TacticalPitch
                  formation={currentFormation}
                  starters={activeLineup.starters}
                  players={players}
                  team={teamSettings}
                  captainId={activeLineup.captainId}
                  selectedSlotId={selectedSlotId}
                  swapSourceSlotId={swapSourceSlotId}
                  onSelectSlot={(slotId) => {
                    setPickerMode('slot');
                    setSelectedSlotId(slotId || null);
                  }}
                  onStartSwap={(slotId) => setSwapSourceSlotId(slotId)}
                  onCancelSwap={() => setSwapSourceSlotId(null)}
                  onSwapSlots={handleSwapSlots}
                  onDropPlayerOnSlot={(slotId, playerId) =>
                    assignPlayerToSlot(slotId, playerId, false)
                  }
                  onToggleCaptain={handleToggleCaptain}
                  onMoveStarterToBench={handleMoveStarterToBench}
                  onClearSlot={handleClearSlot}
                  onOpenMobilePicker={(slotId) => {
                    setSelectedSlotId(slotId);
                    setPickerMode('slot');
                    setMobilePickerOpen(true);
                  }}
                />

                <BenchBar
                  bench={activeLineup.bench}
                  players={players}
                  selectedSlotId={selectedSlotId}
                  isPickingBench={pickerMode === 'bench'}
                  onStartPickingBench={() => {
                    setPickerMode('bench');
                    setSelectedSlotId(null);
                    if (window.innerWidth < 1024) {
                      setMobilePickerOpen(true);
                    }
                  }}
                  onRemoveFromBench={handleRemoveFromBench}
                  onReorderBench={handleReorderBench}
                  onSubBenchIntoSelectedSlot={handleSubBenchIntoSelectedSlot}
                />
              </div>

              {/* Right: Desktop Fantacalcio Roster Picker + Match Details */}
              <div className="lg:col-span-5 space-y-4">
                <div className="hidden lg:block">
                  <RosterPickerPanel
                    players={players}
                    starters={activeLineup.starters}
                    bench={activeLineup.bench}
                    activeSlot={activeSlotObj}
                    targetMode={pickerMode}
                    onAssignPlayerToActiveSlot={handleAssignFromPicker}
                    onAddPlayerToBench={handleAddPlayerToBench}
                    onQuickAddPlayerClick={() => setActiveTab('rosa')}
                  />
                </div>

                {/* Match Info Card (Feeds HD Screenshot Header & WhatsApp Message) */}
                <div className="bg-white border border-[#E2E6E1] rounded-2xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowMatchDetails((v) => !v)}
                    className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-[#FAFBF9] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-[#15803D]" />
                      <span className="text-sm font-bold text-[#111815]">
                        Dettagli Partita per Screenshot
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-[#52605A] transition-transform ${
                        showMatchDetails ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {showMatchDetails && (
                    <div className="px-4 pb-4 pt-1 border-t border-[#F0F2EF] space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-[#52605A] mb-1">
                          Squadra avversaria
                        </label>
                        <input
                          type="text"
                          value={activeLineup.matchInfo.opponent}
                          onChange={(e) =>
                            setActiveLineup((prev) => ({
                              ...prev,
                              matchInfo: { ...prev.matchInfo, opponent: e.target.value },
                            }))
                          }
                          placeholder="Es. Real Birretta FC"
                          className="w-full px-3 py-2 text-sm bg-[#F5F6F4] border border-transparent focus:border-[#15803D] focus:bg-white rounded-lg outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-[#52605A] mb-1">
                            Giorno / Data
                          </label>
                          <input
                            type="text"
                            value={activeLineup.matchInfo.dateLabel}
                            onChange={(e) =>
                              setActiveLineup((prev) => ({
                                ...prev,
                                matchInfo: { ...prev.matchInfo, dateLabel: e.target.value },
                              }))
                            }
                            placeholder="Dom 22 Nov"
                            className="w-full px-3 py-2 text-sm bg-[#F5F6F4] border border-transparent focus:border-[#15803D] focus:bg-white rounded-lg outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-[#52605A] mb-1">
                            Calcio d&rsquo;inizio
                          </label>
                          <input
                            type="text"
                            value={activeLineup.matchInfo.kickoffTime}
                            onChange={(e) =>
                              setActiveLineup((prev) => ({
                                ...prev,
                                matchInfo: { ...prev.matchInfo, kickoffTime: e.target.value },
                              }))
                            }
                            placeholder="10:30"
                            className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-[#F5F6F4] border border-transparent focus:border-[#15803D] focus:bg-white rounded-lg outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[#52605A] mb-1">
                          Campo / Impianto
                        </label>
                        <input
                          type="text"
                          value={activeLineup.matchInfo.venue}
                          onChange={(e) =>
                            setActiveLineup((prev) => ({
                              ...prev,
                              matchInfo: { ...prev.matchInfo, venue: e.target.value },
                            }))
                          }
                          placeholder={teamSettings.homeVenue}
                          className="w-full px-3 py-2 text-sm bg-[#F5F6F4] border border-transparent focus:border-[#15803D] focus:bg-white rounded-lg outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[#52605A] mb-1">
                          Note ritrovo / indicazioni
                        </label>
                        <input
                          type="text"
                          value={activeLineup.matchInfo.notes}
                          onChange={(e) =>
                            setActiveLineup((prev) => ({
                              ...prev,
                              matchInfo: { ...prev.matchInfo, notes: e.target.value },
                            }))
                          }
                          placeholder="Es. Ritrovo 09:45, portare divisa verde"
                          className="w-full px-3 py-2 text-sm bg-[#F5F6F4] border border-transparent focus:border-[#15803D] focus:bg-white rounded-lg outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'rosa' && (
          <SquadManagerView
            players={players}
            onAddPlayer={handleAddPlayer}
            onBulkAddPlayers={handleBulkAddPlayers}
            onUpdatePlayer={handleUpdatePlayer}
            onDeletePlayer={handleDeletePlayer}
            onToggleAvailability={handleToggleAvailability}
          />
        )}

        {activeTab === 'preferite' && (
          <SavedLineupsView
            savedLineups={savedLineups}
            players={players}
            team={teamSettings}
            activeSavedId={activeSavedId}
            onLoadLineup={handleLoadSavedLineup}
            onToggleFavorite={handleToggleSavedFavorite}
            onDuplicateLineup={handleDuplicateSaved}
            onDeleteLineup={handleDeleteSaved}
            onShareLineup={(item) =>
              setShareLineupTarget({
                format: item.format,
                formationId: item.formationId,
                starters: item.starters,
                bench: item.bench,
                captainId: item.captainId,
                matchInfo: item.matchInfo,
              })
            }
            onSaveCurrentClick={() => setSaveModalOpen(true)}
          />
        )}

        {activeTab === 'squadra' && (
          <TeamSettingsView
            team={teamSettings}
            onUpdateTeam={setTeamSettings}
            onExportBackup={handleExportBackup}
            onImportBackup={handleImportBackup}
            onResetDemoData={handleResetDemoData}
          />
        )}
      </main>

      {/* Mobile Bottom Tab Bar (Thumb-Reachable, Strictly Within 15% Sticky Cap) */}
      <nav
        aria-label="Navigazione mobile"
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 h-14 bg-white/95 backdrop-blur-md border-t border-[#E2E6E1] grid grid-cols-4"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer ${
                active ? 'text-[#15803D]' : 'text-[#52605A]'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-semibold tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Mobile Roster Picker Bottom Sheet */}
      {mobilePickerOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 flex items-end bg-black/50 backdrop-blur-xs"
          onClick={() => setMobilePickerOpen(false)}
        >
          <div
            className="w-full max-h-[82vh] bg-white rounded-t-3xl overflow-hidden flex flex-col shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pt-3 pb-1 flex items-center justify-between px-5">
              <div className="w-10 h-1.5 bg-[#D1D8D2] rounded-full mx-auto" />
              <button
                type="button"
                onClick={() => setMobilePickerOpen(false)}
                aria-label="Chiudi elenco calciatori"
                className="p-1.5 text-[#52605A] hover:text-[#111815] rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 pb-5">
              <RosterPickerPanel
                players={players}
                starters={activeLineup.starters}
                bench={activeLineup.bench}
                activeSlot={activeSlotObj}
                targetMode={pickerMode}
                onAssignPlayerToActiveSlot={(pid) => {
                  handleAssignFromPicker(pid);
                }}
                onAddPlayerToBench={(pid) => {
                  handleAddPlayerToBench(pid);
                  setMobilePickerOpen(false);
                }}
                onQuickAddPlayerClick={() => {
                  setMobilePickerOpen(false);
                  setActiveTab('rosa');
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Screenshot & WhatsApp Sharing Modal */}
      <WhatsAppShareModal
        isOpen={Boolean(shareLineupTarget)}
        onClose={() => setShareLineupTarget(null)}
        lineup={shareLineupTarget ?? activeLineup}
        players={players}
        team={teamSettings}
        onNotify={showToast}
      />

      {/* Save Favorite Formation Modal */}
      <SaveLineupModal
        isOpen={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        activeLineup={activeLineup}
        savedLineups={savedLineups}
        editingLineupId={activeSavedId}
        onSave={handleSaveLineup}
      />

      {/* Inline Toast Feedback (Zero window.alert) */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-16 md:bottom-6 right-4 left-4 md:left-auto z-50 md:max-w-sm px-4 py-3 bg-[#111815] text-white text-xs sm:text-sm font-medium rounded-xl shadow-lg flex items-center justify-between gap-3"
        >
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            aria-label="Chiudi notifica"
            className="text-white/70 hover:text-white shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
