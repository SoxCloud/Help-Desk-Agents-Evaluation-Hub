import React, { useState, useEffect } from "react";
import { LogIn, Mail, Lock, Loader2, Eye, EyeOff } from "lucide-react";

export const Login = ({
  onLogin,
}: {
  onLogin: (email: string, password: string) => Promise<boolean>;
}) => {
  const [email, setEmail] = useState(() => localStorage.getItem("rememberedEmail") || "");
  const [password, setPassword] = useState(() => localStorage.getItem("rememberedPassword") || "");
  const [rememberMe, setRememberMe] = useState(() => localStorage.getItem("rememberMe") === "true");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (rememberMe) {
      localStorage.setItem("rememberedEmail", email);
      localStorage.setItem("rememberedPassword", password);
      localStorage.setItem("rememberMe", "true");
    } else {
      localStorage.removeItem("rememberedEmail");
      localStorage.removeItem("rememberedPassword");
      localStorage.setItem("rememberMe", "false");
    }
  }, [email, password, rememberMe]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const success = await onLogin(email, password);
      if (!success) {
        setError("Invalid email or password. Please check your credentials.");
      }
    } catch (err) {
      setError("Login failed. Please try again.");
    } finally {
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

      <div className="w-full max-w-sm sm:max-w-md md:max-w-lg relative">
        <div className="glass-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 border border-white/5 shadow-2xl">
          <div className="flex flex-col items-center mb-6 sm:mb-8 md:mb-10">
            {/* Logo */}
            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-2xl sm:rounded-3xl bg-[#0f172a] flex items-center justify-center shadow-lg shadow-blue-500/30 border border-blue-500/40 mb-3 sm:mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-xl sm:rounded-2xl bg-[#1d4ed8] flex items-center justify-center text-white font-black text-xl sm:text-2xl">
                D
              </div>
            </div>
            
            <div className="text-center space-y-1">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Help Desk
              </h1>
              <p className="text-xs sm:text-sm font-medium text-slate-400 tracking-wide">
                Agents Evaluation Hub
              </p>
              <p className="text-[8px] sm:text-[10px] uppercase tracking-[0.25em] text-slate-500 mt-2">
                Secure workspace access
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 sm:mb-2 ml-1">
                Work Email
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-slate-500"
                  size={16}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3.5 bg-[#020617] border border-slate-700 rounded-lg sm:rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-600 text-sm"
                  placeholder="you@company.com"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 sm:mb-2 ml-1">
                Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-slate-500"
                  size={16}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 sm:pl-12 pr-10 sm:pr-12 py-2.5 sm:py-3.5 bg-[#020617] border border-slate-700 rounded-lg sm:rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-600 text-sm"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-600 bg-[#020617] text-blue-500 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="rememberMe" className="ml-2 text-xs text-slate-400 cursor-pointer select-none">
                Remember password
              </label>
            </div>

            {error && (
              <div className="text-red-400 text-xs font-bold bg-red-400/10 p-2 sm:p-3 rounded-lg border border-red-400/20">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 sm:py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg sm:rounded-xl shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70 text-sm"
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  <LogIn size={18} /> Sign In
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};