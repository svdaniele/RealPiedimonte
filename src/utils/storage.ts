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

export type RosterExportFormat = 'json' | 'csv' | 'text';

const ROLE_SORT_ORDER: PlayerRole[] = [
  PlayerRole.POR,
  PlayerRole.DIF,
  PlayerRole.CEN,
  PlayerRole.ATT,
];

function sortPlayersForExport(players: Player[]): Player[] {
  return [...players].sort((a, b) => {
    const ra = ROLE_SORT_ORDER.indexOf(a.role);
    const rb = ROLE_SORT_ORDER.indexOf(b.role);
    if (ra !== rb) return ra - rb;
    return a.number - b.number;
  });
}

function escapeCsvCell(value: string): string {
  if (/[;"\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function formatRosterForExport(
  players: Player[],
  format: RosterExportFormat,
  teamName?: string
): string {
  const sorted = sortPlayersForExport(players);

  if (format === 'json') {
    return JSON.stringify(
      {
        type: 'undici-rosa',
        version: 1,
        teamName: teamName || undefined,
        exportedAt: new Date().toISOString(),
        players: sorted.map((p) => ({
          id: p.id,
          name: p.name,
          shirtName: p.shirtName,
          number: p.number,
          role: p.role,
          foot: p.foot,
          available: p.available,
          note: p.note ?? '',
        })),
      },
      null,
      2
    );
  }

  if (format === 'csv') {
    const header = 'numero;nome;maglia;ruolo;piede;disponibile;note';
    const rows = sorted.map((p) =>
      [
        String(p.number),
        escapeCsvCell(p.name),
        escapeCsvCell(p.shirtName),
        p.role,
        p.foot,
        p.available ? 'SI' : 'NO',
        escapeCsvCell(p.note ?? ''),
      ].join(';')
    );
    return [header, ...rows].join('\n');
  }

  // Plain re-importable text format
  return sorted
    .map((p) => `${p.number} ${p.name} ${p.role}`)
    .join('\n');
}

function normalizeRoleToken(raw: unknown): PlayerRole {
  const token = String(raw ?? '')
    .trim()
    .toUpperCase();
  if (['POR', 'PORTIERE', 'GK', 'P'].includes(token)) return PlayerRole.POR;
  if (['DIF', 'DIFENSORE', 'DF', 'D'].includes(token)) return PlayerRole.DIF;
  if (['ATT', 'ATTACCANTE', 'FW', 'A'].includes(token)) return PlayerRole.ATT;
  return PlayerRole.CEN;
}

function normalizeFootToken(raw: unknown): 'DX' | 'SX' | 'AMB' {
  const token = String(raw ?? '')
    .trim()
    .toUpperCase();
  if (token === 'SX' || token === 'SINISTRO') return 'SX';
  if (token === 'AMB' || token === 'AMBIDESTRO') return 'AMB';
  return 'DX';
}

function splitCsvLine(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      cells.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  cells.push(current.trim());
  return cells;
}

export function parseRosterImport(
  raw: string,
  existingPlayers: Player[],
  replaceExisting = false
): { players: Player[]; detectedFormat: RosterExportFormat | null } {
  const trimmed = raw.trim();
  if (!trimmed) return { players: [], detectedFormat: null };

  // 1. Try JSON (supports { type: 'undici-rosa', players: [...] }, full backup { players: [...] }, or raw Player[])
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      const list: unknown[] = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.players)
        ? parsed.players
        : [];
      if (list.length > 0) {
        const players: Player[] = list
          .map((item, idx): Player | null => {
            if (!item || typeof item !== 'object') return null;
            const rec = item as Record<string, unknown>;
            const name = String(rec.name ?? '').trim();
            if (!name) return null;
            const parts = name.split(/\s+/);
            const shirtName =
              String(rec.shirtName ?? '').trim() || parts[parts.length - 1] || name;
            const num = parseInt(String(rec.number ?? idx + 1), 10);
            const safeNum = Number.isFinite(num) ? Math.max(1, Math.min(99, num)) : idx + 1;
            const preservedId =
              replaceExisting && typeof rec.id === 'string' && rec.id.trim()
                ? rec.id.trim()
                : `p-imp-${Date.now()}-${idx}`;
            return {
              id: preservedId,
              name,
              shirtName,
              number: safeNum,
              role: normalizeRoleToken(rec.role),
              foot: normalizeFootToken(rec.foot),
              available: rec.available !== false,
              note: typeof rec.note === 'string' ? rec.note.trim() : '',
            };
          })
          .filter((p): p is Player => Boolean(p));

        if (players.length > 0) {
          return { players, detectedFormat: 'json' };
        }
      }
    } catch {
      // Not valid JSON; continue to CSV / text detection
    }
  }

  // 2. Try CSV (semicolon or comma separated with >= 3 columns)
  const lines = trimmed
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length > 0 && (lines[0].includes(';') || lines[0].split(',').length >= 4)) {
    const delimiter = lines[0].includes(';') ? ';' : ',';
    const firstCells = splitCsvLine(lines[0], delimiter).map((c) => c.toLowerCase());
    const hasHeader =
      firstCells.includes('nome') ||
      firstCells.includes('numero') ||
      firstCells.includes('ruolo');
    const dataLines = hasHeader ? lines.slice(1) : lines;

    const csvPlayers: Player[] = [];
    dataLines.forEach((line, idx) => {
      const cells = splitCsvLine(line, delimiter);
      if (cells.length < 2) return;
      const numVal = parseInt(cells[0], 10);
      const hasLeadingNum = Number.isFinite(numVal);
      const name = (hasLeadingNum ? cells[1] : cells[0])?.trim() ?? '';
      if (!name) return;

      const shirtCell = (hasLeadingNum ? cells[2] : cells[1])?.trim() ?? '';
      const roleCell = hasLeadingNum ? cells[3] : cells[2];
      const footCell = hasLeadingNum ? cells[4] : cells[3];
      const availCell = (hasLeadingNum ? cells[5] : cells[4])?.trim().toUpperCase();
      const noteCell = (hasLeadingNum ? cells[6] : cells[5])?.trim() ?? '';

      const parts = name.split(/\s+/);
      csvPlayers.push({
        id: `p-csv-${Date.now()}-${idx}`,
        name,
        shirtName: shirtCell || parts[parts.length - 1] || name,
        number: hasLeadingNum ? Math.max(1, Math.min(99, numVal)) : idx + 1,
        role: normalizeRoleToken(roleCell),
        foot: normalizeFootToken(footCell),
        available: availCell ? !['NO', 'FALSE', '0', 'ASSENTE'].includes(availCell) : true,
        note: noteCell,
      });
    });

    if (csvPlayers.length > 0) {
      return { players: csvPlayers, detectedFormat: 'csv' };
    }
  }

  // 3. Plain text list (e.g., "1 Matteo Ferraro POR")
  const textPlayers = parseBulkRosterText(trimmed, replaceExisting ? [] : existingPlayers);
  return {
    players: textPlayers,
    detectedFormat: textPlayers.length > 0 ? 'text' : null,
  };
}

