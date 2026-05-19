import { useLocation } from 'react-router-dom';
import MonthSelector from '../common/MonthSelector';
import YearSelector from '../common/YearSelector';
import Breadcrumb from '../common/Breadcrumb';
import ExportReport from '../common/ExportReport';
import useDashboardStore from '../../stores/useDashboardStore';

export default function Header({ onMenuClick }) {
  const location = useLocation();
  const { branchDetail } = useDashboardStore();

  const isAnnualPage = location.pathname === '/annual';

  const breadcrumbItems = (() => {
    if (location.pathname.startsWith('/branch/')) {
      const branchName = branchDetail?.summary?.branchName || branchDetail?.branch?.name || '分公司详情';
      return [{ label: branchName, path: location.pathname }];
    }
    if (location.pathname === '/admin') {
      return [{ label: '系统管理', path: '/admin' }];
    }
    if (isAnnualPage) {
      return [{ label: '年度看板', path: '/annual' }];
    }
    return [];
  })();

  return (
    <header className="sticky top-0 z-20 h-14 lg:h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700/50">
      <div className="flex items-center justify-between h-full px-3 lg:px-6">
        <div className="flex items-center gap-2 lg:gap-4 min-w-0 flex-1">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-1 -ml-1 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors shrink-0"
          >
            <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Breadcrumb items={breadcrumbItems} />
        </div>
        <div className="flex items-center gap-1.5 lg:gap-3 shrink-0 translate-y-[1px] lg:translate-y-0">
          {isAnnualPage ? <YearSelector /> : <MonthSelector />}
          <ExportReport isAnnualPage={isAnnualPage} />
        </div>
      </div>
    </header>
  );
}
