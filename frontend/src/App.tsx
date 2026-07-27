import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import AdminPortal from './components/admin/AdminPortal';
import './components/admin/Admin.css';

function App() {
  return (
    <BrowserRouter>
      <nav className="navbar">
        <div className="navbar-logo">Two Souls</div>
        <div className="navbar-links">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/admin">Admin Portal</NavLink>
        </div>
      </nav>
      
      <Routes>
        <Route path="/" element={<h1>Welcome to Two Souls</h1>} />
        <Route path="/admin/*" element={<AdminPortal />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
