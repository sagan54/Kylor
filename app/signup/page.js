"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function SignupPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSignup(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      setLoading(false);
      router.push("/");
      router.refresh();
      return;
    }

    setMessage("Account created. Please check your email to confirm your account.");
    setLoading(false);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(99,102,241,0.18), transparent 24%), radial-gradient(circle at top right, rgba(139,92,246,0.14), transparent 28%), linear-gradient(180deg, #04070f 0%, #070d19 42%, #050914 100%)",
        color: "white",
        fontFamily: "Inter, sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "460px",
          borderRadius: "24px",
          border: "1px solid rgba(255,255,255,0.10)",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))",
          backdropFilter: "blur(18px)",
          boxShadow:
            "0 18px 40px rgba(0,0,0,0.28), 0 0 0 1px rgba(255,255,255,0.03) inset",
          padding: "32px",
        }}
      >
        <button
          onClick={() => router.back()}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            border: "none",
            background: "transparent",
            color: "rgba(255,255,255,0.65)",
            fontSize: "14px",
            cursor: "pointer",
            padding: 0,
            marginBottom: "24px",
            fontFamily: "inherit",
          }}
        >
          ← Back to Kylor
        </button>

        <h1
          style={{
            fontSize: "40px",
            lineHeight: 1.05,
            margin: "0 0 10px 0",
            letterSpacing: "-1px",
          }}
        >
          Create your Kylor account
        </h1>

        <p
          style={{
            margin: "0 0 24px 0",
            color: "rgba(255,255,255,0.65)",
            fontSize: "16px",
            lineHeight: "1.7",
          }}
        >
          Start building cinematic AI projects.
        </p>

        <form onSubmit={handleSignup} style={{ display: "grid", gap: "14px" }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "14px 16px",
              borderRadius: "14px",
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.05)",
              color: "white",
              outline: "none",
              fontSize: "15px",
            }}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "14px 16px",
              borderRadius: "14px",
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.05)",
              color: "white",
              outline: "none",
              fontSize: "15px",
            }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "14px 18px",
              borderRadius: "14px",
              border: "none",
              background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
              color: "white",
              fontWeight: 600,
              fontSize: "15px",
              cursor: "pointer",
              boxShadow: "0 10px 26px rgba(124,58,237,0.24)",
            }}
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        {message ? (
          <p
            style={{
              marginTop: "16px",
              color: "#f87171",
              fontSize: "14px",
            }}
          >
            {message}
          </p>
        ) : null}

        <p
          style={{
            marginTop: "22px",
            color: "rgba(255,255,255,0.65)",
            fontSize: "14px",
          }}
        >
          Already have an account?{" "}
          <Link
            href="/login"
            style={{
              color: "#a78bfa",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Login
          </Link>
        </p>
      </div>
    </main>
  );
}