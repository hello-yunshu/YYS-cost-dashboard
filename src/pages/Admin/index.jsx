import { useState } from 'react';
import clsx from 'clsx';
import DataImport from './DataImport';
import ImportHistory from './ImportHistory';
import MonthManage from './MonthManage';
import Settings from './Settings';

function ImportIcon({ active }) {
  return (
    <svg className={clsx('w-4 h-4', active ? 'text-brand-500' : 'text-slate-500 dark:text-slate-400')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  );
}

function HistoryIcon({ active }) {
  return (
    <svg className={clsx('w-4 h-4', active ? 'text-brand-500' : 'text-slate-500 dark:text-slate-400')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function MonthIcon({ active }) {
  return (
    <svg className={clsx('w-4 h-4', active ? 'text-brand-500' : 'text-slate-500 dark:text-slate-400')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function SettingsIcon({ active }) {
  return (
    <svg className={clsx('w-4 h-4', active ? 'text-brand-500' : 'text-slate-500 dark:text-slate-400')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

const TABS = [
  { key: 'import', label: '数据导入', icon: ImportIcon },
  { key: 'history', label: '导入历史', icon: HistoryIcon },
  { key: 'months', label: '月份管理', icon: MonthIcon },
  { key: 'settings', label: '系统设置', icon: SettingsIcon },
];

export default function Admin() {
  const [activeTab, setActiveTab] = useState('import');

  const renderContent = () => {
    switch (activeTab) {
      case 'import': return <DataImport />;
      case 'history': return <ImportHistory />;
      case 'months': return <MonthManage />;
      case 'settings': return <Settings />;
      default: return <DataImport />;
    }
  };

  return (
    <div className="space-y-4 lg:space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-lg lg:text-xl font-display font-bold text-slate-900 dark:text-white">系统管理</h1>
        <p className="text-xs lg:text-sm text-slate-500 dark:text-slate-400 mt-0.5 lg:mt-1">数据导入与系统配置</p>
      </div>

      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl max-w-full overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-2 lg:px-4 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap',
              activeTab === tab.key
                ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            )}
          >
            <tab.icon active={activeTab === tab.key} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="animate-fade-in">
        {renderContent()}
      </div>
    </div>
  );
}
