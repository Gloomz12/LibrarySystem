import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Sparkles, UserCheck } from "lucide-react";

import Sidebar from "./components/Sidebar";

import AdminDashboard from "./pages/AdminDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import Catalog from "./pages/Catalog";
import Borrowers from "./pages/Borrowers";
import MyBooks from "./pages/MyBooks";
import StudentTransactions from "./pages/StudentTransactions";
import AdminTransactions from "./pages/AdminTransactions";
import BookDetails from "./pages/BookDetails";

export default function App() {
  // Master Mock User Session State Context
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


      <div className="app-layout-root-container">
        <Sidebar role={mockUser.role} onRoleToggle={handleRoleToggle} />

        {/* Core Viewing Portal Window Frame Area */}
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

            <Route path="*" element={<Navigate to="/main/dashboard" replace />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}