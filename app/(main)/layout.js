"use client";

import AppSidebar from "../components/AppSidebar";

export default function MainLayout({ children }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "104px 1fr",
        height: "100vh",          // ✅ FIXED HEIGHT
        overflow: "hidden",       // ✅ PREVENT BODY SCROLL
        background: "#05070c",
      }}
    >
      {/* Sidebar */}
      <AppSidebar />

      {/* Main Content (ONLY SCROLL HERE) */}
      <div
        style={{
          overflowY: "auto",      // ✅ ONLY SCROLL CONTAINER
          height: "100vh",
        }}
        className="kylor-scroll"
      >
        {children}
      </div>
    </div>
  );
}