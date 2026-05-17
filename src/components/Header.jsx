import React from "react";
import { Sparkles } from "lucide-react";

export default function Header() {
  return (
    <header id="header-navbar">
      <div className="header-status-indicator">
        <Sparkles size={16} color="#D4A373" />
        <span>Intelligent Library Management</span>
      </div>
      
      <div className="header-profile-badge">
        <div className="avatar-circle">AD</div>
        <div className="profile-meta-text">
          <p>Librarian</p>
          <p>Admin</p>
        </div>
      </div>
    </header>
  );
}