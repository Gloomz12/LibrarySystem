import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Library,
  LayoutDashboard,
  Search,
  Users,
  Repeat,
  BarChart2,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ role }) {
  const location = useLocation();
  const navigate  = useNavigate();
  const { logout } = useAuth();

  const isActive = (path) => {
    if (path === '/main/catalog') {
      return location.pathname.startsWith('/main/catalog') || location.pathname.startsWith('/book')
        ? 'active-route' : '';
    }
    return location.pathname.startsWith(path) ? 'active-route' : '';
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <aside id="sidebar-panel">
      <div className="sidebar-branding">
        <div className="brand-icon-box">
          <Library size={20} />
        </div>
        <div className="brand-text-wrapper">
          <span className="brand-title">Books Repository</span>
          <span className="brand-subtitle">Smart Library</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <Link className={`nav-link ${isActive('/main/dashboard')}`} to="/main/dashboard">
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </Link>

        <Link className={`nav-link ${isActive('/main/catalog')}`} to="/main/catalog">
          <Search size={18} />
          <span>Catalog</span>
        </Link>

        {role === 'admin' && (
          <Link className={`nav-link ${isActive('/main/borrowers')}`} to="/main/borrowers">
            <Users size={18} />
            <span>Borrowers</span>
          </Link>
        )}

        {role === 'student' && (
          <Link className={`nav-link ${isActive('/main/my-books')}`} to="/main/my-books">
            <Library size={18} />
            <span>My Books</span>
          </Link>
        )}

        <Link className={`nav-link ${isActive('/main/transactions')}`} to="/main/transactions">
          <Repeat size={18} />
          <span>Transactions</span>
        </Link>

        {role === 'admin' && (
          <Link className={`nav-link ${isActive('/main/analytics')}`} to="/main/analytics">
            <BarChart2 size={18} />
            <span>Analytics</span>
          </Link>
        )}
      </nav>

      <div className="sidebar-footer">
        <button className="btn-logout" onClick={handleLogout}>
          <LogOut size={14} />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
}
