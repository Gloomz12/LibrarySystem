import React from "react";
import { Link, useLocation } from "react-router-dom"; 
import { 
  Library, 
  LayoutDashboard, 
  Search, 
  Users, 
  Repeat, 
  ShieldCheck,
  LogOut 
} from "lucide-react";

export default function Sidebar() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path ? "active-route" : "";

  return (
    <aside id="sidebar-panel">
      <div className="sidebar-branding">
        <div className="brand-icon-box">
          <Library size={20} />
        </div>
        <div className="brand-text-wrapper">
          <span className="brand-title">IntelliLib</span>
          <span className="brand-subtitle">Smart Library</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <Link className={`nav-link ${isActive("/main/dashboard")}`} to="/main/dashboard">
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </Link>
        
        <Link className={`nav-link ${isActive("/main/catalog")}`} to="/main/catalog">
          <Search size={18} />
          <span>Catalog</span>
        </Link>
        
        <Link className={`nav-link ${isActive("/main/borrowers")}`} to="/main/borrowers">
          <Users size={18} />
          <span>Borrowers</span>
        </Link>
        
        <Link className={`nav-link ${isActive("/main/transactions")}`} to="/main/transactions">
          <Repeat size={18} />
          <span>Transactions</span>
        </Link>

        <Link className={`nav-link ${isActive("/main/my-books")}`} to="/main/my-books">
          <Library size={18} />
          <span>My Books</span>
        </Link>
      </nav>

      <div className="sidebar-action-zone">
        <button className="btn-toggle-role">
          <ShieldCheck size={18} />
          <span>Switch to Student</span>
        </button>
      </div>

      <div className="sidebar-footer">
        <button className="btn-logout">
          <LogOut size={14} />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
}