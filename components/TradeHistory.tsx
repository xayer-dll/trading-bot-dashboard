"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Trade } from "@/hooks/useBotData";
import { ArrowUpCircle, ArrowDownCircle } from "lucide-react";

export default function TradeHistory({ trades }: { trades: Trade[] }) {
  if (!trades.length) {
    return (
      <div className="text-center py-8 text-slate-600 text-sm">
        Henüz işlem yok — bot BUY/SELL sinyali üretince burada görünecek.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-800">
            {["Saat", "İşlem", "Fiyat", "RSI", "P&L"].map(h => (
              <th key={h} className="text-left py-2 px-3 text-xs text-slate-500 font-medium uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <AnimatePresence initial={false}>
            {trades.map((t, i) => {
              const isBuy   = t.action === "BUY";
              const pnlPos  = t.pnl !== null && t.pnl > 0;
              return (
                <motion.tr
                  key={`${t.time}-${i}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="border-b border-slate-800/40 hover:bg-slate-800/20 transition-colors"
                >
                  <td className="py-2.5 px-3 font-mono text-slate-400 text-xs">{t.time}</td>
                  <td className="py-2.5 px-3">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-bold
                      ${isBuy ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>
                      {isBuy
                        ? <ArrowUpCircle size={11} />
                        : <ArrowDownCircle size={11} />}
                      {t.action}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-white">
                    ${t.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 px-3 font-mono">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      t.rsi < 30 ? "bg-emerald-500/10 text-emerald-400"
                      : t.rsi > 70 ? "bg-red-500/10 text-red-400"
                      : "text-slate-400"}`}>
                      {t.rsi.toFixed(1)}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-xs">
                    {t.pnl !== null
                      ? <span className={`font-bold ${pnlPos ? "text-emerald-400" : "text-red-400"}`}>
                          {pnlPos ? "+" : ""}{t.pnl.toFixed(4)} USDT
                        </span>
                      : <span className="text-slate-600">—</span>}
                  </td>
                </motion.tr>
              );
            })}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  );
}
