import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import AdminPortal from './components/admin/AdminPortal';
import Storefront from './components/Storefront';
import { AuthProvider } from './context/AuthContext';
import './components/admin/Admin.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <nav className="navbar">
          <div className="navbar-logo">Two Souls</div>
          <div className="navbar-links">
            <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
              Storefront
            </NavLink>
            <NavLink to="/admin" className={({ isActive }) => (isActive ? 'active' : '')}>
              Admin Portal
            </NavLink>
          </div>
        </nav>
        
        <Routes>
          <Route path="/" element={<Storefront />} />
          <Route path="/admin/*" element={<AdminPortal />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
