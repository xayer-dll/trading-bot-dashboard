"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function PolymarketWidget() {
  const [markets, setMarkets] = useState<any[]>([]);
  const [positions, setPositions] = useState<any>({});
  const [sentiment, setSentiment] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

    const loadData = async () => {
      try {
        const [mktsRes, posRes, sentimentRes] = await Promise.all([
          globalThis.fetch(`${API}/polymarket/markets`),
          globalThis.fetch(`${API}/polymarket/positions`),
          globalThis.fetch(`${API}/news/sentiment`),
        ]);
        const mkts = await mktsRes.json();
        const pos = await posRes.json();
        const sent = await sentimentRes.json();

        setMarkets(mkts.markets || []);
        setPositions(pos.positions || {});
        setSentiment(sent);
      } catch (err) {
        console.error("[POLY] Fetch hatasi:", err);
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!markets.length && !sentiment) {
    return (
      <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
        <h3 className="font-semibold text-amber-400 mb-2">Polymarket</h3>
        <p className="text-xs text-slate-400">
          {loading ? "Veriler yükleniyor..." : "Veriler bulunamadi"}
        </p>
      </div>
    );
  }

  // Sentiment rengini belirle
  const sentimentColor =
    sentiment?.score >= 0.65
      ? "#10b981"
      : sentiment?.score >= 0.55
        ? "#84cc16"
        : sentiment?.score <= 0.35
          ? "#ef4444"
          : sentiment?.score <= 0.45
            ? "#f97316"
            : "#64748b";

  const sentimentLabel =
    sentiment?.sentiment === "very_bullish"
      ? "Çok Pozitif"
      : sentiment?.sentiment === "bullish"
        ? "Pozitif"
        : sentiment?.sentiment === "very_bearish"
          ? "Çok Negatif"
          : sentiment?.sentiment === "bearish"
            ? "Negatif"
            : "Nötr";

  return (
    <div className="p-4 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border border-amber-500/30">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-amber-400">Polymarket</h3>
        <span className="text-xs px-2 py-1 bg-amber-500/20 text-amber-400 rounded-full">
          {Object.keys(positions).length} Pozisyon
        </span>
      </div>

      {/* Haber Sentiment Gauge */}
      {sentiment && (
        <motion.div
          className="mb-3 p-2.5 rounded bg-slate-700/40 border border-slate-600/50"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold text-slate-400 uppercase">
              Haber Duygu
            </span>
            <span
              className="text-xs font-bold"
              style={{ color: sentimentColor }}
            >
              {sentimentLabel}
            </span>
          </div>

          {/* Bar */}
          <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: sentimentColor }}
              initial={{ width: 0 }}
              animate={{ width: `${((sentiment.score + 1) / 2) * 100}%` }}
              transition={{ duration: 0.6 }}
            />
          </div>

          {/* Top haberler */}
          {sentiment.headlines && sentiment.headlines.length > 0 && (
            <div className="mt-2 text-[9px] text-slate-400">
              <p className="mb-1">Haberleri:</p>
              {sentiment.headlines.slice(0, 2).map((h: any, i: number) => (
                <p key={i} className="line-clamp-1 text-slate-500">
                  • {h.title}
                </p>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Pazarlar */}
      {markets.length > 0 && (
        <div className="space-y-2 mb-3">
          {markets.slice(0, 2).map((market, i) => (
            <motion.div
              key={market.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-2 bg-slate-700/40 rounded border border-slate-600/50 text-xs"
            >
              <p className="text-slate-300 line-clamp-1">{market.title}</p>
              <div className="flex justify-between items-center text-slate-400 text-[10px] mt-1">
                <span>Vol: ${(market.volume / 1000).toFixed(0)}k</span>
                <span>Liq: ${(market.liquidity / 1000).toFixed(0)}k</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pozisyonlar */}
      {Object.entries(positions).length > 0 && (
        <div className="pt-2 border-t border-slate-700">
          <p className="text-[10px] text-slate-400 mb-1">Aktif Pozisyonlar:</p>
          {Object.values(positions)
            .slice(0, 2)
            .map((pos: any, i) => (
              <div key={i} className="text-xs font-semibold mb-1">
                <span
                  style={{
                    color: pos.side === "YES" ? "#10b981" : "#ef4444",
                  }}
                >
                  {pos.side} ({pos.final_confidence.toFixed(0)}%)
                </span>
              </div>
            ))}
        </div>
      )}

      <p className="text-[9px] text-slate-500 mt-2 italic">
        Haber + Teknik = Akıllı işlem 🚀
      </p>
    </div>
  );
}
