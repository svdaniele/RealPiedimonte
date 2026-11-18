import { getFormationById } from '../data/formations';
import {
  ActiveLineup,
  ExportOptions,
  JerseyPattern,
  Player,
  PlayerRole,
  TeamSettings,
} from '../types';

const CANVAS_W = 1080;
const CANVAS_H = 1440;

interface ThemeTokens {
  outerBg: string;
  headerBg: string;
  headerText: string;
  headerSub: string;
  accentBar: string;
  pitchDark: string;
  pitchLight: string;
  pitchBorder: string;
  pitchLine: string;
  footerBg: string;
  footerText: string;
  footerSub: string;
  namePlateBg: string;
  namePlateText: string;
}

const THEMES: Record<ExportOptions['theme'], ThemeTokens> = {
  stadium: {
    outerBg: '#0E1713',
    headerBg: '#13201A',
    headerText: '#F8FAF8',
    headerSub: '#9CB3A6',
    accentBar: '#22C55E',
    pitchDark: '#1A5E34',
    pitchLight: '#1F6C3C',
    pitchBorder: 'rgba(255,255,255,0.22)',
    pitchLine: 'rgba(255,255,255,0.68)',
    footerBg: '#13201A',
    footerText: '#F3F7F4',
    footerSub: '#94ACA0',
    namePlateBg: 'rgba(12, 20, 16, 0.92)',
    namePlateText: '#FFFFFF',
  },
  matchday: {
    outerBg: '#F4F6F3',
    headerBg: '#FFFFFF',
    headerText: '#111815',
    headerSub: '#53625B',
    accentBar: '#15803D',
    pitchDark: '#1E6939',
    pitchLight: '#237541',
    pitchBorder: '#D5DDD7',
    pitchLine: 'rgba(255,255,255,0.78)',
    footerBg: '#FFFFFF',
    footerText: '#111815',
    footerSub: '#53625B',
    namePlateBg: 'rgba(17, 24, 21, 0.92)',
    namePlateText: '#FFFFFF',
  },
  classic: {
    outerBg: '#153E26',
    headerBg: '#10311E',
    headerText: '#F8FAF8',
    headerSub: '#B4D1BE',
    accentBar: '#FACC15',
    pitchDark: '#1C6236',
    pitchLight: '#226F3F',
    pitchBorder: 'rgba(255,255,255,0.28)',
    pitchLine: 'rgba(255,255,255,0.78)',
    footerBg: '#10311E',
    footerText: '#F8FAF8',
    footerSub: '#B4D1BE',
    namePlateBg: 'rgba(16, 49, 30, 0.94)',
    namePlateText: '#FFFFFF',
  },
};

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawClubShield(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  team: TeamSettings
) {
  ctx.save();
  ctx.translate(cx, cy);
  const w = size;
  const h = size * 1.14;

  const shieldPath = () => {
    ctx.beginPath();
    ctx.moveTo(0, -h / 2);
    ctx.lineTo(w / 2, -h * 0.34);
    ctx.lineTo(w * 0.44, h * 0.14);
    ctx.quadraticCurveTo(w * 0.34, h * 0.42, 0, h / 2);
    ctx.quadraticCurveTo(-w * 0.34, h * 0.42, -w * 0.44, h * 0.14);
    ctx.lineTo(-w / 2, -h * 0.34);
    ctx.closePath();
  };

  // Clip interior
  shieldPath();
  ctx.save();
  ctx.clip();

  ctx.fillStyle = team.primaryColor;
  ctx.fillRect(-w, -h, w * 2, h * 2);

  // Diagonal secondary half
  ctx.fillStyle = team.secondaryColor;
  ctx.globalAlpha = 0.28;
  ctx.beginPath();
  ctx.moveTo(-w / 2, h / 2);
  ctx.lineTo(w / 2, -h / 2);
  ctx.lineTo(w / 2, h / 2);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();

  // Outer trim
  shieldPath();
  ctx.lineWidth = 4;
  ctx.strokeStyle = team.secondaryColor;
  ctx.stroke();

  // Initials
  ctx.fillStyle = team.numberColor;
  ctx.font = `800 ${Math.round(size * 0.36)}px "Barlow Condensed", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText((team.shortName || 'FC').slice(0, 3).toUpperCase(), 0, 2);

  ctx.restore();
}

function drawJerseyOnCanvas(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  scale: number,
  primary: string,
  secondary: string,
  numberColor: string,
  pattern: JerseyPattern,
  numberText: string,
  showNumber: boolean,
  isCaptain: boolean,
  isEmpty: boolean
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  // Soft drop shadow on grass
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath();
  ctx.ellipse(0, 39, 26, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Shirt outline path centered at (0,0), roughly 84x76 units
  const traceShirt = () => {
    ctx.beginPath();
    ctx.moveTo(-13, -34);
    ctx.quadraticCurveTo(0, -24, 13, -34); // collar curve
    ctx.lineTo(27, -29);
    ctx.lineTo(42, -9);
    ctx.lineTo(31, 4);
    ctx.lineTo(23, -4);
    ctx.lineTo(23, 35);
    ctx.quadraticCurveTo(0, 38, -23, 35);
    ctx.lineTo(-23, -4);
    ctx.lineTo(-31, 4);
    ctx.lineTo(-42, -9);
    ctx.lineTo(-27, -29);
    ctx.closePath();
  };

  if (isEmpty) {
    traceShirt();
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = 'rgba(255,255,255,0.65)';
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    return;
  }

  // Fill + clip shirt pattern
  ctx.save();
  traceShirt();
  ctx.clip();

  ctx.fillStyle = primary;
  ctx.fillRect(-50, -40, 100, 90);

  if (pattern === JerseyPattern.STRIPES) {
    ctx.fillStyle = secondary;
    const stripePositions = [-21, -5, 11];
    for (const sx of stripePositions) {
      ctx.fillRect(sx, -40, 8, 90);
    }
  } else if (pattern === JerseyPattern.HOOPS) {
    ctx.fillStyle = secondary;
    ctx.fillRect(-50, -14, 100, 10);
    ctx.fillRect(-50, 8, 100, 10);
  } else if (pattern === JerseyPattern.SASH) {
    ctx.fillStyle = secondary;
    ctx.beginPath();
    ctx.moveTo(-36, -34);
    ctx.lineTo(-14, -34);
    ctx.lineTo(36, 38);
    ctx.lineTo(14, 38);
    ctx.closePath();
    ctx.fill();
  }

  // Sleeve cuffs & subtle shoulder highlight
  ctx.fillStyle = secondary;
  ctx.globalAlpha = 0.9;
  ctx.fillRect(-45, -13, 18, 4);
  ctx.fillRect(27, -13, 18, 4);
  ctx.globalAlpha = 1;

  // Collar trim
  ctx.beginPath();
  ctx.moveTo(-14, -34);
  ctx.quadraticCurveTo(0, -21, 14, -34);
  ctx.lineWidth = 5;
  ctx.strokeStyle = secondary;
  ctx.stroke();

  ctx.restore();

  // Crisp outer contour
  traceShirt();
  ctx.lineWidth = 2.2;
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.stroke();

  // Shirt Number
  if (showNumber && numberText) {
    ctx.save();
    ctx.font = '800 31px "Barlow Condensed", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Subtle readability outline when stripes cross behind number
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.52)';
    ctx.strokeText(numberText, 0, 6);
    ctx.fillStyle = numberColor;
    ctx.fillText(numberText, 0, 6);
    ctx.restore();
  }

  // Captain Armband Badge
  if (isCaptain) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(28, -22, 13, 0, Math.PI * 2);
    ctx.fillStyle = '#FACC15';
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#111815';
    ctx.stroke();
    ctx.fillStyle = '#111815';
    ctx.font = '800 17px "Barlow Condensed", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('C', 28, -21);
    ctx.restore();
  }

  ctx.restore();
}

function drawPitchMarkings(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  pw: number,
  ph: number,
  tokens: ThemeTokens
) {
  ctx.save();
  drawRoundedRect(ctx, px, py, pw, ph, 22);
  ctx.clip();

  // Alternating horizontal mown grass stripes
  const stripeCount = 12;
  const stripeH = ph / stripeCount;
  for (let i = 0; i < stripeCount; i++) {
    ctx.fillStyle = i % 2 === 0 ? tokens.pitchDark : tokens.pitchLight;
    ctx.fillRect(px, py + i * stripeH, pw, stripeH + 1);
  }

  // Subtle top/bottom stadium light vignette
  const grad = ctx.createRadialGradient(
    px + pw / 2,
    py + ph * 0.45,
    pw * 0.1,
    px + pw / 2,
    py + ph * 0.5,
    ph * 0.72
  );
  grad.addColorStop(0, 'rgba(255,255,255,0.06)');
  grad.addColorStop(1, 'rgba(0,0,0,0.18)');
  ctx.fillStyle = grad;
  ctx.fillRect(px, py, pw, ph);

  // Field lines
  const m = 28; // inner pitch margin
  const fx = px + m;
  const fy = py + m;
  const fw = pw - m * 2;
  const fh = ph - m * 2;

  ctx.strokeStyle = tokens.pitchLine;
  ctx.lineWidth = 3;

  // Outer touchline
  ctx.strokeRect(fx, fy, fw, fh);

  // Halfway line
  ctx.beginPath();
  ctx.moveTo(fx, fy + fh / 2);
  ctx.lineTo(fx + fw, fy + fh / 2);
  ctx.stroke();

  // Center circle & spot
  ctx.beginPath();
  ctx.arc(fx + fw / 2, fy + fh / 2, fw * 0.135, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = tokens.pitchLine;
  ctx.beginPath();
  ctx.arc(fx + fw / 2, fy + fh / 2, 5, 0, Math.PI * 2);
  ctx.fill();

  // Top Penalty Area (Attack)
  const penW = fw * 0.56;
  const penH = fh * 0.155;
  const goalW = fw * 0.26;
  const goalH = fh * 0.055;

  ctx.strokeRect(fx + (fw - penW) / 2, fy, penW, penH);
  ctx.strokeRect(fx + (fw - goalW) / 2, fy, goalW, goalH);
  ctx.beginPath();
  ctx.arc(fx + fw / 2, fy + penH - fw * 0.02, fw * 0.11, 0.18 * Math.PI, 0.82 * Math.PI);
  ctx.stroke();

  // Bottom Penalty Area (Defense / GK)
  ctx.strokeRect(fx + (fw - penW) / 2, fy + fh - penH, penW, penH);
  ctx.strokeRect(fx + (fw - goalW) / 2, fy + fh - goalH, goalW, goalH);
  ctx.beginPath();
  ctx.arc(fx + fw / 2, fy + fh - penH + fw * 0.02, fw * 0.11, 1.18 * Math.PI, 1.82 * Math.PI);
  ctx.stroke();

  // Corner arcs
  const cr = 18;
  ctx.beginPath();
  ctx.arc(fx, fy, cr, 0, Math.PI * 0.5);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(fx + fw, fy, cr, Math.PI * 0.5, Math.PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(fx + fw, fy + fh, cr, Math.PI, Math.PI * 1.5);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(fx, fy + fh, cr, Math.PI * 1.5, Math.PI * 2);
  ctx.stroke();

  ctx.restore();

  // Outer pitch border stroke
  drawRoundedRect(ctx, px, py, pw, ph, 22);
  ctx.lineWidth = 2;
  ctx.strokeStyle = tokens.pitchBorder;
  ctx.stroke();
}

export async function renderLineupToCanvas(
  lineup: ActiveLineup,
  players: Player[],
  team: TeamSettings,
  options: ExportOptions
): Promise<HTMLCanvasElement> {
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }

  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D non disponibile');

  const tokens = THEMES[options.theme];
  const formation = getFormationById(lineup.formationId);
  const playerMap = new Map(players.map((p) => [p.id, p]));

  // 1. Background canvas
  ctx.fillStyle = tokens.outerBg;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // 2. Top Header Band
  const headerH = options.showMatchInfo ? 196 : 156;
  ctx.fillStyle = tokens.headerBg;
  ctx.fillRect(0, 0, CANVAS_W, headerH);

  // Subtle top accent stripe
  ctx.fillStyle = tokens.accentBar;
  ctx.fillRect(0, 0, CANVAS_W, 8);

  // Club shield on left
  drawClubShield(ctx, 96, headerH / 2 + 4, 86, team);

  // Team Name
  ctx.fillStyle = tokens.headerText;
  ctx.font = '800 54px "Barlow Condensed", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  const titleY = options.showMatchInfo ? 88 : 98;
  ctx.fillText(team.name.toUpperCase(), 164, titleY, 640);

  // Match Info Sub-line
  if (options.showMatchInfo) {
    const infoSegments: string[] = [];
    if (lineup.matchInfo.opponent.trim()) {
      infoSegments.push(`vs ${lineup.matchInfo.opponent.trim()}`);
    }
    if (lineup.matchInfo.dateLabel.trim()) {
      infoSegments.push(lineup.matchInfo.dateLabel.trim());
    }
    if (lineup.matchInfo.kickoffTime.trim()) {
      infoSegments.push(lineup.matchInfo.kickoffTime.trim());
    }
    const line1 = infoSegments.join('  ·  ') || 'Formazione Ufficiale';
    ctx.fillStyle = tokens.headerSub;
    ctx.font = '600 24px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(line1, 164, 128, 650);

    if (lineup.matchInfo.venue.trim()) {
      ctx.fillStyle = tokens.headerSub;
      ctx.globalAlpha = 0.85;
      ctx.font = '500 20px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(lineup.matchInfo.venue.trim(), 164, 162, 650);
      ctx.globalAlpha = 1;
    }
  } else {
    ctx.fillStyle = tokens.headerSub;
    ctx.font = '600 24px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`Calcio a ${lineup.format}  ·  Distinta Titolari`, 164, 134, 640);
  }

  // Right-aligned Formation Block
  ctx.textAlign = 'right';
  ctx.fillStyle = tokens.headerSub;
  ctx.font = '600 18px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`MODULO · A ${lineup.format}`, CANVAS_W - 52, 66);

  ctx.fillStyle = tokens.headerText;
  ctx.font = '800 66px "Barlow Condensed", sans-serif';
  ctx.fillText(formation.name, CANVAS_W - 52, 136);
  ctx.textAlign = 'left';

  // 3. Footer height calculation
  const benchPlayers = lineup.bench
    .map((id) => playerMap.get(id))
    .filter((p): p is Player => Boolean(p));

  const hasBenchFooter = options.showBench && benchPlayers.length > 0;
  const hasCoachOrNotes =
    (options.showCoach && team.coachName.trim().length > 0) ||
    (options.showMatchInfo && lineup.matchInfo.notes.trim().length > 0);

  const footerH = hasBenchFooter ? 210 : hasCoachOrNotes ? 112 : 52;

  // 4. Pitch Geometry
  const padX = 44;
  const padTop = headerH + 28;
  const pitchW = CANVAS_W - padX * 2;
  const pitchH = CANVAS_H - padTop - footerH - 28;

  drawPitchMarkings(ctx, padX, padTop, pitchW, pitchH, tokens);

  // 5. Render Formation Slots & Jerseys
  const innerM = 36;
  const usableW = pitchW - innerM * 2;
  const usableH = pitchH - innerM * 2;
  const jerseyScale = lineup.format === '11' ? 1.12 : 1.24;

  for (const slot of formation.slots) {
    const playerId = lineup.starters[slot.slotId];
    const player = playerId ? playerMap.get(playerId) : undefined;
    const isGk = slot.role === PlayerRole.POR;

    const sx = padX + innerM + (slot.x / 100) * usableW;
    const sy = padTop + innerM + (slot.y / 100) * usableH - 14;

    drawJerseyOnCanvas(
      ctx,
      sx,
      sy,
      jerseyScale,
      isGk ? team.gkColor : team.primaryColor,
      isGk ? team.gkSecondaryColor : team.secondaryColor,
      isGk ? team.gkNumberColor : team.numberColor,
      isGk ? JerseyPattern.SOLID : team.pattern,
      player ? String(player.number) : '',
      options.showNumbers,
      Boolean(player && lineup.captainId === player.id),
      !player
    );

    // Nameplate below jersey
    const displayName = player ? player.shirtName : slot.label;
    ctx.font = '700 22px "Plus Jakarta Sans", sans-serif';
    const textW = ctx.measureText(displayName).width;
    const plateW = Math.min(Math.max(textW + 30, 108), 184);
    const plateH = 38;
    const plateX = sx - plateW / 2;
    const plateY = sy + 44 * jerseyScale;

    drawRoundedRect(ctx, plateX, plateY, plateW, plateH, 8);
    ctx.fillStyle = player ? tokens.namePlateBg : 'rgba(15, 25, 19, 0.58)';
    ctx.fill();

    // Name text
    ctx.fillStyle = player ? tokens.namePlateText : 'rgba(255,255,255,0.75)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(displayName, sx, plateY + plateH / 2 + 1, plateW - 18);
  }

  // 6. Footer Band (Bench + Coach / Notes)
  const footerY = CANVAS_H - footerH;
  ctx.fillStyle = tokens.footerBg;
  ctx.fillRect(0, footerY, CANVAS_W, footerH);

  // Subtle divider line
  ctx.fillStyle = tokens.pitchBorder;
  ctx.fillRect(0, footerY, CANVAS_W, 2);

  let cursorY = footerY + 42;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  if (hasBenchFooter) {
    ctx.fillStyle = tokens.footerSub;
    ctx.font = '700 18px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`A DISPOSIZIONE (${benchPlayers.length})`, 52, cursorY);

    cursorY += 38;
    ctx.fillStyle = tokens.footerText;
    ctx.font = '600 24px "Plus Jakarta Sans", sans-serif';

    // Wrap bench text neatly across up to 2 lines
    const benchTokens = benchPlayers.map((p) =>
      options.showNumbers ? `${p.number} ${p.shirtName}` : p.shirtName
    );
    const maxLineW = CANVAS_W - 104;
    const benchLines: string[] = [];
    let currentLine = '';

    for (const token of benchTokens) {
      const candidate = currentLine ? `${currentLine}   ·   ${token}` : token;
      if (ctx.measureText(candidate).width > maxLineW && currentLine) {
        benchLines.push(currentLine);
        currentLine = token;
      } else {
        currentLine = candidate;
      }
    }
    if (currentLine) benchLines.push(currentLine);

    benchLines.slice(0, 2).forEach((line, idx) => {
      ctx.fillText(line, 52, cursorY + idx * 34, maxLineW);
    });
    cursorY += Math.min(benchLines.length, 2) * 34 + 22;
  }

  // Bottom metadata row (Coach + Notes)
  const bottomY = CANVAS_H - 34;
  ctx.font = '500 20px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = tokens.footerSub;
  if (options.showCoach && team.coachName.trim()) {
    ctx.fillText(`All. ${team.coachName.trim()}`, 52, bottomY, 340);
  }
  if (options.showMatchInfo && lineup.matchInfo.notes.trim()) {
    ctx.textAlign = 'right';
    ctx.fillText(lineup.matchInfo.notes.trim(), CANVAS_W - 52, bottomY, 620);
    ctx.textAlign = 'left';
  }

  return canvas;
}

export async function generateLineupPngBlob(
  lineup: ActiveLineup,
  players: Player[],
  team: TeamSettings,
  options: ExportOptions
): Promise<{ blob: Blob; dataUrl: string }> {
  const canvas = await renderLineupToCanvas(lineup, players, team, options);
  const dataUrl = canvas.toDataURL('image/png');
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => {
      if (b) resolve(b);
      else reject(new Error('Impossibile generare immagine PNG'));
    }, 'image/png');
  });
  return { blob, dataUrl };
}
