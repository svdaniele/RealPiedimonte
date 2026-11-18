import { FormationDefinition, Player, PlayerRole, TeamFormat } from '../types';

export const FORMATIONS: FormationDefinition[] = [
  // ===================== CALCIO A 11 =====================
  {
    id: '11-4-3-3',
    name: '4-3-3',
    subtitle: 'Tridente offensivo',
    format: TeamFormat.ELEVEN,
    slots: [
      { slotId: 'gk', label: 'POR', role: PlayerRole.POR, x: 50, y: 89 },
      { slotId: 'lb', label: 'TS', role: PlayerRole.DIF, x: 14, y: 71 },
      { slotId: 'lcb', label: 'DC', role: PlayerRole.DIF, x: 37, y: 74 },
      { slotId: 'rcb', label: 'DC', role: PlayerRole.DIF, x: 63, y: 74 },
      { slotId: 'rb', label: 'TD', role: PlayerRole.DIF, x: 86, y: 71 },
      { slotId: 'lcm', label: 'MZ', role: PlayerRole.CEN, x: 26, y: 49 },
      { slotId: 'cdm', label: 'REG', role: PlayerRole.CEN, x: 50, y: 54 },
      { slotId: 'rcm', label: 'MZ', role: PlayerRole.CEN, x: 74, y: 49 },
      { slotId: 'lw', label: 'AS', role: PlayerRole.ATT, x: 19, y: 24 },
      { slotId: 'st', label: 'PC', role: PlayerRole.ATT, x: 50, y: 17 },
      { slotId: 'rw', label: 'AD', role: PlayerRole.ATT, x: 81, y: 24 },
    ],
  },
  {
    id: '11-4-4-2',
    name: '4-4-2',
    subtitle: 'Equilibrio classico',
    format: TeamFormat.ELEVEN,
    slots: [
      { slotId: 'gk', label: 'POR', role: PlayerRole.POR, x: 50, y: 89 },
      { slotId: 'lb', label: 'TS', role: PlayerRole.DIF, x: 14, y: 72 },
      { slotId: 'lcb', label: 'DC', role: PlayerRole.DIF, x: 37, y: 74 },
      { slotId: 'rcb', label: 'DC', role: PlayerRole.DIF, x: 63, y: 74 },
      { slotId: 'rb', label: 'TD', role: PlayerRole.DIF, x: 86, y: 72 },
      { slotId: 'lm', label: 'ES', role: PlayerRole.CEN, x: 14, y: 47 },
      { slotId: 'lcm', label: 'CC', role: PlayerRole.CEN, x: 38, y: 51 },
      { slotId: 'rcm', label: 'CC', role: PlayerRole.CEN, x: 62, y: 51 },
      { slotId: 'rm', label: 'ED', role: PlayerRole.CEN, x: 86, y: 47 },
      { slotId: 'lst', label: 'ATT', role: PlayerRole.ATT, x: 35, y: 21 },
      { slotId: 'rst', label: 'ATT', role: PlayerRole.ATT, x: 65, y: 21 },
    ],
  },
  {
    id: '11-3-5-2',
    name: '3-5-2',
    subtitle: 'Quinti e due punte',
    format: TeamFormat.ELEVEN,
    slots: [
      { slotId: 'gk', label: 'POR', role: PlayerRole.POR, x: 50, y: 89 },
      { slotId: 'lcb', label: 'BRS', role: PlayerRole.DIF, x: 24, y: 73 },
      { slotId: 'cb', label: 'DC', role: PlayerRole.DIF, x: 50, y: 75 },
      { slotId: 'rcb', label: 'BRD', role: PlayerRole.DIF, x: 76, y: 73 },
      { slotId: 'lwb', label: 'ES', role: PlayerRole.CEN, x: 12, y: 48 },
      { slotId: 'lcm', label: 'MZ', role: PlayerRole.CEN, x: 32, y: 48 },
      { slotId: 'cdm', label: 'MED', role: PlayerRole.CEN, x: 50, y: 56 },
      { slotId: 'rcm', label: 'MZ', role: PlayerRole.CEN, x: 68, y: 48 },
      { slotId: 'rwb', label: 'ED', role: PlayerRole.CEN, x: 88, y: 48 },
      { slotId: 'lst', label: 'ATT', role: PlayerRole.ATT, x: 35, y: 21 },
      { slotId: 'rst', label: 'ATT', role: PlayerRole.ATT, x: 65, y: 21 },
    ],
  },
  {
    id: '11-4-2-3-1',
    name: '4-2-3-1',
    subtitle: 'Trequartista e ali',
    format: TeamFormat.ELEVEN,
    slots: [
      { slotId: 'gk', label: 'POR', role: PlayerRole.POR, x: 50, y: 89 },
      { slotId: 'lb', label: 'TS', role: PlayerRole.DIF, x: 14, y: 72 },
      { slotId: 'lcb', label: 'DC', role: PlayerRole.DIF, x: 37, y: 75 },
      { slotId: 'rcb', label: 'DC', role: PlayerRole.DIF, x: 63, y: 75 },
      { slotId: 'rb', label: 'TD', role: PlayerRole.DIF, x: 86, y: 72 },
      { slotId: 'ldm', label: 'MED', role: PlayerRole.CEN, x: 36, y: 56 },
      { slotId: 'rdm', label: 'MED', role: PlayerRole.CEN, x: 64, y: 56 },
      { slotId: 'lam', label: 'AS', role: PlayerRole.CEN, x: 19, y: 36 },
      { slotId: 'cam', label: 'TRQ', role: PlayerRole.CEN, x: 50, y: 35 },
      { slotId: 'ram', label: 'AD', role: PlayerRole.CEN, x: 81, y: 36 },
      { slotId: 'st', label: 'PC', role: PlayerRole.ATT, x: 50, y: 16 },
    ],
  },
  {
    id: '11-3-4-3',
    name: '3-4-3',
    subtitle: 'Ampiezza e pressing',
    format: TeamFormat.ELEVEN,
    slots: [
      { slotId: 'gk', label: 'POR', role: PlayerRole.POR, x: 50, y: 89 },
      { slotId: 'lcb', label: 'DC', role: PlayerRole.DIF, x: 24, y: 73 },
      { slotId: 'cb', label: 'DC', role: PlayerRole.DIF, x: 50, y: 75 },
      { slotId: 'rcb', label: 'DC', role: PlayerRole.DIF, x: 76, y: 73 },
      { slotId: 'lm', label: 'ES', role: PlayerRole.CEN, x: 13, y: 49 },
      { slotId: 'lcm', label: 'CC', role: PlayerRole.CEN, x: 38, y: 52 },
      { slotId: 'rcm', label: 'CC', role: PlayerRole.CEN, x: 62, y: 52 },
      { slotId: 'rm', label: 'ED', role: PlayerRole.CEN, x: 87, y: 49 },
      { slotId: 'lw', label: 'AS', role: PlayerRole.ATT, x: 20, y: 24 },
      { slotId: 'st', label: 'PC', role: PlayerRole.ATT, x: 50, y: 17 },
      { slotId: 'rw', label: 'AD', role: PlayerRole.ATT, x: 80, y: 24 },
    ],
  },
  {
    id: '11-4-3-1-2',
    name: '4-3-1-2',
    subtitle: 'Rombo a centrocampo',
    format: TeamFormat.ELEVEN,
    slots: [
      { slotId: 'gk', label: 'POR', role: PlayerRole.POR, x: 50, y: 89 },
      { slotId: 'lb', label: 'TS', role: PlayerRole.DIF, x: 14, y: 72 },
      { slotId: 'lcb', label: 'DC', role: PlayerRole.DIF, x: 37, y: 75 },
      { slotId: 'rcb', label: 'DC', role: PlayerRole.DIF, x: 63, y: 75 },
      { slotId: 'rb', label: 'TD', role: PlayerRole.DIF, x: 86, y: 72 },
      { slotId: 'lcm', label: 'MZ', role: PlayerRole.CEN, x: 26, y: 52 },
      { slotId: 'cdm', label: 'MED', role: PlayerRole.CEN, x: 50, y: 58 },
      { slotId: 'rcm', label: 'MZ', role: PlayerRole.CEN, x: 74, y: 52 },
      { slotId: 'cam', label: 'TRQ', role: PlayerRole.CEN, x: 50, y: 36 },
      { slotId: 'lst', label: 'ATT', role: PlayerRole.ATT, x: 34, y: 19 },
      { slotId: 'rst', label: 'ATT', role: PlayerRole.ATT, x: 66, y: 19 },
    ],
  },
  {
    id: '11-5-3-2',
    name: '5-3-2',
    subtitle: 'Linea a cinque coperta',
    format: TeamFormat.ELEVEN,
    slots: [
      { slotId: 'gk', label: 'POR', role: PlayerRole.POR, x: 50, y: 89 },
      { slotId: 'lwb', label: 'TS', role: PlayerRole.DIF, x: 11, y: 66 },
      { slotId: 'lcb', label: 'DC', role: PlayerRole.DIF, x: 30, y: 74 },
      { slotId: 'cb', label: 'LIB', role: PlayerRole.DIF, x: 50, y: 76 },
      { slotId: 'rcb', label: 'DC', role: PlayerRole.DIF, x: 70, y: 74 },
      { slotId: 'rwb', label: 'TD', role: PlayerRole.DIF, x: 89, y: 66 },
      { slotId: 'lcm', label: 'MZ', role: PlayerRole.CEN, x: 26, y: 47 },
      { slotId: 'cm', label: 'MED', role: PlayerRole.CEN, x: 50, y: 51 },
      { slotId: 'rcm', label: 'MZ', role: PlayerRole.CEN, x: 74, y: 47 },
      { slotId: 'lst', label: 'ATT', role: PlayerRole.ATT, x: 35, y: 21 },
      { slotId: 'rst', label: 'ATT', role: PlayerRole.ATT, x: 65, y: 21 },
    ],
  },

  // ===================== CALCIO A 7 =====================
  {
    id: '7-2-3-1',
    name: '2-3-1',
    subtitle: 'Standard equilibrato',
    format: TeamFormat.SEVEN,
    slots: [
      { slotId: 'gk', label: 'POR', role: PlayerRole.POR, x: 50, y: 88 },
      { slotId: 'ld', label: 'DIF', role: PlayerRole.DIF, x: 30, y: 69 },
      { slotId: 'rd', label: 'DIF', role: PlayerRole.DIF, x: 70, y: 69 },
      { slotId: 'lm', label: 'ES', role: PlayerRole.CEN, x: 18, y: 45 },
      { slotId: 'cm', label: 'CC', role: PlayerRole.CEN, x: 50, y: 49 },
      { slotId: 'rm', label: 'ED', role: PlayerRole.CEN, x: 82, y: 45 },
      { slotId: 'st', label: 'ATT', role: PlayerRole.ATT, x: 50, y: 20 },
    ],
  },
  {
    id: '7-3-2-1',
    name: '3-2-1',
    subtitle: 'Difesa solida',
    format: TeamFormat.SEVEN,
    slots: [
      { slotId: 'gk', label: 'POR', role: PlayerRole.POR, x: 50, y: 88 },
      { slotId: 'ld', label: 'TS', role: PlayerRole.DIF, x: 20, y: 68 },
      { slotId: 'cd', label: 'DC', role: PlayerRole.DIF, x: 50, y: 71 },
      { slotId: 'rd', label: 'TD', role: PlayerRole.DIF, x: 80, y: 68 },
      { slotId: 'lcm', label: 'CC', role: PlayerRole.CEN, x: 33, y: 44 },
      { slotId: 'rcm', label: 'CC', role: PlayerRole.CEN, x: 67, y: 44 },
      { slotId: 'st', label: 'ATT', role: PlayerRole.ATT, x: 50, y: 20 },
    ],
  },
  {
    id: '7-3-1-2',
    name: '3-1-2',
    subtitle: 'Doppia punta',
    format: TeamFormat.SEVEN,
    slots: [
      { slotId: 'gk', label: 'POR', role: PlayerRole.POR, x: 50, y: 88 },
      { slotId: 'ld', label: 'TS', role: PlayerRole.DIF, x: 20, y: 68 },
      { slotId: 'cd', label: 'DC', role: PlayerRole.DIF, x: 50, y: 71 },
      { slotId: 'rd', label: 'TD', role: PlayerRole.DIF, x: 80, y: 68 },
      { slotId: 'cm', label: 'MED', role: PlayerRole.CEN, x: 50, y: 47 },
      { slotId: 'lst', label: 'ATT', role: PlayerRole.ATT, x: 33, y: 22 },
      { slotId: 'rst', label: 'ATT', role: PlayerRole.ATT, x: 67, y: 22 },
    ],
  },
  {
    id: '7-2-2-2',
    name: '2-2-2',
    subtitle: 'Offensivo diretto',
    format: TeamFormat.SEVEN,
    slots: [
      { slotId: 'gk', label: 'POR', role: PlayerRole.POR, x: 50, y: 88 },
      { slotId: 'ld', label: 'DIF', role: PlayerRole.DIF, x: 30, y: 70 },
      { slotId: 'rd', label: 'DIF', role: PlayerRole.DIF, x: 70, y: 70 },
      { slotId: 'lcm', label: 'CC', role: PlayerRole.CEN, x: 28, y: 46 },
      { slotId: 'rcm', label: 'CC', role: PlayerRole.CEN, x: 72, y: 46 },
      { slotId: 'lst', label: 'ATT', role: PlayerRole.ATT, x: 32, y: 21 },
      { slotId: 'rst', label: 'ATT', role: PlayerRole.ATT, x: 68, y: 21 },
    ],
  },

  // ===================== CALCIO A 5 =====================
  {
    id: '5-1-2-1',
    name: '1-2-1',
    subtitle: 'Rombo classico',
    format: TeamFormat.FIVE,
    slots: [
      { slotId: 'gk', label: 'POR', role: PlayerRole.POR, x: 50, y: 87 },
      { slotId: 'fix', label: 'ULT', role: PlayerRole.DIF, x: 50, y: 67 },
      { slotId: 'lw', label: 'LAT', role: PlayerRole.CEN, x: 22, y: 46 },
      { slotId: 'rw', label: 'LAT', role: PlayerRole.CEN, x: 78, y: 46 },
      { slotId: 'piv', label: 'PIV', role: PlayerRole.ATT, x: 50, y: 21 },
    ],
  },
  {
    id: '5-2-2',
    name: '2-2',
    subtitle: 'Quadrato dinamico',
    format: TeamFormat.FIVE,
    slots: [
      { slotId: 'gk', label: 'POR', role: PlayerRole.POR, x: 50, y: 87 },
      { slotId: 'ld', label: 'DIF', role: PlayerRole.DIF, x: 30, y: 64 },
      { slotId: 'rd', label: 'DIF', role: PlayerRole.DIF, x: 70, y: 64 },
      { slotId: 'la', label: 'ATT', role: PlayerRole.ATT, x: 30, y: 28 },
      { slotId: 'ra', label: 'ATT', role: PlayerRole.ATT, x: 70, y: 28 },
    ],
  },
  {
    id: '5-2-1-1',
    name: '2-1-1',
    subtitle: 'Copertura e pivot',
    format: TeamFormat.FIVE,
    slots: [
      { slotId: 'gk', label: 'POR', role: PlayerRole.POR, x: 50, y: 87 },
      { slotId: 'ld', label: 'DIF', role: PlayerRole.DIF, x: 30, y: 67 },
      { slotId: 'rd', label: 'DIF', role: PlayerRole.DIF, x: 70, y: 67 },
      { slotId: 'cm', label: 'CEN', role: PlayerRole.CEN, x: 50, y: 45 },
      { slotId: 'piv', label: 'PIV', role: PlayerRole.ATT, x: 50, y: 21 },
    ],
  },
];

