export enum PlayerRole {
  POR = 'POR',
  DIF = 'DIF',
  CEN = 'CEN',
  ATT = 'ATT',
}

export enum TeamFormat {
  ELEVEN = '11',
  SEVEN = '7',
  FIVE = '5',
}

export enum JerseyPattern {
  SOLID = 'solid',
  STRIPES = 'stripes',
  HOOPS = 'hoops',
  SASH = 'sash',
}

export type PreferredFoot = 'DX' | 'SX' | 'AMB';

export interface Player {
  id: string;
  name: string; // Full name or display name
  shirtName: string; // Short surname shown under jersey
  number: number;
  role: PlayerRole;
  foot: PreferredFoot;
  available: boolean;
  note?: string;
}

export interface FormationSlot {
  slotId: string;
  label: string; // e.g., 'POR', 'TD', 'DC', 'TS', 'MED', 'CC', 'ATT'
  role: PlayerRole;
  x: number; // 0 to 100 percentage left-to-right
  y: number; // 0 to 100 percentage top-to-bottom (top = attack, bottom = GK)
}

export interface FormationDefinition {
  id: string; // e.g., '11-4-3-3'
  name: string; // e.g., '4-3-3'
  subtitle: string; // e.g., 'Tridente offensivo'
  format: TeamFormat;
  slots: FormationSlot[];
}

export interface TeamSettings {
  name: string;
  shortName: string; // 2-3 letters on club shield
  homeVenue: string;
  coachName: string;
  primaryColor: string;
  secondaryColor: string;
  numberColor: string;
  pattern: JerseyPattern;
  gkColor: string;
  gkSecondaryColor: string;
  gkNumberColor: string;
}

export interface MatchInfo {
  opponent: string;
  dateLabel: string;
  kickoffTime: string;
  venue: string;
  notes: string;
}

export interface ActiveLineup {
  format: TeamFormat;
  formationId: string;
  starters: Record<string, string>; // slotId -> playerId
  bench: string[]; // ordered array of playerIds
  captainId: string | null;
  matchInfo: MatchInfo;
}

export interface SavedLineup {
  id: string;
  title: string;
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
  format: TeamFormat;
  formationId: string;
  starters: Record<string, string>;
  bench: string[];
  captainId: string | null;
  matchInfo: MatchInfo;
}

export type ExportTheme = 'stadium' | 'matchday' | 'classic';

export interface ExportOptions {
  theme: ExportTheme;
  showBench: boolean;
  showMatchInfo: boolean;
  showNumbers: boolean;
  showCoach: boolean;
}

export type AppTab = 'campo' | 'rosa' | 'preferite' | 'squadra';
