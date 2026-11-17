'use client';

import React from 'react';

interface CircularIndicatorProps {
  percent: number; // 0 a 100
  size?: number;
  strokeWidth?: number;
  color?: string;
  textColor?: string;
  label?: string;
}

export const CircularProgressIndicator: React.FC<CircularIndicatorProps> = ({
  percent,
  size = 54,
  strokeWidth = 4,
  color = '#21D787',
  textColor = '#F0F4FA',
  label,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center select-none" style={{ width: size, height: size }}>
      <svg className="w-full h-full -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#16253b"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="font-mono text-xs font-bold leading-tight" style={{ color: textColor }}>
          {percent}%
        </span>
        {label && <span className="text-[8px] text-[#8191A8] uppercase">{label}</span>}
      </div>
    </div>
  );
};
