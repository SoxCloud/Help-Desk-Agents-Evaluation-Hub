import React, { useState } from "react";
import { LogIn, Mail, Loader2 } from "lucide-react";

export const Login = ({
  onLogin,
}: {
  onLogin: (email: string) => boolean | Promise<boolean>;
}) => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const success = await onLogin(email);
    if (!success) {
      setError("Access denied. Please check your credentials.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] p-4 font-sans relative overflow-hidden">
      {/* Brand glow background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-32 w-72 h-72 bg-blue-500/10 blur-3xl rounded-full" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-sky-500/10 blur-3xl rounded-full" />
      </div>

      <div className="max-w-xl w-full relative">
        <div className="glass-card rounded-3xl p-10 border border-white/5 shadow-2xl">
          <div className="flex flex-col items-center mb-10">
            {/* Logo mark approximating your Help Desk brand */}
            <div className="w-16 h-16 rounded-3xl bg-[#0f172a] flex items-center justify-center shadow-lg shadow-blue-500/30 border border-blue-500/40 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-[#1d4ed8] flex items-center justify-center text-white font-black text-2xl">
                D
              </div>
            </div>
            <div className="text-center space-y-1">
              <h1 className="text-2xl font-black text-white tracking-tight">
                Help Desk
              </h1>
              <p className="text-sm font-medium text-slate-400 tracking-wide">
                Agents Evaluation Hub
              </p>
              <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500 mt-2">
                Secure workspace access
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
                Work Email
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                  size={18}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-[#020617] border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-600"
                  placeholder="you@company.com"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="text-red-400 text-xs font-bold bg-red-400/10 p-3 rounded-lg border border-red-400/20">
                {error}
              </div>
            )}

            <button
              disabled={loading}
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  <LogIn size={20} /> Sign In
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
