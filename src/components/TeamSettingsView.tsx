import React, { useRef, useState } from 'react';
import { Download, RotateCcw, Upload } from 'lucide-react';
import { KIT_COLOR_PRESETS } from '../data/defaultData';
import { JerseyPattern, TeamSettings } from '../types';
import { ClubCrestSvg, JerseySvg } from './JerseySvg';

interface TeamSettingsViewProps {
  team: TeamSettings;
  onUpdateTeam: (next: TeamSettings) => void;
  onExportBackup: () => void;
  onImportBackup: (fileContent: string) => void;
  onResetDemoData: () => void;
}

const PATTERN_OPTIONS: { id: JerseyPattern; label: string }[] = [
  { id: JerseyPattern.SOLID, label: 'Tinta unita' },
  { id: JerseyPattern.STRIPES, label: 'Strisce verticali' },
  { id: JerseyPattern.HOOPS, label: 'Bande orizzontali' },
  { id: JerseyPattern.SASH, label: 'Fascia diagonale' },
];

export const TeamSettingsView: React.FC<TeamSettingsViewProps> = ({
  team,
  onUpdateTeam,
  onExportBackup,
  onImportBackup,
  onResetDemoData,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onImportBackup(reader.result);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-athletic text-3xl sm:text-4xl font-bold text-[#111815] leading-none">
          Squadra &amp; Divise
        </h1>
        <p className="text-sm text-[#52605A] mt-1.5">
          Personalizza nome, stemma e colori delle maglie mostrati in campo e negli screenshot per
          WhatsApp.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Live Kit & Crest Preview */}
        <div className="lg:col-span-5 bg-white border border-[#E2E6E1] rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-4">
            <ClubCrestSvg team={team} size={64} />
            <div className="min-w-0">
              <div className="font-athletic text-3xl font-bold text-[#111815] truncate leading-none">
                {team.name || 'Nome Squadra'}
              </div>
              <div className="text-xs text-[#52605A] mt-1 truncate">
                {team.homeVenue || 'Campo di casa'} · {team.coachName || 'Allenatore'}
              </div>
            </div>
          </div>

          {/* Pitch Strip Kit Showcase */}
          <div
            className="rounded-xl p-6 flex items-center justify-around border border-[#194C2C]/30"
            style={{
              backgroundImage:
                'repeating-linear-gradient(180deg, #1E6B3A 0%, #1E6B3A 25%, #237641 25%, #237641 50%)',
            }}
          >
            <div className="flex flex-col items-center gap-2">
              <JerseySvg
                primaryColor={team.primaryColor}
                secondaryColor={team.secondaryColor}
                numberColor={team.numberColor}
                pattern={team.pattern}
                number={10}
                size={88}
                isCaptain
              />
              <span className="px-2.5 py-0.5 rounded bg-[#101A15]/90 text-white text-xs font-semibold">
                Giocatore
              </span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <JerseySvg
                primaryColor={team.gkColor}
                secondaryColor={team.gkSecondaryColor}
                numberColor={team.gkNumberColor}
                pattern={JerseyPattern.SOLID}
                number={1}
                size={88}
              />
              <span className="px-2.5 py-0.5 rounded bg-[#101A15]/90 text-white text-xs font-semibold">
                Portiere
              </span>
            </div>
          </div>

          {/* Curated Italian Club Kit Presets */}
          <div>
            <span className="block text-xs font-semibold text-[#111815] mb-2">
              Palette rapide
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2">
              {KIT_COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() =>
                    onUpdateTeam({
                      ...team,
                      primaryColor: preset.primary,
                      secondaryColor: preset.secondary,
                      numberColor: preset.number,
                    })
                  }
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#111815] bg-[#F7F8F6] hover:bg-[#EDF1EC] border border-[#E6EAE5] rounded-xl transition-colors cursor-pointer"
                >
                  <span className="flex items-center shrink-0">
                    <span
                      className="w-4 h-4 rounded-l-sm border border-black/15"
                      style={{ backgroundColor: preset.primary }}
                    />
                    <span
                      className="w-4 h-4 rounded-r-sm border-y border-r border-black/15"
                      style={{ backgroundColor: preset.secondary }}
                    />
                  </span>
                  <span className="truncate">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Club Details & Kit Controls */}
        <div className="lg:col-span-7 space-y-6">
          {/* Club Info */}
          <div className="bg-white border border-[#E2E6E1] rounded-2xl p-5 space-y-4">
            <h2 className="font-athletic text-2xl font-bold text-[#111815]">
              Identità Club
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#111815] mb-1.5">
                  Nome squadra
                </label>
                <input
                  type="text"
                  value={team.name}
                  onChange={(e) => onUpdateTeam({ ...team, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-[#F5F6F4] border border-[#DCE1DC] focus:border-[#15803D] focus:bg-white rounded-xl outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#111815] mb-1.5">
                  Sigla stemma (3 lett.)
                </label>
                <input
                  type="text"
                  maxLength={3}
                  value={team.shortName}
                  onChange={(e) =>
                    onUpdateTeam({ ...team, shortName: e.target.value.toUpperCase() })
                  }
                  className="w-full px-3.5 py-2.5 text-sm font-mono uppercase bg-[#F5F6F4] border border-[#DCE1DC] focus:border-[#15803D] focus:bg-white rounded-xl outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#111815] mb-1.5">
                  Campo di casa predefinito
                </label>
                <input
                  type="text"
                  value={team.homeVenue}
                  onChange={(e) => onUpdateTeam({ ...team, homeVenue: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-[#F5F6F4] border border-[#DCE1DC] focus:border-[#15803D] focus:bg-white rounded-xl outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#111815] mb-1.5">
                  Allenatore / Mister
                </label>
                <input
                  type="text"
                  value={team.coachName}
                  onChange={(e) => onUpdateTeam({ ...team, coachName: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-[#F5F6F4] border border-[#DCE1DC] focus:border-[#15803D] focus:bg-white rounded-xl outline-none"
                />
              </div>
            </div>
          </div>

          {/* Jersey Pattern & Colors */}
          <div className="bg-white border border-[#E2E6E1] rounded-2xl p-5 space-y-5">
            <h2 className="font-athletic text-2xl font-bold text-[#111815]">
              Stile Maglie
            </h2>

            <div>
              <span className="block text-xs font-semibold text-[#111815] mb-2">
                Fantasia divisa giocatori
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-[#F2F4F1] rounded-xl">
                {PATTERN_OPTIONS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onUpdateTeam({ ...team, pattern: p.id })}
                    className={`py-2 px-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                      team.pattern === p.id
                        ? 'bg-white text-[#111815] shadow-xs'
                        : 'text-[#52605A] hover:text-[#111815]'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
              <div className="space-y-3">
                <span className="block text-xs font-semibold text-[#52605A]">
                  Divisa Giocatori
                </span>
                <div className="flex items-center justify-between gap-3">
                  <label className="text-sm text-[#111815]">Colore principale</label>
                  <input
                    type="color"
                    value={team.primaryColor}
                    onChange={(e) => onUpdateTeam({ ...team, primaryColor: e.target.value })}
                    className="w-10 h-9 rounded-lg border border-[#DCE1DC] cursor-pointer"
                  />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <label className="text-sm text-[#111815]">Colore secondario</label>
                  <input
                    type="color"
                    value={team.secondaryColor}
                    onChange={(e) => onUpdateTeam({ ...team, secondaryColor: e.target.value })}
                    className="w-10 h-9 rounded-lg border border-[#DCE1DC] cursor-pointer"
                  />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <label className="text-sm text-[#111815]">Colore numero</label>
                  <input
                    type="color"
                    value={team.numberColor}
                    onChange={(e) => onUpdateTeam({ ...team, numberColor: e.target.value })}
                    className="w-10 h-9 rounded-lg border border-[#DCE1DC] cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-3 sm:pl-5 sm:border-l sm:border-[#ECEFEA]">
                <span className="block text-xs font-semibold text-[#52605A]">
                  Divisa Portiere
                </span>
                <div className="flex items-center justify-between gap-3">
                  <label className="text-sm text-[#111815]">Colore maglia</label>
                  <input
                    type="color"
                    value={team.gkColor}
                    onChange={(e) => onUpdateTeam({ ...team, gkColor: e.target.value })}
                    className="w-10 h-9 rounded-lg border border-[#DCE1DC] cursor-pointer"
                  />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <label className="text-sm text-[#111815]">Colletto / dettagli</label>
                  <input
                    type="color"
                    value={team.gkSecondaryColor}
                    onChange={(e) =>
                      onUpdateTeam({ ...team, gkSecondaryColor: e.target.value })
                    }
                    className="w-10 h-9 rounded-lg border border-[#DCE1DC] cursor-pointer"
                  />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <label className="text-sm text-[#111815]">Colore numero</label>
                  <input
                    type="color"
                    value={team.gkNumberColor}
                    onChange={(e) => onUpdateTeam({ ...team, gkNumberColor: e.target.value })}
                    className="w-10 h-9 rounded-lg border border-[#DCE1DC] cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Backup & Data Management */}
          <div className="bg-white border border-[#E2E6E1] rounded-2xl p-5 space-y-3">
            <h2 className="font-athletic text-2xl font-bold text-[#111815]">
              Backup Dati Squadra
            </h2>
            <p className="text-xs text-[#52605A] leading-relaxed">
              Rosa, divise e formazioni salvate restano memorizzate automaticamente su questo
              browser. Puoi esportare un file di backup per trasferirle su un altro smartphone o
              condividerle con il vice-allenatore.
            </p>
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={onExportBackup}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-[#111815] bg-[#F2F5F2] hover:bg-[#E5ECE6] rounded-xl transition-colors whitespace-nowrap cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Esporta backup JSON
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-[#111815] bg-[#F2F5F2] hover:bg-[#E5ECE6] rounded-xl transition-colors whitespace-nowrap cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                Importa backup JSON
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                onChange={handleFileChange}
                className="hidden"
              />

              {confirmReset ? (
                <div className="inline-flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onResetDemoData();
                      setConfirmReset(false);
                    }}
                    className="px-3 py-2 text-xs font-semibold bg-rose-600 text-white rounded-xl hover:bg-rose-700 cursor-pointer"
                  >
                    Conferma ripristino demo
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="px-2.5 py-2 text-xs font-medium text-[#52605A] cursor-pointer"
                  >
                    Annulla
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmReset(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50 rounded-xl transition-colors whitespace-nowrap cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Ripristina rosa demo
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
