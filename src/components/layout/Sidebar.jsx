import { useState, useRef, useCallback, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import Logo from '../common/Logo';

const NAV_ITEMS = [
  { path: '/', label: '月度看板', icon: DashboardIcon },
  { path: '/annual', label: '年度看板', icon: AnnualIcon },
  { path: '/admin', label: '系统管理', icon: AdminIcon },
];

function DashboardIcon({ active }) {
  return (
    <svg className={clsx('w-5 h-5', active ? 'text-brand-500' : 'text-slate-500 dark:text-slate-400')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
    </svg>
  );
}

function AnnualIcon({ active }) {
  return (
    <svg className={clsx('w-5 h-5', active ? 'text-brand-500' : 'text-slate-500 dark:text-slate-400')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l4-8 4 4 5-6" />
    </svg>
  );
}

function AdminIcon({ active }) {
  return (
    <svg className={clsx('w-5 h-5', active ? 'text-brand-500' : 'text-slate-500 dark:text-slate-400')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

export default function Sidebar({ mobileOpen, onMobileToggle }) {
  const location = useLocation();
  const [easterEgg, setEasterEgg] = useState(false);
  const clickTimes = useRef([]);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const closeMobile = () => onMobileToggle?.(false);

  const handleVersionClick = useCallback(() => {
    const now = Date.now();
    clickTimes.current = clickTimes.current.filter((t) => now - t < 3000);
    clickTimes.current.push(now);
    if (clickTimes.current.length >= 5) {
      clickTimes.current = [];
      setEasterEgg(true);
    }
  }, []);

  useEffect(() => {
    if (!easterEgg) return;
    const timer = setTimeout(() => setEasterEgg(false), 4000);
    return () => clearTimeout(timer);
  }, [easterEgg]);

  return (
    <>
      <div className="hidden lg:flex lg:flex-col lg:w-60 lg:fixed lg:inset-y-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700/50 z-30">
        <div className="flex items-center h-16 px-5 border-b border-slate-200 dark:border-slate-700/50">
          <div className="flex items-center gap-2.5">
            <Logo className="w-5 h-5" />
            <span className="font-display font-semibold text-slate-900 dark:text-white text-[15px] tracking-tight">成本总表台账</span>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive(item.path)
                  ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
              )}
            >
              <item.icon active={isActive(item.path)} />
              {item.label}
              {isActive(item.path) && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-500" />
              )}
            </Link>
          ))}
        </nav>
        <div className="mt-auto px-3 pb-3 pt-4">
          <div
            className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/80 dark:from-slate-800/80 dark:to-slate-800/40 border border-slate-200/60 dark:border-slate-700/40 cursor-default select-none"
            onClick={handleVersionClick}
          >
            <div className="absolute top-0 right-0 w-16 h-16 bg-brand-500/[0.04] dark:bg-brand-400/[0.06] rounded-bl-[2rem]" />
            <div className="relative px-3.5 py-3 text-center">
              <div className="flex items-center justify-center gap-2 mb-1.5">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-brand-500/10 dark:bg-brand-400/15 text-[10px] font-mono font-semibold tracking-wide text-brand-600 dark:text-brand-400">
                  v2.2.0
                </span>
                <span className="w-1 h-1 rounded-full bg-slate-400 dark:bg-slate-600" />
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">成本总表</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">成本看板 - yunshu ver.</p>
            </div>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={closeMobile}>
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" />
        </div>
      )}

      <div className={clsx(
        'fixed inset-y-0 left-0 z-50 w-60 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700/50 transform transition-transform duration-300 lg:hidden flex flex-col',
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex items-center justify-between h-14 px-4 border-b border-slate-200 dark:border-slate-700/50">
          <div className="flex items-center gap-2.5">
            <Logo className="w-5 h-5" />
            <span className="font-display font-semibold text-slate-900 dark:text-white text-[15px]">成本总表台账</span>
          </div>
          <button onClick={closeMobile} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={closeMobile}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive(item.path)
                  ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              )}
            >
              <item.icon active={isActive(item.path)} />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-3 pb-3 pt-2">
          <div
            className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/80 dark:from-slate-800/80 dark:to-slate-800/40 border border-slate-200/60 dark:border-slate-700/40 cursor-default select-none"
            onClick={handleVersionClick}
          >
            <div className="absolute top-0 right-0 w-16 h-16 bg-brand-500/[0.04] dark:bg-brand-400/[0.06] rounded-bl-[2rem]" />
            <div className="relative px-3.5 py-3 text-center">
              <div className="flex items-center justify-center gap-2 mb-1.5">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-brand-500/10 dark:bg-brand-400/15 text-[10px] font-mono font-semibold tracking-wide text-brand-600 dark:text-brand-400">
                  v2.2.0
                </span>
                <span className="w-1 h-1 rounded-full bg-slate-400 dark:bg-slate-600" />
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">成本总表</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">成本看板 - yunshu ver.</p>
            </div>
          </div>
        </div>
      </div>

      {easterEgg && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setEasterEgg(false)}
        >
          <div className="relative text-center animate-easter-egg">
            <div className="absolute -inset-8 bg-gradient-to-r from-rose-500/20 via-amber-500/20 to-brand-500/20 blur-2xl rounded-full" />
            <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl px-12 py-10 border border-slate-200/50 dark:border-slate-700/50">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 tracking-widest">✦</p>
              <p className="text-2xl font-display font-semibold text-slate-800 dark:text-slate-100 tracking-wide">
                制作：云云舒
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 tracking-widest">✦</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
