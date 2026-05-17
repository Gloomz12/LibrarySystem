import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  ArrowRightLeft, 
  Bookmark, 
  UserCheck,
  Sparkles
} from "lucide-react";

// Import Views
import AdminDashboard from "./pages/AdminDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import Catalog from "./pages/Catalog";
import Borrowers from "./pages/Borrowers";
import MyBooks from "./pages/MyBooks";
import StudentTransactions from "./pages/StudentTransactions";
import AdminTransactions from "./pages/AdminTransactions";
import BookDetails from "./pages/BookDetails"; 

export default function App() {
  const [mockUser, setMockUser] = useState({
    name: "Alice Chen",
    id: "ST2024001",
    email: "alice.chen@university.edu",
    role: "student" // Options: "student" | "admin"
  });

  const handleRoleToggle = (targetRole) => {
    setMockUser({
      role: targetRole,
      name: targetRole === "admin" ? "System Administrator" : "Alice Chen",
      id: targetRole === "admin" ? "ADM-001" : "ST2024001",
      email: targetRole === "admin" ? "admin@sarisaritech.io" : "alice.chen@university.edu"
    });
  };

  return (
    <BrowserRouter>
      <div className="dev-role-switcher-ribbon">
        <div className="ribbon-payload">
          <UserCheck size={14} />
          <span>Active Session Context: <strong className="capitalize-fallback">{mockUser.role}</strong></span>
        </div>
        <div className="ribbon-actions-cluster">
          <button 
            type="button" 
            className={mockUser.role === "student" ? "active-toggle-btn" : ""}
            onClick={() => handleRoleToggle("student")}
          >
            Student View
          </button>
          <button 
            type="button" 
            className={mockUser.role === "admin" ? "active-toggle-btn" : ""}
            onClick={() => handleRoleToggle("admin")}
          >
            Librarian Admin View
          </button>
        </div>
      </div>

      <div className="app-layout-root-container">
        <SidebarNavigation role={mockUser.role} user={mockUser} />

        <div className="main-content-window-frame">
          
          <header className="view-app-header">
            <div className="header-meta-branding">
              <Sparkles size={15} className="sparkle-icon-accent" />
              <span>Intelligent Library Management</span>
            </div>
            <div className="header-profile-badge">
              <div className={`avatar-circle-initials ${mockUser.role === 'admin' ? 'bg-admin-accent' : ''}`}>
                <span>{mockUser.role === "admin" ? "AD" : "ST"}</span>
              </div>
              <div className="profile-text-labels">
                <p className="profile-username">{mockUser.name}</p>
                <p className="profile-role-tag capitalize-fallback">{mockUser.role}</p>
              </div>
            </div>
          </header>

          <Routes>
            <Route path="/" element={<Navigate to="/main/dashboard" replace />} />

            <Route 
              path="/main/dashboard" 
              element={mockUser.role === "admin" ? <AdminDashboard /> : <StudentDashboard />} 
            />

            <Route path="/main/catalog" element={<Catalog />} />

            <Route path="/main/catalog/:bookId" element={<BookDetails />} />
            <Route path="/book/:bookId" element={<BookDetails />} />

            <Route 
              path="/main/borrowers" 
              element={mockUser.role === "admin" ? <Borrowers /> : <Navigate to="/main/dashboard" replace />} 
            />

            <Route 
              path="/main/my-books" 
              element={mockUser.role === "student" ? <MyBooks /> : <Navigate to="/main/dashboard" replace />} 
            />

            <Route 
              path="/main/transactions" 
              element={mockUser.role === "admin" ? <AdminTransactions /> : <StudentTransactions />} 
            />

            {/* Catch-all Fallback */}
            <Route path="*" element={<Navigate to="/main/dashboard" replace />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

function SidebarNavigation({ role, user }) {
  const location = useLocation();
  const path = location.pathname;

  return (
    <aside className="app-sidebar-panel">
      <div className="sidebar-brand-identity-block">
        <div className="brand-icon-box">
          <BookOpen size={16} />
        </div>
        <div>
          <h2>SarisariTech</h2>
          <p>Library Workspace</p>
        </div>
      </div>

      <nav className="sidebar-nav-links-stack">
        <Link to="/main/dashboard" className={`nav-item-link-row ${path === "/main/dashboard" ? "active-link" : ""}`}>
          <LayoutDashboard size={16} />
          <span>Dashboard</span>
        </Link>

        <Link to="/main/catalog" className={`nav-item-link-row ${path.startsWith("/main/catalog") ? "active-link" : ""}`}>
          <Bookmark size={16} />
          <span>Catalog (General)</span>
        </Link>

        {role === "admin" && (
          <Link to="/main/borrowers" className={`nav-item-link-row ${path === "/main/borrowers" ? "active-link" : ""}`}>
            <Users size={16} />
            <span>Borrowers</span>
          </Link>
        )}

        {role === "student" && (
          <Link to="/main/my-books" className={`nav-item-link-row ${path === "/main/my-books" ? "active-link" : ""}`}>
            <BookOpen size={16} />
            <span>My Books</span>
          </Link>
        )}

        <Link to="/main/transactions" className={`nav-item-link-row ${path === "/main/transactions" ? "active-link" : ""}`}>
          <ArrowRightLeft size={16} />
          <span>Transactions</span>
        </Link>
      </nav>

      <div className="sidebar-footer-profile-block">
        <div className="profile-badge-avatar-circle">
          {user.name.split(" ").map(n => n[0]).join("")}
        </div>
        <div className="min-w-0 flex-1">
          <p className="profile-badge-display-name text-truncator">{user.name}</p>
          <p className="profile-badge-role-subtext capitalize-fallback">{role} Account</p>
        </div>
      </div>
    </aside>
  );
}