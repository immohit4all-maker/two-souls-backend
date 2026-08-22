import { Route, Routes } from 'react-router-dom';
import { useAuth } from '../../context/auth-context';
import { AdminDataProvider } from '../../context/AdminDataProvider';
import { AdminLayout } from './AdminLayout';
import { AdminLogin } from './AdminLogin';
import { Dashboard } from './Dashboard';
import { OrdersManager } from './OrdersManager';
import { ProductsManager } from './ProductsManager';
import { SellersManager } from './SellersManager';

/**
 * Admin entry point: gate on the session, then mount the data provider once for the whole area.
 *
 * `theme-admin` re-points the semantic design tokens at the cooler, denser admin palette; the
 * warm storefront values stay on :root for everything outside this subtree.
 */
export function AdminPortal() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="theme-admin">
        <AdminLogin />
      </div>
    );
  }

  return (
    <div className="theme-admin">
      <AdminDataProvider>
        <Routes>
          <Route element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="orders" element={<OrdersManager />} />
            <Route path="products" element={<ProductsManager />} />
            <Route path="sellers" element={<SellersManager />} />
          </Route>
        </Routes>
      </AdminDataProvider>
    </div>
  );
}
