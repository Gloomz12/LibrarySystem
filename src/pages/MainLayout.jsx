import React from "react";
import { Outlet } from "react-router-dom"; 
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

export default function MainLayout() {
  return (
    <div id="app-shell">
      <Sidebar />
      <div id="main-window">
        <Header />
        <Outlet /> 
      </div>
    </div>
  );
}