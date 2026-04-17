// app/login/page.tsx

import { LoginForm } from "@/components/layout/LoginForm";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const session = await getSession();
  if (session?.user) redirect("/dashboard");

  const devBypass = process.env.DEV_AUTH_BYPASS === "true";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8] px-4">
      <div className="w-full max-w-sm">

        {/* Brand mark */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-blue-500 shadow-sm mb-4">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Sales Progressor</h1>
          <p className="text-sm text-gray-400 mt-1">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-[#e4e9f0] p-6"
             style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>

          {devBypass && (
            <div className="mb-5 px-4 py-3 rounded-lg bg-amber-50 border border-amber-100 text-xs text-amber-700">
              <strong className="block mb-0.5">Dev bypass active</strong>
              Enter any seeded email — no password required.
              <br />
              <span className="text-amber-500 font-mono">sarah@hartwellpartners.co.uk</span>
            </div>
          )}

          <LoginForm />
        </div>
      </div>
    </div>
  );
}
