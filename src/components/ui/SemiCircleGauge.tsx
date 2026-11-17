'use client';

import React from 'react';

interface GaugeProps {
  score: number; // -100 a +100 ou -10 a +10
  min?: number;
  max?: number;
  size?: number; // Largura em px
  label?: string;
  subLabel?: string;
  showTicks?: boolean;
}

export const SemiCircleGauge: React.FC<GaugeProps> = ({
  score,
  min = -100,
  max = 100,
  size = 110,
  label,
  subLabel,
}) => {
  // Normalizar valor entre 0 e 180 graus
  const clamped = Math.max(min, Math.min(max, score));
  const normalized = (clamped - min) / (max - min); // 0 a 1
  const angle = 180 + normalized * 180; // 180deg (esquerda/vermelho) a 360deg (direita/verde)

  const radius = 40;
  const cx = 50;
  const cy = 50;

  // Ponta do ponteiro
  const needleLength = 32;
  const needleAngleRad = (angle * Math.PI) / 180;
  const nx = cx + needleLength * Math.cos(needleAngleRad);
  const ny = cy + needleLength * Math.sin(needleAngleRad);

  return (
    <div className="flex flex-col items-center justify-center select-none" style={{ width: size }}>
      <svg viewBox="0 0 100 60" className="w-full overflow-visible">
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FF4D5A" />
            <stop offset="50%" stopColor="#F3C65A" />
            <stop offset="100%" stopColor="#21D787" />
          </linearGradient>
        </defs>

        {/* Arco de fundo */}
        <path
          d={`M 10 50 A 40 40 0 0 1 90 50`}
          fill="none"
          stroke="#16253b"
          strokeWidth="7"
          strokeLinecap="round"
        />

        {/* Arco Colorido */}
        <path
          d={`M 10 50 A 40 40 0 0 1 90 50`}
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth="6"
          strokeLinecap="round"
          opacity="0.9"
        />

        {/* Linhas demarcadoras / ticks */}
        <line x1="50" y1="10" x2="50" y2="15" stroke="#8191A8" strokeWidth="1" />
        <line x1="22" y1="22" x2="26" y2="25" stroke="#8191A8" strokeWidth="1" />
        <line x1="78" y1="22" x2="74" y2="25" stroke="#8191A8" strokeWidth="1" />

        {/* Ponteiro */}
        <line
          x1={cx}
          y1={cy}
          x2={nx}
          y2={ny}
          stroke="#F0F4FA"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Centro do ponteiro */}
        <circle cx={cx} cy={cy} r="4" fill="#F3C65A" />
        <circle cx={cx} cy={cy} r="1.5" fill="#0C1626" />
      </svg>

      {label && (
        <span className="text-[10px] font-bold tracking-wider mt-0.5" style={{
          color: score > 15 ? '#21D787' : score < -15 ? '#FF4D5A' : '#F3C65A'
        }}>
          {label}
        </span>
      )}
      {subLabel && (
        <span className="text-[9px] font-mono text-[#8191A8] leading-none mt-0.5">
          {subLabel}
        </span>
      )}
    </div>
  );
};
