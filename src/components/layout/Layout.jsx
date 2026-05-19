import { useState, useCallback } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleMobile = useCallback((open) => {
    setMobileOpen(typeof open === 'boolean' ? open : (prev) => !prev);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 overflow-x-hidden">
      <Sidebar mobileOpen={mobileOpen} onMobileToggle={toggleMobile} />
      <div className="lg:pl-60">
        <Header onMenuClick={() => toggleMobile(true)} />
        <main className="p-3 lg:p-6 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
