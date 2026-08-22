import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/auth-context';
import { useAdminData } from '../../context/admin-data-context';
import { initials } from '../../lib/format';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import type { IconName } from '../ui/Icon';

const NAV: ReadonlyArray<{ to: string; label: string; icon: IconName; end?: boolean }> = [
  { to: '/admin', label: 'Dashboard', icon: 'dashboard', end: true },
  { to: '/admin/orders', label: 'Orders', icon: 'receipt' },
  { to: '/admin/products', label: 'Products', icon: 'package' },
  { to: '/admin/sellers', label: 'Sellers', icon: 'store' },
];

export function AdminLayout() {
  const { user, logout } = useAuth();
  const { refresh, loading } = useAdminData();

  return (
    <div className="admin-shell">
      <a className="skip-link" href="#admin-main">
        Skip to content
      </a>

      <aside className="admin-sidebar">
        <Link to="/admin" className="admin-brand">
          <Icon name="sparkle" size={17} filled className="admin-brand-mark" />
          Two Souls
        </Link>

        <nav className="admin-nav" aria-label="Admin sections">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? 'admin-nav-link active' : 'admin-nav-link')}
            >
              <Icon name={item.icon} size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Pushed to the bottom by the nav's flex-grow — the previous portal used margin-top:auto
            on a child of a non-growing container, so it never actually moved. */}
        <div className="admin-sidebar-foot">
          <Link to="/" className="admin-nav-link">
            <Icon name="external" size={18} />
            View store
          </Link>
        </div>
      </aside>

      <div className="admin-body">
        <header className="admin-topbar">
          <div className="admin-topbar-spacer" />

          <Button
            variant="ghost"
            size="sm"
            iconLeft="refresh"
            loading={loading}
            onClick={() => void refresh()}
          >
            Refresh
          </Button>

          <div className="admin-user">
            <span className="admin-avatar" aria-hidden="true">
              {initials(user?.username ?? 'admin')}
            </span>
            <div className="admin-user-meta">
              <p className="admin-user-name">{user?.username ?? 'admin'}</p>
              <p className="admin-user-role">Administrator</p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            iconOnly
            iconLeft="logout"
            aria-label="Sign out"
            className="btn-danger-text"
            onClick={logout}
          />
        </header>

        <main className="admin-main" id="admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
