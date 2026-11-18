import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  Image as ImageIcon,
  MessageCircle,
  Share2,
  X,
} from 'lucide-react';
import { getFormationById } from '../data/formations';
import { ActiveLineup, ExportOptions, ExportTheme, Player, TeamSettings } from '../types';
import { generateLineupPngBlob } from '../utils/canvasExporter';
import { buildWhatsAppShareUrl, buildWhatsAppText } from '../utils/storage';

interface WhatsAppShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  lineup: ActiveLineup;
  players: Player[];
  team: TeamSettings;
  onNotify: (message: string) => void;
}

const THEME_OPTIONS: { id: ExportTheme; label: string }[] = [
  { id: 'stadium', label: 'Stadio Scuro' },
  { id: 'matchday', label: 'Giornata Chiara' },
  { id: 'classic', label: 'Lavagna Classica' },
];

export const WhatsAppShareModal: React.FC<WhatsAppShareModalProps> = ({
  isOpen,
  onClose,
  lineup,
  players,
  team,
  onNotify,
}) => {
  const [options, setOptions] = useState<ExportOptions>({
    theme: 'stadium',
    showBench: true,
    showMatchInfo: true,
    showNumbers: true,
    showCoach: true,
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pngBlob, setPngBlob] = useState<Blob | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  const formation = useMemo(() => getFormationById(lineup.formationId), [lineup.formationId]);
  const whatsappText = useMemo(
    () => buildWhatsAppText(lineup, players, team),
    [lineup, players, team]
  );
  const whatsappUrl = useMemo(() => buildWhatsAppShareUrl(whatsappText), [whatsappText]);

  const fileName = useMemo(() => {
    const slug = team.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    return `formazione-${slug || 'squadra'}-${formation.name}.png`;
  }, [team.name, formation.name]);

  const canNativeShareFile = useMemo(() => {
    if (typeof navigator === 'undefined' || !navigator.share || !navigator.canShare) {
      return false;
    }
    try {
      const dummy = new File([new Uint8Array([0])], 'test.png', { type: 'image/png' });
      return navigator.canShare({ files: [dummy] });
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setIsGenerating(true);

    generateLineupPngBlob(lineup, players, team, options)
      .then(({ blob, dataUrl }) => {
        if (!cancelled) {
          setPngBlob(blob);
          setPreviewUrl(dataUrl);
          setIsGenerating(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIsGenerating(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, lineup, players, team, options]);

  if (!isOpen) return null;

  const handleDownloadPng = () => {
    if (!previewUrl) return;
    const link = document.createElement('a');
    link.href = previewUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onNotify('Screenshot PNG scaricato sul dispositivo');
  };

  const handleCopyImage = async () => {
    if (!pngBlob) return;
    try {
      if (navigator.clipboard && 'ClipboardItem' in window) {
        const item = new ClipboardItem({ 'image/png': pngBlob });
        await navigator.clipboard.write([item]);
        setCopiedImage(true);
        onNotify('Immagine copiata: incollala con Ctrl+V / Cmd+V nella chat WhatsApp');
        setTimeout(() => setCopiedImage(false), 2600);
      } else {
        handleDownloadPng();
      }
    } catch {
      // Fallback gracefully to download if clipboard image write is blocked in iframe
      handleDownloadPng();
      onNotify('Screenshot scaricato: allegalo direttamente nella chat WhatsApp');
    }
  };

  const handleNativeShare = async () => {
    if (!pngBlob) return;
    try {
      const file = new File([pngBlob], fileName, { type: 'image/png' });
      await navigator.share({
        title: `${team.name} — Formazione ${formation.name}`,
        text: whatsappText,
        files: [file],
      });
    } catch {
      // User dismissed native share sheet
    }
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(whatsappText);
      setCopiedText(true);
      onNotify('Testo formazione copiato negli appunti');
      setTimeout(() => setCopiedText(false), 2200);
    } catch {
      onNotify('Impossibile copiare automaticamente il testo');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
    >
      <div className="w-full max-w-4xl max-h-[92vh] bg-white rounded-2xl border border-[#E2E6E1] shadow-xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-[#ECEFEA]">
          <div>
            <h2
              id="share-modal-title"
              className="font-athletic text-2xl sm:text-3xl font-bold text-[#111815] leading-none"
            >
              Screenshot Formazione &amp; WhatsApp
            </h2>
            <p className="text-xs text-[#52605A] mt-1">
              Grafica HD pronta per il gruppo squadra · 1080 × 1440 px
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi finestra condivisione"
            className="p-2 text-[#52605A] hover:text-[#111815] hover:bg-[#F2F5F2] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: High-Res Screenshot Preview */}
          <div className="lg:col-span-6 flex flex-col items-center">
            <div className="w-full max-w-[360px] aspect-[3/4] bg-[#13201A] rounded-xl overflow-hidden border border-[#E2E6E1] shadow-sm relative flex items-center justify-center">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt={`Anteprima screenshot formazione ${team.name} ${formation.name}`}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-white/75 text-xs">
                  <ImageIcon className="w-6 h-6" />
                  <span>Generazione screenshot...</span>
                </div>
              )}
              {isGenerating && previewUrl && (
                <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                  <span className="px-3 py-1.5 bg-[#111815] text-white text-xs font-medium rounded-lg">
                    Aggiornamento...
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Customization & WhatsApp Share Controls */}
          <div className="lg:col-span-6 flex flex-col justify-between gap-5">
            <div className="space-y-5">
              {/* Theme Switcher */}
              <div>
                <label className="block text-xs font-semibold text-[#111815] mb-2">
                  Stile grafica
                </label>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#F2F4F1] rounded-xl">
                  {THEME_OPTIONS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setOptions((prev) => ({ ...prev, theme: t.id }))}
                      className={`py-2 px-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                        options.theme === t.id
                          ? 'bg-white text-[#111815] shadow-xs'
                          : 'text-[#52605A] hover:text-[#111815]'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Graphic Toggles */}
              <div>
                <span className="block text-xs font-semibold text-[#111815] mb-2">
                  Elementi nello screenshot
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { key: 'showBench', label: 'Mostra panchina' },
                      { key: 'showMatchInfo', label: 'Dettagli partita' },
                      { key: 'showNumbers', label: 'Numeri di maglia' },
                      { key: 'showCoach', label: 'Nome allenatore' },
                    ] as const
                  ).map((item) => (
                    <label
                      key={item.key}
                      className="flex items-center gap-2.5 px-3 py-2.5 bg-[#F7F8F6] hover:bg-[#EFF2EE] rounded-lg text-xs font-medium text-[#111815] cursor-pointer select-none"
                    >
                      <input
                        type="checkbox"
                        checked={options[item.key]}
                        onChange={(e) =>
                          setOptions((prev) => ({ ...prev, [item.key]: e.target.checked }))
                        }
                        className="w-4 h-4 rounded accent-[#15803D]"
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Primary Export & WhatsApp Actions */}
              <div className="space-y-2.5">
                {canNativeShareFile && (
                  <button
                    type="button"
                    disabled={!pngBlob}
                    onClick={handleNativeShare}
                    className="w-full h-11 px-4 flex items-center justify-center gap-2 bg-[#16A34A] hover:bg-[#15803D] disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    <Share2 className="w-4 h-4" />
                    Invia Immagine su WhatsApp
                  </button>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    disabled={!previewUrl}
                    onClick={handleDownloadPng}
                    className="h-11 px-4 flex items-center justify-center gap-2 bg-[#15803D] hover:bg-[#166534] disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    Scarica PNG
                  </button>

                  <button
                    type="button"
                    disabled={!pngBlob}
                    onClick={handleCopyImage}
                    className="h-11 px-4 flex items-center justify-center gap-2 bg-[#111815] hover:bg-[#232F2A] disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors whitespace-nowrap cursor-pointer"
                  >
                    {copiedImage ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        Immagine copiata
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copia Immagine
                      </>
                    )}
                  </button>
                </div>

                {/* Direct WhatsApp Text Link (Safe Anchor Tag, Never window.open) */}
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-11 px-4 flex items-center justify-center gap-2 bg-[#EAF8EE] hover:bg-[#D7F3DF] text-[#115E31] border border-[#B7E6C5] text-sm font-semibold rounded-xl transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Apri WhatsApp con testo formazione
                  <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                </a>
                <p className="text-[11px] text-[#52605A] leading-relaxed">
                  Su WhatsApp Web o Desktop: clicca <strong>Copia Immagine</strong> (oppure{' '}
                  <strong>Scarica PNG</strong>) e incolla direttamente nella chat della squadra. Su
                  smartphone usa <strong>Invia Immagine su WhatsApp</strong> o allega il PNG
                  scaricato.
                </p>
              </div>
            </div>

            {/* Compact WhatsApp Text Preview */}
            <div className="pt-3 border-t border-[#ECEFEA]">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs font-semibold text-[#111815]">
                  Messaggio testuale WhatsApp
                </span>
                <button
                  type="button"
                  onClick={handleCopyText}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#15803D] hover:text-[#166534] cursor-pointer"
                >
                  {copiedText ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedText ? 'Copiato' : 'Copia testo'}
                </button>
              </div>
              <pre className="p-3 bg-[#F5F6F4] rounded-xl text-[11px] text-[#323E38] font-sans whitespace-pre-wrap max-h-32 overflow-y-auto roster-scroll leading-relaxed">
                {whatsappText}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
