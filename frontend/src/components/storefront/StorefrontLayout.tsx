import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useCart } from '../../context/cart-context';
import { useSavedIds } from '../../lib/savedItems';
import { Icon } from '../ui/Icon';
import { CartDrawer } from './CartDrawer';

/**
 * The public shop. It deliberately contains no link into the admin portal — that is a private
 * back-office reachable only by navigating to /admin directly.
 */
export function StorefrontLayout() {
  const { count, openCart } = useCart();
  const savedIds = useSavedIds();
  const { pathname } = useLocation();

  // Router navigation preserves scroll position by default, which lands you halfway down a
  // product page after clicking through from the middle of the grid.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

  return (
    <div className="store">
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <header className="store-header">
        <div className="container store-header-inner">
          <Link to="/" className="wordmark" aria-label="Two Souls home">
            <Icon name="sparkle" size={17} filled className="wordmark-mark" />
            Two Souls
          </Link>

          <nav className="store-nav" aria-label="Main">
            <NavLink
              to="/"
              end
              className={({ isActive }) => (isActive ? 'store-nav-link active' : 'store-nav-link')}
            >
              Shop
            </NavLink>
            <a className="store-nav-link" href="/#budget-heading">
              By budget
            </a>
          </nav>

          <div className="store-header-actions">
            {savedIds.length > 0 && (
              <span className="header-saved" title={`${savedIds.length} saved`}>
                <Icon name="heart" size={18} filled />
                <span className="header-saved-count">{savedIds.length}</span>
              </span>
            )}

            <button type="button" className="bag-button" onClick={openCart}>
              <Icon name="bag" size={19} />
              <span className="bag-label">Bag</span>
              {count > 0 && (
                <span className="bag-count" aria-hidden="true">
                  {count}
                </span>
              )}
              <span className="sr-only">
                {count === 0 ? 'Your bag is empty' : `${count} items in your bag`}
              </span>
            </button>
          </div>
        </div>
      </header>

      <main className="container store-main" id="main">
        <Outlet />
      </main>

      <footer className="store-footer">
        <div className="container store-footer-inner">
          <div className="store-footer-brand">
            <span className="wordmark">
              <Icon name="sparkle" size={16} filled className="wordmark-mark" />
              Two Souls
            </span>
            <p>
              A hand-picked collection of small-batch gifts, chosen for the people who are hard to
              buy for.
            </p>
          </div>

          <nav className="store-footer-links" aria-label="Footer">
            <Link to="/">Shop all</Link>
            <a href="/#budget-heading">By budget</a>
          </nav>
        </div>

        <div className="container store-footer-legal">
          <p>© {new Date().getFullYear()} Two Souls. All rights reserved.</p>
        </div>
      </footer>

      <CartDrawer />
    </div>
  );
}
