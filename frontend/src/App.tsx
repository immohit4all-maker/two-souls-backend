import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import AdminPortal from './components/admin/AdminPortal';
import Storefront from './components/Storefront';
import './components/admin/Admin.css';

function App() {
  return (
    <BrowserRouter>
      <nav className="navbar">
        <div className="navbar-logo">Two Souls</div>
        <div className="navbar-links">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
            Storefront
          </NavLink>
          <NavLink to="/admin/sellers" className={({ isActive }) => (isActive ? 'active' : '')}>
            Admin Portal
          </NavLink>
        </div>
      </nav>
      
      <Routes>
        <Route path="/" element={<Storefront />} />
        <Route path="/admin/*" element={<AdminPortal />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
