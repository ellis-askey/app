"use client";
// components/layout/LoginForm.tsx

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("credentials", { email, redirect: false });

    setLoading(false);
    if (result?.error) {
      setError("Email not recognised. Try a seeded demo address.");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5">
          Email address
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="you@agency.co.uk"
          className="w-full px-3 py-2.5 rounded-lg border border-[#e4e9f0] bg-[#f7f9fc] text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
        />
      </div>

      {error && (
        <p className="text-xs text-red-500 px-0.5">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-sm font-medium text-white transition-colors shadow-sm"
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