export function getFormationsByFormat(format: TeamFormat): FormationDefinition[] {
  return FORMATIONS.filter((f) => f.format === format);
}

export function getFormationById(id: string): FormationDefinition {
  return FORMATIONS.find((f) => f.id === id) ?? FORMATIONS[0];
}

/**
 * Intelligently remaps current starters into a newly chosen formation,
 * keeping players in matching natural roles first and pushing overflow onto the bench.
 */
export function remapStartersToFormation(
  currentStarters: Record<string, string>,
  currentBench: string[],
  targetFormation: FormationDefinition,
  players: Player[]
): { starters: Record<string, string>; bench: string[] } {
  const playerMap = new Map(players.map((p) => [p.id, p]));
  const existingStarterIds = Object.values(currentStarters).filter((id) => playerMap.has(id));
  const newStarters: Record<string, string> = {};
  const assignedIds = new Set<string>();

  // Pass 1: exact slotId match if role also matches
  for (const slot of targetFormation.slots) {
    const prevId = currentStarters[slot.slotId];
    if (prevId && !assignedIds.has(prevId)) {
      const p = playerMap.get(prevId);
      if (p && p.role === slot.role) {
        newStarters[slot.slotId] = prevId;
        assignedIds.add(prevId);
      }
    }
  }

  // Pass 2: match remaining starters by natural role
  for (const slot of targetFormation.slots) {
    if (newStarters[slot.slotId]) continue;
    const match = existingStarterIds.find((id) => {
      if (assignedIds.has(id)) return false;
      const p = playerMap.get(id);
      return p?.role === slot.role;
    });
    if (match) {
      newStarters[slot.slotId] = match;
      assignedIds.add(match);
    }
  }

  // Pass 3: fill any still-empty slots with remaining previous starters (adapted)
  for (const slot of targetFormation.slots) {
    if (newStarters[slot.slotId]) continue;
    const fallback = existingStarterIds.find((id) => !assignedIds.has(id));
    if (fallback) {
      newStarters[slot.slotId] = fallback;
      assignedIds.add(fallback);
    }
  }

  // Overflow from previous starters goes to the top of the bench
  const overflowIds = existingStarterIds.filter((id) => !assignedIds.has(id));
  const cleanBench = [
    ...overflowIds,
    ...currentBench.filter((id) => playerMap.has(id) && !assignedIds.has(id) && !overflowIds.includes(id)),
  ];

  return { starters: newStarters, bench: cleanBench };
}

