"use client";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface PairState {
  price: number; rsi: number; signal: string;
  position: { active: boolean; pnl: number };
  last_update: string | null;
  stats: { total_pnl: number; win_rate: number };
}

interface Props {
  symbol: string;
  data: PairState;
  active: boolean;
  onClick: () => void;
}

export default function PairCard({ symbol, data, active, onClick }: Props) {
  const base     = symbol.replace("USDT", "");
  const sigColor = data.signal === "BUY" ? "#10b981" : data.signal === "SELL" ? "#ef4444" : "#f59e0b";
  const pnlPos   = data.stats.total_pnl >= 0;

  return (
    <motion.button
      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border transition-all ${
        active
          ? "border-blue-500/50 bg-blue-500/10 glow-blue"
          : "border-slate-700/40 bg-slate-900/40 hover:border-slate-600"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-white text-sm">{base}</span>
          <span className="text-[10px] text-slate-500">/ USDT</span>
        </div>
        <span className="text-[10px] px-1.5 py-0.5 rounded font-bold border"
          style={{ color: sigColor, borderColor: `${sigColor}33`, background: `${sigColor}15` }}>
          {data.signal}
        </span>
      </div>

      <p className="text-lg font-black text-white mb-1">
        {data.price ? `$${data.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—"}
      </p>

      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500">RSI: <span className="text-slate-300">{data.rsi.toFixed(1)}</span></span>
        <span className={pnlPos ? "text-emerald-400" : "text-red-400"}>
          {pnlPos ? "+" : ""}{data.stats.total_pnl.toFixed(2)} USDT
        </span>
      </div>

      {data.position.active && (
        <div className={`mt-2 pt-2 border-t border-slate-800 flex items-center gap-1 text-xs
          ${data.position.pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
          {data.position.pnl >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
          Açık: {data.position.pnl >= 0 ? "+" : ""}{data.position.pnl.toFixed(4)} USDT
        </div>
      )}
    </motion.button>
  );
}
