import React, { useState, useEffect, useRef } from 'react';
import { HashRouter, Navigate, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Icon } from '@/components/shared/Icon';
import { mdiMenu, mdiChevronDown, mdiAccount } from '@/icons/mdi';
import RolesListPage from '@/pages/user-management/RolesListPage';
import PeopleListPage from '@/pages/user-management/PeopleListPage';
import OrgScopePage from '@/pages/user-management/OrgScopePage';
import PersonDetailPage from '@/pages/user-management/PersonDetailPage';
import NotificationPreferencesPage from '@/pages/user-management/NotificationPreferencesPage';
import LocationAttributesPage from '@/pages/user-management/LocationAttributesPage';
import LocationTagManagementPage from '@/pages/user-management/LocationTagManagementPage';
import DistributionPage from '@/pages/user-management/DistributionPage';
import OrgHierarchyImportPage from '@/pages/user-management/OrgHierarchyImportPage';
import LicenseAssignmentPage from '@/pages/user-management/LicenseAssignmentPage';
import PdfSearchPage from '@/pages/mobile/operate/PdfSearchPage';
import ListCompletionPage from '@/pages/operate/ListCompletionPage';

// ── Logged-in user (prototype stub) ─────────────────────────────────────────────
const CURRENT_USER_ID = 'p16';
const CURRENT_USER_NAME = 'Ben Caldwell';

// ── Page title map ────────────────────────────────────────────────────────────
const PAGE_TITLES: Record<string, string> = {
  '/admin/people':              'People',
  '/admin/roles':               'Roles',
  '/admin/location-tags':       'Location Tag Management',
  '/admin/org':                 'Org Hierarchy',
  '/admin/licenses':            'License Assignment',
  '/admin/distribution':        'Distribution',
  '/admin/org-import':          'Org Hierarchy Import',
  '/operate/lists':             'List Completion',
  '/mobile/operate/pdf-search': 'PDF Search — Operate',
};

function usePageTitle() {
  const location = useLocation();
  // Match longest prefix
  const match = Object.keys(PAGE_TITLES)
    .filter(k => location.pathname.startsWith(k))
    .sort((a, b) => b.length - a.length)[0];
  return match ? PAGE_TITLES[match] : '';
}

