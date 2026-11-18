import React, { useId } from 'react';
import { FormationDefinition, JerseyPattern, PlayerRole, TeamSettings } from '../types';

interface JerseySvgProps {
  primaryColor: string;
  secondaryColor: string;
  numberColor: string;
  pattern: JerseyPattern;
  number?: number | string;
  size?: number;
  isEmpty?: boolean;
  isCaptain?: boolean;
  className?: string;
}

export const JerseySvg: React.FC<JerseySvgProps> = ({
  primaryColor,
  secondaryColor,
  numberColor,
  pattern,
  number,
  size = 54,
  isEmpty = false,
  isCaptain = false,
  className = '',
}) => {
  const clipId = useId();
  const shirtPath =
    'M 36 10 Q 50 22 64 10 L 80 16 L 96 36 L 84 49 L 74 40 L 74 88 Q 50 92 26 88 L 26 40 L 16 49 L 4 36 L 20 16 Z';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={`select-none overflow-visible ${className}`}
      aria-hidden="true"
    >
      <defs>
        <clipPath id={clipId}>
          <path d={shirtPath} />
        </clipPath>
      </defs>

      {isEmpty ? (
        <g>
          <path
            d={shirtPath}
            fill="rgba(255,255,255,0.14)"
            stroke="rgba(255,255,255,0.72)"
            strokeWidth="2.6"
            strokeDasharray="6 4"
          />
          <path
            d="M 50 40 L 50 62 M 39 51 L 61 51"
            stroke="rgba(255,255,255,0.85)"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
        </g>
      ) : (
        <g>
          {/* Subtle grass shadow */}
          <ellipse cx="50" cy="92" rx="26" ry="5" fill="rgba(0,0,0,0.24)" />

          <g clipPath={`url(#${clipId})`}>
            <rect x="0" y="0" width="100" height="100" fill={primaryColor} />

            {pattern === JerseyPattern.STRIPES && (
              <>
                <rect x="27" y="0" width="9" height="100" fill={secondaryColor} />
                <rect x="45.5" y="0" width="9" height="100" fill={secondaryColor} />
                <rect x="64" y="0" width="9" height="100" fill={secondaryColor} />
              </>
            )}

            {pattern === JerseyPattern.HOOPS && (
              <>
                <rect x="0" y="34" width="100" height="11" fill={secondaryColor} />
                <rect x="0" y="57" width="100" height="11" fill={secondaryColor} />
              </>
            )}

            {pattern === JerseyPattern.SASH && (
              <polygon points="10,6 32,6 88,94 66,94" fill={secondaryColor} />
            )}

            {/* Collar trim */}
            <path
              d="M 35 10 Q 50 24 65 10"
              fill="none"
              stroke={secondaryColor}
              strokeWidth="5"
              strokeLinecap="round"
            />
          </g>

          {/* Outer contour */}
          <path d={shirtPath} fill="none" stroke="rgba(0,0,0,0.34)" strokeWidth="2.4" />

          {/* Number */}
          {number !== undefined && number !== '' && (
            <text
              x="50"
              y="62"
              textAnchor="middle"
              fill={numberColor}
              stroke="rgba(0,0,0,0.55)"
              strokeWidth="4.5"
              paintOrder="stroke"
              style={{
                fontFamily: '"Barlow Condensed", sans-serif',
                fontWeight: 800,
                fontSize: '32px',
              }}
            >
              {number}
            </text>
          )}

          {/* Captain Armband Badge */}
          {isCaptain && (
            <g transform="translate(80, 22)">
              <circle r="13" fill="#FACC15" stroke="#111815" strokeWidth="2.4" />
              <text
                x="0"
                y="5"
                textAnchor="middle"
                fill="#111815"
                style={{
                  fontFamily: '"Barlow Condensed", sans-serif',
                  fontWeight: 800,
                  fontSize: '17px',
                }}
              >
                C
              </text>
            </g>
          )}
        </g>
      )}
    </svg>
  );
};

interface ClubCrestSvgProps {
  team: TeamSettings;
  size?: number;
}

export const ClubCrestSvg: React.FC<ClubCrestSvgProps> = ({ team, size = 40 }) => {
  const clipId = useId();
  const shield =
    'M 50 6 L 88 20 L 82 60 Q 74 84 50 95 Q 26 84 18 60 L 12 20 Z';

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" className="shrink-0">
      <defs>
        <clipPath id={clipId}>
          <path d={shield} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <rect x="0" y="0" width="100" height="100" fill={team.primaryColor} />
        <polygon points="0,100 100,0 100,100" fill={team.secondaryColor} opacity="0.28" />
      </g>
      <path d={shield} fill="none" stroke={team.secondaryColor} strokeWidth="5" />
      <text
        x="50"
        y="58"
        textAnchor="middle"
        fill={team.numberColor}
        style={{
          fontFamily: '"Barlow Condensed", sans-serif',
          fontWeight: 800,
          fontSize: '30px',
          letterSpacing: '0.03em',
        }}
      >
        {(team.shortName || 'FC').slice(0, 3).toUpperCase()}
      </text>
    </svg>
  );
};

interface MiniPitchPreviewProps {
  formation: FormationDefinition;
  starters: Record<string, string>;
  team: TeamSettings;
}

export const MiniPitchPreview: React.FC<MiniPitchPreviewProps> = ({
  formation,
  starters,
  team,
}) => {
  return (
    <svg
      viewBox="0 0 160 210"
      className="w-full h-full rounded-lg border border-black/10"
      aria-label={`Anteprima modulo ${formation.name}`}
    >
      {/* Mown stripes */}
      {[0, 1, 2, 3, 4, 5, 6].map((idx) => (
        <rect
          key={idx}
          x="0"
          y={idx * 30}
          width="160"
          height="30"
          fill={idx % 2 === 0 ? '#1C6537' : '#22713F'}
        />
      ))}

      {/* Pitch lines */}
      <rect x="8" y="8" width="144" height="194" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.2" />
      <line x1="8" y1="105" x2="152" y2="105" stroke="rgba(255,255,255,0.45)" strokeWidth="1.2" />
      <circle cx="80" cy="105" r="18" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.2" />
      <rect x="44" y="8" width="72" height="26" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.2" />
      <rect x="44" y="176" width="72" height="26" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.2" />

      {/* Player markers */}
      {formation.slots.map((slot) => {
        const filled = Boolean(starters[slot.slotId]);
        const cx = 14 + (slot.x / 100) * 132;
        const cy = 14 + (slot.y / 100) * 182;
        const isGk = slot.role === PlayerRole.POR;
        const fill = !filled
          ? 'rgba(255,255,255,0.22)'
          : isGk
          ? team.gkColor
          : team.primaryColor;
        const stroke = !filled ? 'rgba(255,255,255,0.6)' : '#FFFFFF';
        return (
          <circle
            key={slot.slotId}
            cx={cx}
            cy={cy}
            r="7.5"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.8"
          />
        );
      })}
    </svg>
  );
};
