"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setMessage("Signup successful. You can now log in.");
    setLoading(false);
    router.push("/login");
  }

  return (
    <main className="min-h-screen bg-[#050816] text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-3xl font-bold mb-6">Create your Kylor account</h1>

        <form onSubmit={handleSignup} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-violet-600 hover:bg-violet-500 transition px-4 py-3 font-semibold"
          >
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>

        {message && <p className="mt-4 text-sm text-white/80">{message}</p>}

        <p className="mt-6 text-sm text-white/60">
          Already have an account?{" "}
          <a href="/login" className="text-violet-400">
            Login
          </a>
        </p>
      </div>
    </main>
  );
}