// ── Placeholder pages ─────────────────────────────────────────────────────────
function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="py-16 text-center">
      <p className="text-sm font-semibold" style={{ color: '#9BA0B0' }}>{title}</p>
      <p className="mt-1 text-xs" style={{ color: '#CCCDD0' }}>Coming soon</p>
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function ChevronIcon({ open }: { open: boolean }) {
  return (
    <span style={{ display: 'inline-flex', transition: 'transform 0.2s ease', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}>
      <Icon path={mdiChevronDown} size={13} />
    </span>
  );
}

// ── Nav drawer item ───────────────────────────────────────────────────────────
function DrawerNavItem({ to, label, end, onNavigate }: { to: string; label: string; end?: boolean; onNavigate: () => void }) {
  return (
    <NavLink to={to} end={end} onClick={onNavigate}
      className="block rounded px-3 py-2 text-sm transition-colors"
      style={({ isActive }) => ({
        backgroundColor: isActive ? '#5CA6D9' : 'transparent',
        color: isActive ? '#ffffff' : '#757677',
        fontWeight: isActive ? 600 : 400,
      })}
      onMouseEnter={e => { if (e.currentTarget.style.color !== 'rgb(255, 255, 255)') e.currentTarget.style.backgroundColor = '#F7F7FA'; }}
      onMouseLeave={e => { if (e.currentTarget.style.color !== 'rgb(255, 255, 255)') e.currentTarget.style.backgroundColor = 'transparent'; }}
    >
      {label}
    </NavLink>
  );
}

// ── Shell ─────────────────────────────────────────────────────────────────────
function Shell({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(true);
  const [operateOpen, setOperateOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const avatarButtonRef = useRef<HTMLButtonElement>(null);
  const pageTitle = usePageTitle();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobilePage = location.pathname.startsWith('/mobile/');

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (drawerOpen && drawerRef.current && !drawerRef.current.contains(target) &&
          hamburgerRef.current && !hamburgerRef.current.contains(target)) {
        setDrawerOpen(false);
      }
      if (avatarOpen && avatarRef.current && !avatarRef.current.contains(target) &&
          avatarButtonRef.current && !avatarButtonRef.current.contains(target)) {
        setAvatarOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [drawerOpen, avatarOpen]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) { if (e.key === 'Escape') setDrawerOpen(false); }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7F7FA', color: '#35353B' }}>

      {/* ── Top bar / floating hamburger ── */}
      {isMobilePage ? (
        <button ref={hamburgerRef} onClick={() => setDrawerOpen(v => !v)}
          className="flex items-center justify-center rounded-lg transition-colors"
          style={{
            position: 'fixed',
            top: 8, left: 8,
            width: 36, height: 36,
            color: drawerOpen ? '#5CA6D9' : '#9BA0B0',
            backgroundColor: drawerOpen ? '#E9F6FF' : 'rgba(255,255,255,0.9)',
            border: '1px solid #CCCDD0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            cursor: 'pointer',
            zIndex: 35,
          }}
          onMouseEnter={e => { if (!drawerOpen) e.currentTarget.style.backgroundColor = '#F7F7FA'; }}
          onMouseLeave={e => { if (!drawerOpen) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.9)'; }}
          aria-label="Toggle navigation" aria-expanded={drawerOpen}>
          <Icon path={mdiMenu} size={18} />
        </button>
      ) : (
        <header className="sticky top-0 z-30 flex items-center gap-3 bg-white px-4"
          style={{ borderBottom: '1px solid #CCCDD0', height: 52 }}>

          {/* Hamburger */}
          <button ref={hamburgerRef} onClick={() => setDrawerOpen(v => !v)}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-colors"
            style={{ color: drawerOpen ? '#5CA6D9' : '#9BA0B0', backgroundColor: drawerOpen ? '#E9F6FF' : 'transparent', border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => { if (!drawerOpen) e.currentTarget.style.backgroundColor = '#F7F7FA'; }}
            onMouseLeave={e => { if (!drawerOpen) e.currentTarget.style.backgroundColor = 'transparent'; }}
            aria-label="Toggle navigation" aria-expanded={drawerOpen}>
            <Icon path={mdiMenu} size={18} />
          </button>

          {/* Logo + app name */}
          <div className="flex items-center gap-2.5">
            <img src="/smartsense-logo.svg" alt="SmartSense ONE" className="h-7 w-7 flex-shrink-0" />
            <span className="text-sm font-semibold" style={{ color: '#35353B', lineHeight: 1 }}>
              SmartSense ONE
            </span>
          </div>

          {/* Separator + page title */}
          {pageTitle && (
            <>
              <div style={{ width: 1, height: 20, background: '#CCCDD0', flexShrink: 0 }} />
              <span style={{ fontSize: 14, fontWeight: 400, color: '#35353B', lineHeight: 1 }}>
                {pageTitle}
              </span>
            </>
          )}

          {/* Avatar button */}
          <div className="ml-auto">
            <button ref={avatarButtonRef}
              onClick={() => { setAvatarOpen(v => !v); setDrawerOpen(false); }}
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition-colors"
              style={{ backgroundColor: '#CCCDD0', border: 'none', cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#B8BCC8')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#CCCDD0')}
              title={CURRENT_USER_NAME}
              aria-label={`Account menu — ${CURRENT_USER_NAME}`} aria-expanded={avatarOpen}>
              <Icon path={mdiAccount} size={18} color="#ffffff" />
            </button>
          </div>
        </header>
      )}

      {/* ── Floating nav drawer ── */}
      <div ref={drawerRef} style={{
        position: 'fixed', top: '53px', left: '0px', width: '224px',
        backgroundColor: '#ffffff', border: '1px solid #CCCDD0', borderRadius: '4px',
        boxShadow: ['0 9px 28px 8px rgba(0,0,0,0.05)', '0 6px 16px 0px rgba(0,0,0,0.08)', '0 3px 6px -4px rgba(0,0,0,0.12)'].join(', '),
        zIndex: 40, overflow: 'hidden',
        opacity: drawerOpen ? 1 : 0,
        transform: drawerOpen ? 'translateY(0) scale(1)' : 'translateY(-6px) scale(0.98)',
        pointerEvents: drawerOpen ? 'auto' : 'none',
        transition: 'opacity 0.15s ease, transform 0.15s ease',
      }}>
        <nav className="px-3 py-3">
          <button onClick={() => setAdminOpen(v => !v)}
            className="flex w-full items-center justify-between rounded px-3 py-2 text-sm font-semibold transition-colors"
            style={{ color: '#35353B', background: 'transparent', border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F7F7FA')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
            <span>Admin</span>
            <ChevronIcon open={adminOpen} />
          </button>
          {adminOpen && (
            <div className="mt-1 ml-3 flex flex-col gap-0.5" style={{ borderLeft: '1px solid #CCCDD0', paddingLeft: '10px' }}>
              <DrawerNavItem to="/admin/people"          label="People"                  onNavigate={() => setDrawerOpen(false)} />
              <DrawerNavItem to="/admin/roles"           label="Roles"            end    onNavigate={() => setDrawerOpen(false)} />
              <DrawerNavItem to="/admin/location-tags"   label="Location Tags"  end  onNavigate={() => setDrawerOpen(false)} />
              <DrawerNavItem to="/admin/org"             label="Org Hierarchy"      end  onNavigate={() => setDrawerOpen(false)} />
              <DrawerNavItem to="/admin/licenses"        label="License Assignment" end  onNavigate={() => setDrawerOpen(false)} />
              <DrawerNavItem to="/admin/distribution"   label="Distribution"       end  onNavigate={() => setDrawerOpen(false)} />
            </div>
          )}

          <button onClick={() => setOperateOpen(v => !v)}
            className="mt-1 flex w-full items-center justify-between rounded px-3 py-2 text-sm font-semibold transition-colors"
            style={{ color: '#35353B', background: 'transparent', border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F7F7FA')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
            <span>Operate</span>
            <ChevronIcon open={operateOpen} />
          </button>
          {operateOpen && (
            <div className="mt-1 ml-3 flex flex-col gap-0.5" style={{ borderLeft: '1px solid #CCCDD0', paddingLeft: '10px' }}>
              <DrawerNavItem to="/operate/lists" label="List Completion" end onNavigate={() => setDrawerOpen(false)} />
              <DrawerNavItem to="/mobile/operate/pdf-search" label="PDF Search" end onNavigate={() => setDrawerOpen(false)} />
            </div>
          )}
        </nav>
      </div>

      {/* ── Avatar dropdown menu ── */}
      <div ref={avatarRef} style={{
        position: 'fixed', top: '53px', right: '12px', width: '180px',
        backgroundColor: '#ffffff', border: '1px solid #CCCDD0', borderRadius: '4px',
        boxShadow: ['0 9px 28px 8px rgba(0,0,0,0.05)', '0 6px 16px 0px rgba(0,0,0,0.08)', '0 3px 6px -4px rgba(0,0,0,0.12)'].join(', '),
        zIndex: 40, overflow: 'hidden',
        opacity: avatarOpen ? 1 : 0,
        transform: avatarOpen ? 'translateY(0) scale(1)' : 'translateY(-6px) scale(0.98)',
        pointerEvents: avatarOpen ? 'auto' : 'none',
        transition: 'opacity 0.15s ease, transform 0.15s ease',
      }}>
        <button onClick={() => { setAvatarOpen(false); navigate(`/admin/people/${CURRENT_USER_ID}`); }}
          className="block w-full px-4 py-2.5 text-left text-sm transition-colors"
          style={{ color: '#35353B', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 400 }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F7F7FA')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
          My Profile
        </button>
        <button onClick={() => { setAvatarOpen(false); navigate(`/admin/people/${CURRENT_USER_ID}/notifications`, { state: { from: location.pathname, fromLabel: pageTitle } }); }}
          className="block w-full px-4 py-2.5 text-left text-sm transition-colors"
          style={{ color: '#35353B', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 400 }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F7F7FA')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
          Notifications
        </button>
        <div style={{ borderTop: '1px solid #CCCDD0' }} />
        <button onClick={() => setAvatarOpen(false)}
          className="block w-full px-4 py-2.5 text-left text-sm transition-colors"
          style={{ color: '#35353B', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 400 }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F7F7FA')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
          Log out
        </button>
      </div>

      {/* ── Page content ── */}
      {isMobilePage ? (
        <main className="p-0">
          <div style={{ minHeight: '100vh', backgroundColor: '#F7F7FA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {children}
          </div>
        </main>
      ) : (
        <main className="px-8 py-6">{children}</main>
      )}
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <HashRouter>
      <Shell>
        <Routes>
          <Route path="/" element={<Navigate to="/admin/people" replace />} />
          <Route path="/admin/people"        element={<PeopleListPage />} />
          <Route path="/admin/people/:id"    element={<PersonDetailPage />} />
          <Route path="/admin/people/:id/notifications" element={<NotificationPreferencesPage />} />
          <Route path="/admin/roles"         element={<RolesListPage />} />
          <Route path="/admin/org"           element={<OrgScopePage />} />
          <Route path="/admin/attributes"    element={<LocationAttributesPage />} />
          <Route path="/admin/location-tags" element={<LocationTagManagementPage />} />
          <Route path="/admin/licenses"      element={<LicenseAssignmentPage />} />
          <Route path="/admin/distribution" element={<DistributionPage />} />
          <Route path="/admin/org-import"   element={<OrgHierarchyImportPage />} />
          <Route path="/operate/lists" element={<ListCompletionPage />} />
          <Route path="/mobile/operate/pdf-search" element={<PdfSearchPage />} />
        </Routes>
      </Shell>
    </HashRouter>
  );
}
