"use client";

import AppSidebar from "../components/AppSidebar";

export default function MainLayout({ children }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "88px 1fr",
        minHeight: "100vh",
        background: "#05070c",
      }}
    >
      {/* Sidebar (persistent) */}
      <AppSidebar />

      {/* Page content */}
      <div style={{ overflowY: "auto" }}>
        {children}
      </div>
    </div>
  );
}