'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [menuOpen, setMenuOpen] = useState(false);

  // Sync theme with document element on mount & change
  useEffect(() => {
    const savedTheme = localStorage.getItem('qb_theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('qb_theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  const navItems = [
    {
      name: 'Dashboard',
      path: '/',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
      )
    },
    {
      name: 'Saved Bills',
      path: '/saved',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <line x1="10" y1="9" x2="8" y2="9" />
        </svg>
      )
    },
    {
      name: 'Clients',
      path: '/clients',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      )
    }
  ];

  return (
    <>
      {/* Global Header - Hidden during window.print() */}
      <header className="no-print header-nav">
        <div className="nav-container">
          <Link href="/" className="logo-brand">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-primary)' }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <line x1="10" y1="9" x2="8" y2="9" />
            </svg>
            <div className="logo-text">
              <span>QuoteBuilder</span>
              <span className="logo-badge">Pro</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="desktop-links">
            {navItems.map((item) => {
              const active = pathname === item.path;
              return (
                <Link key={item.path} href={item.path} className={`nav-link ${active ? 'active' : ''}`}>
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Controls bar */}
          <div className="nav-controls">
            <button onClick={toggleTheme} className="control-btn" aria-label="Toggle light/dark theme">
              {theme === 'dark' ? (
                // Sun Icon
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                </svg>
              ) : (
                // Moon Icon
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                </svg>
              )}
            </button>

            {/* Mobile Menu Toggle Button */}
            <button onClick={() => setMenuOpen(!menuOpen)} className="mobile-menu-toggle" aria-label="Toggle menu">
              {menuOpen ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="6" x2="20" y2="6" />
                  <line x1="4" y1="18" x2="20" y2="18" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {menuOpen && (
          <div className="mobile-drawer animate-fade-in">
            {navItems.map((item) => {
              const active = pathname === item.path;
              return (
                <Link key={item.path} href={item.path} className={`mobile-nav-link ${active ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="app-main-content">
        {children}
      </main>

      {/* Styles local to the AppShell */}
      <style jsx global>{`
        .header-nav {
          position: sticky;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: var(--glass-blur);
          -webkit-backdrop-filter: var(--glass-blur);
          border-bottom: 1px solid var(--border-color);
        }

        [data-theme="light"] .header-nav {
          background: rgba(241, 245, 249, 0.6);
        }

        .nav-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1.5rem;
          height: 4.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .logo-brand {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-weight: 700;
          font-size: 1.25rem;
        }

        .logo-text {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .logo-badge {
          font-size: 0.75rem;
          padding: 0.15rem 0.4rem;
          border-radius: 4px;
          background: var(--color-primary);
          color: white;
          font-weight: 800;
          text-transform: uppercase;
        }

        .desktop-links {
          display: none;
          align-items: center;
          gap: 1.5rem;
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.95rem;
          font-weight: 500;
          color: var(--text-muted);
          padding: 0.5rem 0.75rem;
          border-radius: var(--radius-sm);
          transition: all 0.2s ease;
        }

        .nav-link:hover {
          color: var(--text-main);
          background: rgba(255, 255, 255, 0.05);
        }

        [data-theme="light"] .nav-link:hover {
          background: rgba(15, 23, 42, 0.05);
        }

        .nav-link.active {
          color: var(--text-main);
          background: rgba(99, 102, 241, 0.12);
          border: 1px solid rgba(99, 102, 241, 0.2);
        }

        .nav-controls {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .control-btn {
          width: 2.5rem;
          height: 2.5rem;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          border: 1px solid var(--border-color);
          background: rgba(255, 255, 255, 0.02);
        }

        .control-btn:hover {
          color: var(--text-main);
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.15);
        }

        .mobile-menu-toggle {
          display: flex;
          width: 2.5rem;
          height: 2.5rem;
          border-radius: var(--radius-sm);
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          border: 1px solid var(--border-color);
          background: rgba(255, 255, 255, 0.02);
        }

        @media (min-width: 768px) {
          .desktop-links {
            display: flex;
          }
          .mobile-menu-toggle {
            display: none;
          }
        }

        .mobile-drawer {
          position: absolute;
          top: 4.5rem;
          left: 0;
          right: 0;
          background: var(--bg-app);
          border-bottom: 1px solid var(--border-color);
          padding: 1rem 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          box-shadow: var(--shadow-lg);
        }

        .mobile-nav-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          border-radius: var(--radius-md);
          font-weight: 500;
          color: var(--text-muted);
          transition: all 0.2s ease;
          border: 1px solid transparent;
        }

        .mobile-nav-link.active {
          color: var(--text-main);
          background: rgba(99, 102, 241, 0.12);
          border-color: rgba(99, 102, 241, 0.2);
        }

        .app-main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          padding: 1.5rem;
        }

        @media print {
          .header-nav, .mobile-drawer {
            display: none !important;
          }
          .app-main-content {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
          }
        }
      `}</style>
    </>
  );
}
