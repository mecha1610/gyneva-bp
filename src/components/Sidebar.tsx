'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/stores/useAppStore';
import styles from './Sidebar.module.css';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '/',
    label: 'Vue d\'ensemble',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    href: '/simulator',
    label: 'Simulateur',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="4" y1="6" x2="20" y2="6"/>
        <circle cx="8" cy="6" r="2" fill="currentColor" stroke="none"/>
        <line x1="4" y1="12" x2="20" y2="12"/>
        <circle cx="16" cy="12" r="2" fill="currentColor" stroke="none"/>
        <line x1="4" y1="18" x2="20" y2="18"/>
        <circle cx="10" cy="18" r="2" fill="currentColor" stroke="none"/>
      </svg>
    ),
  },
  {
    href: '/revenue',
    label: 'Revenus',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="12" width="4" height="9" rx="1"/>
        <rect x="10" y="7" width="4" height="14" rx="1"/>
        <rect x="17" y="3" width="4" height="18" rx="1"/>
      </svg>
    ),
  },
  {
    href: '/cashflow',
    label: 'Trésorerie',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 17C6 17 8 7 12 7C16 7 18 14 21 14"/>
        <path d="M3 21h18"/>
      </svg>
    ),
  },
  {
    href: '/team',
    label: 'Équipe',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="8" cy="7" r="3"/>
        <path d="M2 21v-1a6 6 0 0 1 12 0v1"/>
        <path d="M15 11a4 4 0 0 1 4 4v2"/>
        <circle cx="17" cy="7" r="3"/>
      </svg>
    ),
  },
  {
    href: '/risks',
    label: 'Risques',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <circle cx="12" cy="17" r="1" fill="currentColor" stroke="none"/>
      </svg>
    ),
  },
  {
    href: '/profit',
    label: 'Profit associés',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9"/>
        <path d="M12 7v10"/>
        <path d="M9.5 9.5a2.5 2.5 0 0 1 5 0c0 1.38-1.12 2.5-2.5 2.5S9.5 13.12 9.5 14.5a2.5 2.5 0 0 0 5 0"/>
      </svg>
    ),
  },
  {
    href: '/optimize',
    label: 'Optimisations',
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21h6"/>
        <path d="M12 3a7 7 0 0 1 3.6 13H8.4A7 7 0 0 1 12 3z"/>
        <line x1="12" y1="16" x2="12" y2="21"/>
      </svg>
    ),
  },
  {
    href: '/admin',
    label: 'Admin',
    adminOnly: true,
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
      </svg>
    ),
  },
];

interface Props {
  isAdmin?: boolean;
}

export default function Sidebar({ isAdmin = false }: Props) {
  const pathname = usePathname();
  const collapsed = useAppStore(s => s.sidebarCollapsed);
  const toggleSidebar = useAppStore(s => s.toggleSidebar);

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
      {/* Toggle button */}
      <button
        className={styles.toggleBtn}
        onClick={toggleSidebar}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? '▶' : '◀'}
      </button>

      {/* Logo */}
      <div className={styles.logo}>
        <div className={styles.logoDot} />
        <div className={styles.logoText}>
          <span className={styles.logoName}>GYNEVA</span>
          <span className={styles.logoSub}>Business Plan</span>
        </div>
      </div>

      {/* Nav */}
      <nav className={styles.nav}>
        {NAV_ITEMS.map(item => {
          if (item.adminOnly && !isAdmin) return null;
          const isActive = item.href === '/'
            ? pathname === '/'
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${isActive ? styles.active : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span className={styles.navLabel}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className={styles.footer}>
        <span>Analyse confidentielle · 2025</span>
      </div>
    </aside>
  );
}
