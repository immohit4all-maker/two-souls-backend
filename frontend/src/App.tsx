import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';
import { CartProvider } from './context/CartProvider';
import { CatalogProvider } from './context/CatalogProvider';
import { ToastProvider } from './components/ui/ToastProvider';
import { AdminPortal } from './components/admin/AdminPortal';
import { Checkout } from './components/storefront/Checkout';
import { Home } from './components/storefront/Home';
import { NotFound } from './components/storefront/NotFound';
import { OrderConfirmation } from './components/storefront/OrderConfirmation';
import { ProductDetail } from './components/storefront/ProductDetail';
import { StorefrontLayout } from './components/storefront/StorefrontLayout';

/**
 * Cart and catalogue are scoped to the shop branch rather than the whole app, so the admin
 * area does not mount a shopping cart or kick off a second catalogue fetch.
 */
function StoreShell() {
  return (
    <CartProvider>
      <CatalogProvider>
        <StorefrontLayout />
      </CatalogProvider>
    </CartProvider>
  );
}

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/admin/*" element={<AdminPortal />} />

            <Route path="/" element={<StoreShell />}>
              <Route index element={<Home />} />
              <Route path="product/:productId" element={<ProductDetail />} />
              <Route path="checkout" element={<Checkout />} />
              <Route path="order/:orderNumber" element={<OrderConfirmation />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