/**
 * Auto-fills a formation from available squad members, matching roles cleanly.
 */
export function autoFillFormation(
  formation: FormationDefinition,
  players: Player[]
): { starters: Record<string, string>; bench: string[]; captainId: string | null } {
  const available = players.filter((p) => p.available);
  const used = new Set<string>();
  const starters: Record<string, string> = {};

  // Match exact roles first
  for (const slot of formation.slots) {
    const match = available.find((p) => !used.has(p.id) && p.role === slot.role);
    if (match) {
      starters[slot.slotId] = match.id;
      used.add(match.id);
    }
  }

  // Fill any remaining slots with best remaining available players
  for (const slot of formation.slots) {
    if (starters[slot.slotId]) continue;
    const fallback = available.find((p) => !used.has(p.id));
    if (fallback) {
      starters[slot.slotId] = fallback.id;
      used.add(fallback.id);
    }
  }

  const bench = available.filter((p) => !used.has(p.id)).slice(0, 7).map((p) => p.id);
  const starterIds = Object.values(starters);
  const captainPlayer = available.find(
    (p) => starterIds.includes(p.id) && p.note?.toLowerCase().includes('capitano')
  );

  return {
    starters,
    bench,
    captainId: captainPlayer?.id ?? starterIds[1] ?? starterIds[0] ?? null,
  };
}

export const ROLE_META: Record<
  PlayerRole,
  { label: string; short: string; plural: string; textClass: string; badgeBg: string; hex: string }
> = {
  [PlayerRole.POR]: {
    label: 'Portiere',
    short: 'P',
    plural: 'Portieri',
    textClass: 'text-amber-700',
    badgeBg: 'bg-amber-600',
    hex: '#D97706',
  },
  [PlayerRole.DIF]: {
    label: 'Difensore',
    short: 'D',
    plural: 'Difensori',
    textClass: 'text-blue-700',
    badgeBg: 'bg-blue-700',
    hex: '#1D4ED8',
  },
  [PlayerRole.CEN]: {
    label: 'Centrocampista',
    short: 'C',
    plural: 'Centrocampisti',
    textClass: 'text-emerald-700',
    badgeBg: 'bg-emerald-700',
    hex: '#047857',
  },
  [PlayerRole.ATT]: {
    label: 'Attaccante',
    short: 'A',
    plural: 'Attaccanti',
    textClass: 'text-rose-700',
    badgeBg: 'bg-rose-700',
    hex: '#BE123C',
  },
};
