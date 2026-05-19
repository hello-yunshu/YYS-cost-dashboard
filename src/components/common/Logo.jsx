import { useId } from 'react';
import useThemeStore from '../../stores/useThemeStore';

export default function Logo({ className = 'w-8 h-8' }) {
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme);
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const isDark = resolvedTheme === 'dark';

  const startColor = isDark ? '#1d4ed8' : '#2563eb';
  const endColor = isDark ? '#38bdf8' : '#60a5fa';
  const shadowColor = isDark ? '#0f172a' : '#1e3a8a';
  const gradientId = `${id}-yun-bg`;
  const shadowId = `${id}-yun-shadow`;

  return (
    <div className={`${className} shrink-0`}>
      <svg className="w-full h-full block" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="云">
        <defs>
          <linearGradient id={gradientId} x1="10" y1="8" x2="54" y2="58" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor={startColor}/>
            <stop offset="1" stopColor={endColor}/>
          </linearGradient>
          <filter id={shadowId} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor={shadowColor} floodOpacity="0.24"/>
          </filter>
        </defs>
        <rect x="6" y="6" width="52" height="52" rx="15" fill={`url(#${gradientId})`}/>
        <text
          x="32"
          y="32"
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily="Microsoft YaHei UI, Microsoft YaHei, PingFang SC, Noto Sans SC, sans-serif"
          fontSize="34"
          fontWeight="800"
          fill="#ffffff"
          filter={`url(#${shadowId})`}
        >
          云
        </text>
      </svg>
    </div>
  );
}
