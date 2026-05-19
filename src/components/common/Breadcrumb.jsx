import { Link } from 'react-router-dom';

export default function Breadcrumb({ items = [] }) {
  const defaultItems = [{ label: '首页', path: '/' }];
  const allItems = [...defaultItems, ...items];

  return (
    <nav className="flex items-center gap-1 text-sm overflow-hidden min-w-0 translate-y-[1px] lg:translate-y-0">
      {allItems.map((item, index) => {
        const isLast = index === allItems.length - 1;
        return (
          <span key={index} className="flex items-center gap-1 min-w-0">
            {index > 0 && (
              <svg className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            )}
            {isLast ? (
              <span className="text-slate-900 dark:text-slate-100 font-medium truncate">{item.label}</span>
            ) : (
              <Link
                to={item.path}
                className="text-slate-500 dark:text-slate-400 hover:text-brand-500 dark:hover:text-brand-400 transition-colors duration-200 shrink-0"
              >
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
