"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, Activity, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [show,     setShow]     = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/login", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      setError("Hatalı şifre. Tekrar dene.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "radial-gradient(ellipse at 30% 20%, #0d1f3c 0%, #060d1e 60%)" }}>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0,  scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center mb-4 glow-blue">
            <Activity size={24} className="text-blue-400" />
          </div>
          <h1 className="text-xl font-black text-white">Trading Bot</h1>
          <p className="text-sm text-slate-500 mt-1">Dashboard'a erişmek için giriş yap</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin}
          className="card p-6 space-y-4">
          <div>
            <label className="text-xs text-slate-400 mb-2 block font-medium">Şifre</label>
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoFocus
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white
                  placeholder-slate-600 focus:outline-none focus:border-blue-500 pr-12 transition-colors"
              />
              <button type="button" onClick={() => setShow(!show)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">
              {error}
            </motion.p>
          )}

          <motion.button
            type="submit"
            whileTap={{ scale: 0.97 }}
            disabled={loading || !password}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm
              bg-blue-500/20 border border-blue-500/40 text-blue-300 hover:bg-blue-500/30
              transition-all disabled:opacity-40"
          >
            <Lock size={14} />
            {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </motion.button>
        </form>

        <p className="text-center text-xs text-slate-700 mt-4">
          Binance Testnet · Gerçek para kullanılmıyor
        </p>
      </motion.div>
    </div>
  );
}
