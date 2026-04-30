"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import AppSidebar from "../components/AppSidebar";

export default function MainLayout({ children }) {

  useEffect(() => {
    // 🔥 1. Listen to auth state changes (login, refresh, magic link return)
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          localStorage.setItem("kylor_user_uid", session.user.id);
        } else {
          localStorage.removeItem("kylor_user_uid");
        }
      }
    );

    // 🔥 2. Handle delayed session (email login redirect case)
    const setUID = async () => {
      let retries = 5;

      while (retries--) {
        const { data } = await supabase.auth.getUser();

        if (data?.user) {
          localStorage.setItem("kylor_user_uid", data.user.id);
          return;
        }

        // wait a bit before retrying (session might not be ready yet)
        await new Promise((res) => setTimeout(res, 300));
      }
    };

    setUID();

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "104px 1fr",
        height: "100vh",
        overflow: "hidden",
        background: "#05070c",
      }}
    >
      {/* Sidebar */}
      <AppSidebar />

      {/* Main Content */}
      <div
        style={{
          overflowY: "auto",
          height: "100vh",
        }}
        className="kylor-scroll"
      >
        {children}
      </div>
    </div>
  );
}