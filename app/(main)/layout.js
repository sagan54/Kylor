"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import AppSidebar from "../components/AppSidebar";

export default function MainLayout({ children }) {

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          localStorage.setItem("kylor_user_uid", session.user.id);
        }
      }
    );

    const setUID = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        localStorage.setItem("kylor_user_uid", data.user.id);
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
      <AppSidebar />

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