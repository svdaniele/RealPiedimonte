import {
  DEFAULT_ACTIVE_LINEUP,
  DEFAULT_PLAYERS,
  DEFAULT_SAVED_LINEUPS,
  DEFAULT_TEAM_SETTINGS,
} from '../data/defaultData';
import { getFormationById } from '../data/formations';
import {
  ActiveLineup,
  Player,
  PlayerRole,
  SavedLineup,
  TeamSettings,
} from '../types';

const STORAGE_KEY = 'undici_calcio_state_v1';

export interface PersistedAppState {
  players: Player[];
  teamSettings: TeamSettings;
  activeLineup: ActiveLineup;
  savedLineups: SavedLineup[];
}

export function loadAppState(): PersistedAppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        players: DEFAULT_PLAYERS,
        teamSettings: DEFAULT_TEAM_SETTINGS,
        activeLineup: DEFAULT_ACTIVE_LINEUP,
        savedLineups: DEFAULT_SAVED_LINEUPS,
      };
    }
    const parsed = JSON.parse(raw) as Partial<PersistedAppState>;
    return {
      players: Array.isArray(parsed.players) && parsed.players.length > 0 ? parsed.players : DEFAULT_PLAYERS,
      teamSettings: { ...DEFAULT_TEAM_SETTINGS, ...(parsed.teamSettings ?? {}) },
      activeLineup: {
        ...DEFAULT_ACTIVE_LINEUP,
        ...(parsed.activeLineup ?? {}),
        matchInfo: {
          ...DEFAULT_ACTIVE_LINEUP.matchInfo,
          ...(parsed.activeLineup?.matchInfo ?? {}),
        },
      },
      savedLineups: Array.isArray(parsed.savedLineups) ? parsed.savedLineups : DEFAULT_SAVED_LINEUPS,
    };
  } catch {
    return {
      players: DEFAULT_PLAYERS,
      teamSettings: DEFAULT_TEAM_SETTINGS,
      activeLineup: DEFAULT_ACTIVE_LINEUP,
      savedLineups: DEFAULT_SAVED_LINEUPS,
    };
  }
}

export function saveAppState(state: PersistedAppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage quota exceeded or unavailable; keep running smoothly in memory
  }
}

export function buildWhatsAppText(
  lineup: ActiveLineup,
  players: Player[],
  team: TeamSettings
): string {
  const formation = getFormationById(lineup.formationId);
  const playerMap = new Map(players.map((p) => [p.id, p]));
  const lines: string[] = [];

  lines.push(`*${team.name.toUpperCase()} — FORMAZIONE*`);

  const matchParts: string[] = [];
  if (lineup.matchInfo.opponent.trim()) {
    matchParts.push(`vs ${lineup.matchInfo.opponent.trim()}`);
  }
  if (lineup.matchInfo.dateLabel.trim()) {
    matchParts.push(lineup.matchInfo.dateLabel.trim());
  }
  if (lineup.matchInfo.kickoffTime.trim()) {
    matchParts.push(`ore ${lineup.matchInfo.kickoffTime.trim()}`);
  }
  if (matchParts.length > 0) {
    lines.push(matchParts.join(' · '));
  }
  if (lineup.matchInfo.venue.trim()) {
    lines.push(`Campo: ${lineup.matchInfo.venue.trim()}`);
  }

  lines.push(`Modulo: *${formation.name}* (Calcio a ${lineup.format})`);
  lines.push('');

  const roleGroups: { role: PlayerRole; heading: string }[] = [
    { role: PlayerRole.POR, heading: 'Portiere' },
    { role: PlayerRole.DIF, heading: 'Difesa' },
    { role: PlayerRole.CEN, heading: 'Centrocampo' },
    { role: PlayerRole.ATT, heading: 'Attacco' },
  ];

  for (const group of roleGroups) {
    const groupSlots = formation.slots.filter((s) => s.role === group.role);
    if (groupSlots.length === 0) continue;
    const names = groupSlots.map((slot) => {
      const pid = lineup.starters[slot.slotId];
      const player = pid ? playerMap.get(pid) : null;
      if (!player) return `(${slot.label} vuoto)`;
      const cap = lineup.captainId === player.id ? ' (C)' : '';
      return `${player.number} ${player.shirtName}${cap}`;
    });
    lines.push(`*${group.heading}:* ${names.join(', ')}`);
  }

  const benchPlayers = lineup.bench
    .map((id) => playerMap.get(id))
    .filter((p): p is Player => Boolean(p));

  if (benchPlayers.length > 0) {
    lines.push('');
    lines.push(
      `*Panchina:* ${benchPlayers.map((p) => `${p.number} ${p.shirtName}`).join(', ')}`
    );
  }

  if (team.coachName.trim()) {
    lines.push(`*Allenatore:* ${team.coachName.trim()}`);
  }

  if (lineup.matchInfo.notes.trim()) {
    lines.push('');
    lines.push(`Note: ${lineup.matchInfo.notes.trim()}`);
  }

  return lines.join('\n');
}

export function buildWhatsAppShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

/**
 * Parse a quick plain-text pasted roster from WhatsApp or notes.
 * Accepts lines like:
 *   "1 Rossi POR"
 *   "10 Verdi A"
 *   "Marco Bianchi"
 *   "7 - Paolo Neri (CEN)"
 */
export function parseBulkRosterText(raw: string, existingPlayers: Player[]): Player[] {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const usedNumbers = new Set(existingPlayers.map((p) => p.number));
  let nextNum = 1;
  const pickNextNumber = () => {
    while (usedNumbers.has(nextNum) && nextNum < 99) nextNum++;
    usedNumbers.add(nextNum);
    return nextNum;
  };

  const results: Player[] = [];

  for (let i = 0; i < lines.length; i++) {
    let text = lines[i].replace(/^[-•*]\s*/, '').trim();
    if (!text) continue;

    // Extract leading jersey number if present
    let number: number | null = null;
    const numMatch = text.match(/^#?(\d{1,2})\s*[-–.)]?\s+(.+)$/);
    if (numMatch) {
      const parsedNum = parseInt(numMatch[1], 10);
      if (parsedNum >= 1 && parsedNum <= 99) {
        number = parsedNum;
        usedNumbers.add(parsedNum);
        text = numMatch[2].trim();
      }
    }

    // Extract role token at end if present
    let role: PlayerRole = PlayerRole.CEN;
    const roleRegex = /[\s(,-]+(POR|PORTIERE|GK|P|DIF|DIFENSORE|DF|D|CEN|CENTROCAMPISTA|CC|C|ATT|ATTACCANTE|FW|A)\)?$/i;
    const roleMatch = text.match(roleRegex);
    if (roleMatch) {
      const token = roleMatch[1].toUpperCase();
      if (['POR', 'PORTIERE', 'GK', 'P'].includes(token)) role = PlayerRole.POR;
      else if (['DIF', 'DIFENSORE', 'DF', 'D'].includes(token)) role = PlayerRole.DIF;
      else if (['CEN', 'CENTROCAMPISTA', 'CC', 'C'].includes(token)) role = PlayerRole.CEN;
      else if (['ATT', 'ATTACCANTE', 'FW', 'A'].includes(token)) role = PlayerRole.ATT;
      text = text.replace(roleRegex, '').trim();
    }

    if (!text) continue;
    const parts = text.split(/\s+/);
    const shirtName = parts.length > 1 ? parts[parts.length - 1] : parts[0];

    results.push({
      id: `p-imp-${Date.now()}-${i}`,
      name: text,
      shirtName,
      number: number ?? pickNextNumber(),
      role,
      foot: 'DX',
      available: true,
    });
  }

  return results;
}
