import { useMemo } from 'react';
import useThemeStore from '../../stores/useThemeStore';
import { getBranchColor } from '../../utils/constants';

export default function CollectionChart({ data = [] }) {
  const { resolvedTheme } = useThemeStore();
  const isDark = resolvedTheme === 'dark';

  const items = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map((d) => {
      const rate = (d.collectionRate || 0) * 100;
      const color = getBranchColor(d.branchName);
      const circumference = 2 * Math.PI * 36;
      const dashOffset = circumference * (1 - Math.min(rate, 100) / 100);
      return {
        name: d.branchName,
        rate,
        color,
        circumference,
        dashOffset,
      };
    });
  }, [data]);

  if (items.length === 0) return null;

  return (
    <div className="grid grid-cols-4 gap-x-4 gap-y-3 h-full content-center">
      {items.map((item) => (
        <div key={item.name} className="flex flex-col items-center">
          <div className="relative w-[72px] h-[72px]">
            <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
              <circle
                cx="40"
                cy="40"
                r="36"
                fill="none"
                stroke={isDark ? '#334155' : '#cbd5e1'}
                strokeWidth="6"
              />
              <circle
                cx="40"
                cy="40"
                r="36"
                fill="none"
                stroke={item.color}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={item.circumference}
                strokeDashoffset={item.dashOffset}
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className="text-sm font-bold tabular-nums"
                style={{ color: isDark ? '#f1f5f9' : '#0f172a' }}
              >
                {item.rate.toFixed(1)}%
              </span>
            </div>
          </div>
          <span
            className="mt-1.5 text-xs text-center leading-tight max-w-[80px] truncate"
            style={{ color: isDark ? '#94a3b8' : '#64748b' }}
          >
            {item.name}
          </span>
        </div>
      ))}
    </div>
  );
}
