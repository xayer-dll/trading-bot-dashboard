"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, BarChart2, TrendingUp, TrendingDown, Trophy, AlertTriangle, RefreshCw } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, ReferenceLine } from "recharts";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface BacktestResult {
  symbol: string; interval: string; days: number;
  total_candles: number; total_trades: number; win_trades: number;
  win_rate: number; total_pnl: number; total_pnl_pct: number;
  max_drawdown: number; sharpe_ratio: number;
  best_trade: number; worst_trade: number;
  final_balance: number; start_balance: number;
  equity: { t: string; balance: number }[];
  trades: { time: string; action: string; price: number; pnl: number; reason: string }[];
  error?: string;
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
      <p className="text-[10px] text-slate-500 mb-1">{label}</p>
      <p className="font-bold text-sm" style={{ color }}>{value}</p>
    </div>
  );
}

export default function BacktestPanel() {
  const [symbol,   setSymbol]   = useState("BTCUSDT");
  const [days,     setDays]     = useState(30);
  const [interval, setInterval] = useState("1h");
  const [loading,  setLoading]  = useState(false);
  const [result,   setResult]   = useState<BacktestResult | null>(null);

  const runBacktest = async () => {
    setLoading(true);
    setResult(null);
    const p = new URLSearchParams({ symbol, days: days.toString(), interval });
    await fetch(`${API}/backtest?${p}`, { method: "POST" });

    // Poll result
    const poll = window.setInterval(async () => {
      const r = await fetch(`${API}/backtest/result`).then(x => x.json());
      if (!r.running && r.result) {
        setResult(r.result);
        setLoading(false);
        window.clearInterval(poll);
      }
    }, 2000);
  };

  const pnlPositive = (result?.total_pnl ?? 0) >= 0;
  const pnlColor    = pnlPositive ? "#10b981" : "#ef4444";

  return (
    <div className="space-y-4">
      {/* Konfigürasyon */}
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <p className="text-[10px] text-slate-500 mb-1.5">Sembol</p>
          <select value={symbol} onChange={e => setSymbol(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
            {["BTCUSDT","ETHUSDT","SOLUSDT","BNBUSDT"].map(s => (
              <option key={s} value={s}>{s}</option>))}
          </select>
        </div>
        <div>
          <p className="text-[10px] text-slate-500 mb-1.5">Zaman Dilimi</p>
          <select value={interval} onChange={e => setInterval(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
            {[["1m","1 Dakika"],["5m","5 Dakika"],["15m","15 Dakika"],["1h","1 Saat"],["4h","4 Saat"],["1d","1 Gün"]].map(([v,l]) => (
              <option key={v} value={v}>{l}</option>))}
          </select>
        </div>
        <div>
          <p className="text-[10px] text-slate-500 mb-1.5">Geçmiş</p>
          <select value={days} onChange={e => setDays(Number(e.target.value))}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
            {[[7,"7 Gün"],[14,"14 Gün"],[30,"30 Gün"],[60,"2 Ay"],[90,"3 Ay"],[180,"6 Ay"]].map(([v,l]) => (
              <option key={v} value={v}>{l}</option>))}
          </select>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }} onClick={runBacktest} disabled={loading}
          className="flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-300 text-sm font-bold hover:bg-blue-500/30 transition-all disabled:opacity-50">
          {loading ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
          {loading ? "Çalışıyor..." : "Backtest Başlat"}
        </motion.button>
      </div>

      {/* Loading */}
      <AnimatePresence>
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm">
            <RefreshCw size={14} className="animate-spin" />
            Binance'tan tarihsel veri çekiliyor ve strateji simüle ediliyor...
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hata */}
      {result?.error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertTriangle size={14} /> {result.error}
        </div>
      )}

      {/* Sonuçlar */}
      <AnimatePresence>
        {result && !result.error && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }} className="space-y-4">

            {/* Özet Başlık */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <p className="text-white font-bold">{result.symbol} · {result.interval} · {result.days} gün</p>
                <p className="text-xs text-slate-500">{result.total_candles.toLocaleString()} mum analiz edildi</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-bold border
                  ${pnlPositive
                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                    : "bg-red-500/15 border-red-500/30 text-red-400"}`}>
                  {pnlPositive ? "+" : ""}{result.total_pnl_pct.toFixed(2)}% getiri
                </span>
              </div>
            </div>

            {/* Stat grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <StatBox label="Toplam İşlem"    value={result.total_trades.toString()}            color="#94a3b8" />
              <StatBox label="Win Rate"         value={`%${result.win_rate}`}                     color={result.win_rate >= 50 ? "#10b981" : "#ef4444"} />
              <StatBox label="Toplam P&L"       value={`${result.total_pnl >= 0 ? "+" : ""}${result.total_pnl.toFixed(4)} USDT`} color={pnlColor} />
              <StatBox label="Sharpe Ratio"     value={result.sharpe_ratio.toFixed(2)}            color={result.sharpe_ratio >= 1 ? "#10b981" : "#f59e0b"} />
              <StatBox label="Max Drawdown"     value={`-%${result.max_drawdown}`}                color="#ef4444" />
              <StatBox label="En İyi İşlem"     value={`+${result.best_trade.toFixed(4)} USDT`}  color="#10b981" />
              <StatBox label="En Kötü İşlem"    value={`${result.worst_trade.toFixed(4)} USDT`}  color="#ef4444" />
              <StatBox label="Final Bakiye"     value={`$${result.final_balance.toFixed(2)}`}    color={pnlColor} />
            </div>

            {/* Equity Curve */}
            {result.equity.length > 1 && (
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-3">Backtest Bakiye Eğrisi</p>
                <ResponsiveContainer width="100%" height={160}>
                  <AreaChart data={result.equity} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="btGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={pnlColor} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={pnlColor} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#1e2d4a" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="t" tick={{ fill: "#475569", fontSize: 9 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fill: "#475569", fontSize: 9 }} axisLine={false} tickLine={false} width={60}
                      tickFormatter={v => `$${v.toLocaleString()}`} />
                    <Tooltip formatter={(v: any) => `$${Number(v).toLocaleString("en-US",{minimumFractionDigits:2})}`}
                      contentStyle={{ background: "#0b1526", border: "1px solid #1e2d4a", borderRadius: 8, fontSize: 11 }}
                      labelStyle={{ color: "#94a3b8" }} itemStyle={{ color: pnlColor }} />
                    <ReferenceLine y={result.start_balance} stroke="#475569" strokeDasharray="4 4" />
                    <Area dataKey="balance" fill="url(#btGrad)" stroke={pnlColor} strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Son işlemler */}
            {result.trades.length > 0 && (
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Son İşlemler</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-800">
                        {["Tarih","Fiyat","P&L","Sebep"].map(h => (
                          <th key={h} className="text-left py-2 px-2 text-slate-500 font-medium">{h}</th>))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.trades.slice(-10).reverse().map((t, i) => (
                        <tr key={i} className="border-b border-slate-800/40 hover:bg-slate-800/20">
                          <td className="py-1.5 px-2 text-slate-400 font-mono">{t.time.slice(0,16)}</td>
                          <td className="py-1.5 px-2 font-mono">${t.price.toLocaleString()}</td>
                          <td className={`py-1.5 px-2 font-mono font-bold ${t.pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {t.pnl >= 0 ? "+" : ""}{t.pnl.toFixed(4)}
                          </td>
                          <td className="py-1.5 px-2">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium
                              ${t.reason === "TAKE-PROFIT" ? "bg-emerald-500/20 text-emerald-400"
                              : t.reason === "STOP-LOSS"   ? "bg-red-500/20 text-red-400"
                              : "bg-slate-700 text-slate-300"}`}>
                              {t.reason}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
