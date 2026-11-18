import React, { useMemo, useRef, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  Edit3,
  Plus,
  Search,
  Trash2,
  Upload,
  UserCheck,
  UserX,
  X,
} from 'lucide-react';
import { ROLE_META } from '../data/formations';
import { Player, PlayerRole, PreferredFoot } from '../types';
import {
  formatRosterForExport,
  parseRosterImport,
  RosterExportFormat,
} from '../utils/storage';

interface SquadManagerViewProps {
  players: Player[];
  teamName: string;
  onAddPlayer: (player: Omit<Player, 'id'>) => void;
  onBulkAddPlayers: (players: Player[], replaceExisting: boolean) => void;
  onUpdatePlayer: (player: Player) => void;
  onDeletePlayer: (playerId: string) => void;
  onToggleAvailability: (playerId: string) => void;
  onNotify: (message: string) => void;
}

const ROLE_ORDER: PlayerRole[] = [
  PlayerRole.POR,
  PlayerRole.DIF,
  PlayerRole.CEN,
  PlayerRole.ATT,
];

export const SquadManagerView: React.FC<SquadManagerViewProps> = ({
  players,
  teamName,
  onAddPlayer,
  onBulkAddPlayers,
  onUpdatePlayer,
  onDeletePlayer,
  onToggleAvailability,
  onNotify,
}) => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | PlayerRole>('ALL');
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<RosterExportFormat>('json');
  const [copiedExport, setCopiedExport] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const importFileRef = useRef<HTMLInputElement | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [shirtName, setShirtName] = useState('');
  const [number, setNumber] = useState('19');
  const [role, setRole] = useState<PlayerRole>(PlayerRole.CEN);
  const [foot, setFoot] = useState<PreferredFoot>('DX');
  const [note, setNote] = useState('');

  const roleCounts = useMemo(() => {
    const counts: Record<PlayerRole, { total: number; available: number }> = {
      [PlayerRole.POR]: { total: 0, available: 0 },
      [PlayerRole.DIF]: { total: 0, available: 0 },
      [PlayerRole.CEN]: { total: 0, available: 0 },
      [PlayerRole.ATT]: { total: 0, available: 0 },
    };
    for (const p of players) {
      counts[p.role].total += 1;
      if (p.available) counts[p.role].available += 1;
    }
    return counts;
  }, [players]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...players]
      .filter((p) => {
        if (roleFilter !== 'ALL' && p.role !== roleFilter) return false;
        if (q) {
          return (
            p.name.toLowerCase().includes(q) ||
            p.shirtName.toLowerCase().includes(q) ||
            String(p.number).includes(q) ||
            (p.note ?? '').toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        const ra = ROLE_ORDER.indexOf(a.role);
        const rb = ROLE_ORDER.indexOf(b.role);
        if (ra !== rb) return ra - rb;
        return a.number - b.number;
      });
  }, [players, search, roleFilter]);

  const openNewForm = () => {
    const used = new Set(players.map((p) => p.number));
    let next = 1;
    while (used.has(next) && next < 99) next++;
    setEditingPlayer(null);
    setName('');
    setShirtName('');
    setNumber(String(next));
    setRole(PlayerRole.CEN);
    setFoot('DX');
    setNote('');
    setShowAddForm(true);
  };

  const openEditForm = (player: Player) => {
    setEditingPlayer(player);
    setName(player.name);
    setShirtName(player.shirtName);
    setNumber(String(player.number));
    setRole(player.role);
    setFoot(player.foot);
    setNote(player.note ?? '');
    setShowAddForm(true);
  };

  const handleSavePlayer = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) return;
    const parts = cleanName.split(/\s+/);
    const computedShirt = shirtName.trim() || parts[parts.length - 1] || cleanName;
    const parsedNum = Math.max(1, Math.min(99, parseInt(number, 10) || 1));

    if (editingPlayer) {
      onUpdatePlayer({
        ...editingPlayer,
        name: cleanName,
        shirtName: computedShirt,
        number: parsedNum,
        role,
        foot,
        note: note.trim(),
      });
    } else {
      onAddPlayer({
        name: cleanName,
        shirtName: computedShirt,
        number: parsedNum,
        role,
        foot,
        available: true,
        note: note.trim(),
      });
    }
    setShowAddForm(false);
    setEditingPlayer(null);
  };

  const parsedImport = useMemo(
    () => parseRosterImport(bulkText, players, importMode === 'replace'),
    [bulkText, players, importMode]
  );

  const exportedContent = useMemo(
    () => formatRosterForExport(players, exportFormat, teamName),
    [players, exportFormat, teamName]
  );

  const handleBulkImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedImport.players.length > 0) {
      onBulkAddPlayers(parsedImport.players, importMode === 'replace');
      setBulkText('');
      setShowBulkModal(false);
    }
  };

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setBulkText(reader.result);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleCopyExport = async () => {
    try {
      await navigator.clipboard.writeText(exportedContent);
      setCopiedExport(true);
      onNotify(`Rosa copiata in formato ${exportFormat.toUpperCase()}`);
      setTimeout(() => setCopiedExport(false), 2200);
    } catch {
      onNotify('Impossibile copiare automaticamente: usa Scarica file');
    }
  };

  const handleDownloadExport = () => {
    const slug =
      teamName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'squadra';
    const metaByFormat: Record<RosterExportFormat, { ext: string; mime: string }> = {
      json: { ext: 'json', mime: 'application/json;charset=utf-8' },
      csv: { ext: 'csv', mime: 'text/csv;charset=utf-8' },
      text: { ext: 'txt', mime: 'text/plain;charset=utf-8' },
    };
    const { ext, mime } = metaByFormat[exportFormat];
    const blob = new Blob([exportedContent], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rosa-${slug}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onNotify(`Rosa esportata in rosa-${slug}.${ext}`);
  };

  const totalAvailable = players.filter((p) => p.available).length;

  return (
    <div className="space-y-6">
      {/* Page Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-athletic text-3xl sm:text-4xl font-bold text-[#111815] leading-none">
            Rosa Calciatori
          </h1>
          <p className="text-sm text-[#52605A] mt-1.5">
            <span className="font-mono tabular-nums font-semibold text-[#111815]">
              {players.length}
            </span>{' '}
            giocatori in rosa ·{' '}
            <span className="font-mono tabular-nums font-semibold text-[#15803D]">
              {totalAvailable}
            </span>{' '}
            disponibili per la prossima partita
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowExportModal(true)}
            disabled={players.length === 0}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 text-sm font-semibold text-[#111815] bg-white hover:bg-[#F2F5F2] disabled:opacity-40 border border-[#DCE1DC] rounded-xl transition-colors whitespace-nowrap cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#52605A]" />
            Esporta rosa
          </button>
          <button
            type="button"
            onClick={() => setShowBulkModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 text-sm font-semibold text-[#111815] bg-white hover:bg-[#F2F5F2] border border-[#DCE1DC] rounded-xl transition-colors whitespace-nowrap cursor-pointer"
          >
            <Upload className="w-4 h-4 text-[#52605A]" />
            Importa rosa
          </button>
          <button
            type="button"
            onClick={openNewForm}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#15803D] hover:bg-[#166534] rounded-xl transition-colors whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Aggiungi calciatore
          </button>
        </div>
      </div>

      {/* Role Balance Strip (Clean single-elevation hairline row) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {ROLE_ORDER.map((r) => {
          const meta = ROLE_META[r];
          const stat = roleCounts[r];
          return (
            <button
              key={r}
              type="button"
              onClick={() => setRoleFilter(roleFilter === r ? 'ALL' : r)}
              className={`text-left px-4 py-3 bg-white border rounded-xl transition-colors cursor-pointer ${
                roleFilter === r
                  ? 'border-[#15803D] ring-1 ring-[#15803D]'
                  : 'border-[#E2E6E1] hover:border-[#C5CEC7]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold ${meta.textClass}`}>{meta.plural}</span>
                <span className="font-mono tabular-nums text-xs text-[#52605A]">{r}</span>
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="font-athletic text-2xl font-bold text-[#111815] tabular-nums">
                  {stat.available}
                </span>
                <span className="text-xs text-[#52605A] tabular-nums">
                  / {stat.total} disp.
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white border border-[#E2E6E1] rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-[#ECEFEA] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-[#6B7A73] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cerca per nome, cognome, numero o nota..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-[#F5F6F4] border border-transparent focus:border-[#15803D] focus:bg-white rounded-lg outline-none transition-colors"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-[#F2F4F1] rounded-lg overflow-x-auto">
            {(['ALL', ...ROLE_ORDER] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  roleFilter === r
                    ? 'bg-white text-[#111815] shadow-xs'
                    : 'text-[#52605A] hover:text-[#111815]'
                }`}
              >
                {r === 'ALL' ? 'Tutti' : ROLE_META[r].plural}
              </button>
            ))}
          </div>
        </div>

        {/* High-Density Clean Roster Table */}
        {filtered.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <p className="text-sm font-semibold text-[#111815]">Nessun calciatore trovato</p>
            <p className="text-xs text-[#52605A] mt-1">
              Aggiungi i componenti della tua squadra oppure importa una lista da WhatsApp.
            </p>
            <button
              type="button"
              onClick={openNewForm}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-[#15803D] text-white rounded-lg hover:bg-[#166534] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Aggiungi il primo calciatore
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#ECEFEA] text-xs font-semibold text-[#52605A] bg-[#FAFBF9]">
                  <th className="py-3 pl-4 pr-2 w-14 text-right">#</th>
                  <th className="py-3 px-3">Calciatore</th>
                  <th className="py-3 px-3 w-28">Ruolo</th>
                  <th className="py-3 px-3 w-20 hidden sm:table-cell">Piede</th>
                  <th className="py-3 px-3 hidden md:table-cell">Note tattiche</th>
                  <th className="py-3 px-3 w-36">Disponibilità</th>
                  <th className="py-3 pl-2 pr-4 w-28 text-right">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F2EF] text-sm">
                {filtered.map((player) => {
                  const meta = ROLE_META[player.role];
                  return (
                    <tr
                      key={player.id}
                      className={`transition-colors ${
                        player.available ? 'hover:bg-[#F7F9F7]' : 'bg-[#FAFAFA] text-[#6B7A73]'
                      }`}
                    >
                      <td className="py-3 pl-4 pr-2 text-right font-mono tabular-nums font-semibold text-[#52605A]">
                        {player.number}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-[#111815]">{player.name}</div>
                        <div className="text-xs text-[#6B7A73]">
                          Maglia: {player.shirtName}
                          <span className="md:hidden">
                            {player.note ? ` · ${player.note}` : ''}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-2">
                          <span
                            className={`w-6 h-6 rounded text-[11px] font-bold text-white flex items-center justify-center shrink-0 ${meta.badgeBg}`}
                          >
                            {meta.short}
                          </span>
                          <span className="text-xs font-medium text-[#111815] hidden sm:inline">
                            {meta.label}
                          </span>
                        </span>
                      </td>
                      <td className="py-3 px-3 text-xs font-mono text-[#52605A] hidden sm:table-cell">
                        {player.foot}
                      </td>
                      <td className="py-3 px-3 text-xs text-[#52605A] hidden md:table-cell max-w-[240px] truncate">
                        {player.note || '—'}
                      </td>
                      <td className="py-3 px-3">
                        <button
                          type="button"
                          onClick={() => onToggleAvailability(player.id)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                            player.available
                              ? 'text-[#15803D] bg-[#EDF7F0] hover:bg-[#DCFCE7]'
                              : 'text-rose-700 bg-rose-50 hover:bg-rose-100'
                          }`}
                        >
                          {player.available ? (
                            <>
                              <UserCheck className="w-3.5 h-3.5" />
                              Disponibile
                            </>
                          ) : (
                            <>
                              <UserX className="w-3.5 h-3.5" />
                              Assente
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-3 pl-2 pr-4 text-right">
                        {confirmDeleteId === player.id ? (
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                onDeletePlayer(player.id);
                                setConfirmDeleteId(null);
                              }}
                              className="px-2 py-1 text-xs font-semibold bg-rose-600 text-white rounded-md hover:bg-rose-700 cursor-pointer"
                            >
                              Elimina
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="p-1 text-[#52605A] hover:text-[#111815] cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openEditForm(player)}
                              aria-label={`Modifica ${player.name}`}
                              className="p-2 text-[#52605A] hover:text-[#111815] hover:bg-[#EDF1EC] rounded-lg transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(player.id)}
                              aria-label={`Elimina ${player.name}`}
                              className="p-2 text-[#52605A] hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Player Modal */}
      {showAddForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-white rounded-2xl border border-[#E2E6E1] shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#ECEFEA]">
              <h2 className="font-athletic text-2xl font-bold text-[#111815]">
                {editingPlayer ? 'Modifica Calciatore' : 'Nuovo Calciatore'}
              </h2>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="p-2 text-[#52605A] hover:text-[#111815] hover:bg-[#F2F5F2] rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlayer} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#111815] mb-1.5">
                  Nome e Cognome
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Es. Marco Rossi"
                  className="w-full px-3.5 py-2.5 text-sm bg-[#F5F6F4] border border-[#DCE1DC] focus:border-[#15803D] focus:bg-white rounded-xl outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-[#111815] mb-1.5">
                    Nome sulla maglia
                  </label>
                  <input
                    type="text"
                    value={shirtName}
                    onChange={(e) => setShirtName(e.target.value)}
                    placeholder="Auto (cognome)"
                    className="w-full px-3.5 py-2.5 text-sm bg-[#F5F6F4] border border-[#DCE1DC] focus:border-[#15803D] focus:bg-white rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#111815] mb-1.5">
                    Numero
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    required
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm font-mono tabular-nums bg-[#F5F6F4] border border-[#DCE1DC] focus:border-[#15803D] focus:bg-white rounded-xl outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111815] mb-1.5">
                  Ruolo principale
                </label>
                <div className="grid grid-cols-4 gap-1.5 p-1 bg-[#F2F4F1] rounded-xl">
                  {ROLE_ORDER.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                        role === r
                          ? `${ROLE_META[r].badgeBg} text-white`
                          : 'text-[#52605A] hover:text-[#111815]'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#111815] mb-1.5">
                    Piede
                  </label>
                  <select
                    value={foot}
                    onChange={(e) => setFoot(e.target.value as PreferredFoot)}
                    className="w-full px-3 py-2.5 text-sm bg-[#F5F6F4] border border-[#DCE1DC] focus:border-[#15803D] focus:bg-white rounded-xl outline-none"
                  >
                    <option value="DX">Destro</option>
                    <option value="SX">Sinistro</option>
                    <option value="AMB">Ambidestro</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-[#111815] mb-1.5">
                    Nota (opzionale)
                  </label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Es. Rigorista, Terzino..."
                    className="w-full px-3.5 py-2.5 text-sm bg-[#F5F6F4] border border-[#DCE1DC] focus:border-[#15803D] focus:bg-white rounded-xl outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2.5 text-sm font-medium text-[#52605A] hover:text-[#111815] cursor-pointer"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold bg-[#15803D] hover:bg-[#166534] text-white rounded-xl transition-colors cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  {editingPlayer ? 'Salva modifiche' : 'Aggiungi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Export Roster Modal (JSON / CSV / Text — All Re-Importable) */}
      {showExportModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="export-roster-title"
        >
          <div className="w-full max-w-2xl bg-white rounded-2xl border border-[#E2E6E1] shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#ECEFEA]">
              <div>
                <h2
                  id="export-roster-title"
                  className="font-athletic text-2xl font-bold text-[#111815]"
                >
                  Esporta Rosa Ri-importabile
                </h2>
                <p className="text-xs text-[#52605A]">
                  Tutti i formati possono essere re-importati direttamente da &ldquo;Importa rosa&rdquo;
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                aria-label="Chiudi esportazione rosa"
                className="p-2 text-[#52605A] hover:text-[#111815] hover:bg-[#F2F5F2] rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#F2F4F1] rounded-xl">
                {(
                  [
                    { id: 'json', label: 'JSON (completo)' },
                    { id: 'csv', label: 'CSV (Excel)' },
                    { id: 'text', label: 'Testo (WhatsApp)' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setExportFormat(opt.id)}
                    className={`py-2 px-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                      exportFormat === opt.id
                        ? 'bg-white text-[#111815] shadow-xs'
                        : 'text-[#52605A] hover:text-[#111815]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <p className="text-xs text-[#52605A]">
                {exportFormat === 'json' &&
                  'Conserva tutti i campi (ID, nome maglia, piede, disponibilità e note) per un ripristino identico al 100%.'}
                {exportFormat === 'csv' &&
                  'Tabella con separatore ";" apribile in Excel o Google Fogli e ri-importabile con tutti i dettagli.'}
                {exportFormat === 'text' &&
                  'Elenco compatto (numero, nome, ruolo) ideale da modificare velocemente o condividere su WhatsApp.'}
              </p>

              <textarea
                readOnly
                rows={10}
                value={exportedContent}
                onFocus={(e) => e.currentTarget.select()}
                className="w-full p-3.5 text-xs font-mono bg-[#F5F6F4] border border-[#DCE1DC] rounded-xl text-[#111815] outline-none resize-none roster-scroll"
              />

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <span className="text-xs text-[#52605A]">
                  <strong className="font-mono tabular-nums text-[#111815]">
                    {players.length}
                  </strong>{' '}
                  calciatori pronti per l&rsquo;esportazione
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyExport}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-[#111815] bg-[#F2F5F2] hover:bg-[#E5ECE6] rounded-xl transition-colors whitespace-nowrap cursor-pointer"
                  >
                    {copiedExport ? (
                      <>
                        <Check className="w-4 h-4 text-[#15803D]" />
                        Copiato
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copia
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadExport}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold bg-[#15803D] hover:bg-[#166534] text-white rounded-xl transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    Scarica .{exportFormat === 'text' ? 'txt' : exportFormat}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Roster Modal (Accepts JSON, CSV, or Plain Text + File Upload) */}
      {showBulkModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="import-roster-title"
        >
          <div className="w-full max-w-lg bg-white rounded-2xl border border-[#E2E6E1] shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#ECEFEA]">
              <div>
                <h2
                  id="import-roster-title"
                  className="font-athletic text-2xl font-bold text-[#111815]"
                >
                  Importa Rosa
                </h2>
                <p className="text-xs text-[#52605A]">
                  Incolla o carica un file JSON, CSV oppure un elenco testuale da WhatsApp
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="p-2 text-[#52605A] hover:text-[#111815] hover:bg-[#F2F5F2] rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBulkImport} className="p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1 p-1 bg-[#F2F4F1] rounded-xl">
                  <button
                    type="button"
                    onClick={() => setImportMode('append')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                      importMode === 'append'
                        ? 'bg-white text-[#111815] shadow-xs'
                        : 'text-[#52605A] hover:text-[#111815]'
                    }`}
                  >
                    Aggiungi alla rosa
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportMode('replace')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                      importMode === 'replace'
                        ? 'bg-white text-[#111815] shadow-xs'
                        : 'text-[#52605A] hover:text-[#111815]'
                    }`}
                  >
                    Sostituisci attuale
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => importFileRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#111815] bg-[#F2F5F2] hover:bg-[#E5ECE6] rounded-xl transition-colors whitespace-nowrap cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Carica file (.json, .csv, .txt)
                </button>
                <input
                  ref={importFileRef}
                  type="file"
                  accept=".json,.csv,.txt,application/json,text/csv,text/plain"
                  onChange={handleImportFileChange}
                  className="hidden"
                />
              </div>

              <textarea
                rows={8}
                required
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={'Incolla JSON, CSV oppure testo semplice:\n1 Luca Rossi POR\n4 Matteo Bianchi DIF\n8 Paolo Verdi CEN\n10 Andrea Neri ATT'}
                className="w-full p-3.5 text-xs font-mono bg-[#F5F6F4] border border-[#DCE1DC] focus:border-[#15803D] focus:bg-white rounded-xl outline-none resize-none roster-scroll"
              />

              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-[#52605A]">
                  Rilevati:{' '}
                  <strong className="font-mono tabular-nums text-[#111815]">
                    {parsedImport.players.length}
                  </strong>{' '}
                  calciatori
                  {parsedImport.detectedFormat && (
                    <span className="text-[#15803D] font-semibold">
                      {' '}
                      · Formato {parsedImport.detectedFormat.toUpperCase()}
                    </span>
                  )}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowBulkModal(false)}
                    className="px-4 py-2.5 text-sm font-medium text-[#52605A] hover:text-[#111815] cursor-pointer"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    disabled={parsedImport.players.length === 0}
                    className="px-5 py-2.5 text-sm font-semibold bg-[#15803D] hover:bg-[#166534] disabled:opacity-40 text-white rounded-xl transition-colors cursor-pointer"
                  >
                    {importMode === 'replace' ? 'Sostituisci rosa' : 'Importa in rosa'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
