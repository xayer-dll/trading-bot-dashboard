"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useBotData } from "@/hooks/useBotData";
import AnimatedValue from "@/components/AnimatedValue";
import RsiGauge from "@/components/RsiGauge";
import PriceChart from "@/components/PriceChart";
import RsiChart from "@/components/RsiChart";
import EquityChart from "@/components/EquityChart";
import TradeHistory from "@/components/TradeHistory";
import SettingsPanel from "@/components/SettingsPanel";
import BacktestPanel from "@/components/BacktestPanel";
import PairCard from "@/components/PairCard";
import PolymarketWidget from "@/components/PolymarketWidget";
import TradingViewChart from "@/components/TradingViewChart";
import { useRouter } from "next/navigation";
import {
  Activity, TrendingUp, TrendingDown, Wallet, BarChart2,
  Play, Square, Wifi, WifiOff, AlertTriangle, Target,
  ShieldAlert, Trophy, Settings, Zap, FlaskConical, Layers, LogOut,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// Turk para formati: 62.489,99 (nokta binlik, virgul ondalik)
const fmtUSD = (v: number, decimals = 2) =>
  "$" + v.toLocaleString("tr-TR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
const fmtPnl = (v: number) =>
  (v >= 0 ? "+" : "") + v.toLocaleString("tr-TR", { minimumFractionDigits: 4, maximumFractionDigits: 4 });
const fmtPct = (v: number) => `%${v.toLocaleString("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`;

const fadeUp = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };
const stagger = { show: { transition: { staggerChildren: 0.07 } } };

type Tab = "live" | "pairs" | "backtest" | "futures" | "chart";

function Card({ children, className = "", glow = "" }: { children: React.ReactNode; className?: string; glow?: string }) {
  return <motion.div variants={fadeUp} className={`card p-5 ${glow} ${className}`}>{children}</motion.div>;
}
function Sec({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest mb-3">{children}</p>;
}
function SignalPill({ signal }: { signal: string }) {
  const cfg = {
    BUY:  { cls: "border-emerald-500/30 bg-emerald-500/15 text-emerald-400", dot: "bg-emerald-400", shadow: "shadow-[0_0_14px_#10b98155]" },
    SELL: { cls: "border-red-500/30    bg-red-500/15    text-red-400",    dot: "bg-red-400",    shadow: "shadow-[0_0_14px_#ef444455]" },
    HOLD: { cls: "border-amber-500/30  bg-amber-500/15  text-amber-400",  dot: "bg-amber-400",  shadow: "" },
  }[signal] ?? { cls: "border-slate-600 bg-slate-800 text-slate-400", dot: "bg-slate-500", shadow: "" };
  return (
    <motion.div key={signal} initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 280, damping: 20 }}
      className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border font-bold text-sm ${cfg.cls} ${cfg.shadow}`}>
      <span className={`relative w-2 h-2 rounded-full ${cfg.dot}`}>
        {signal !== "HOLD" && <span className={`absolute inset-0 rounded-full ${cfg.dot} animate-ping opacity-60`} />}
      </span>
      {signal}
    </motion.div>
  );
}

function StatCard({ label, value, sub, icon: Icon, color, pct }: {
  label: string; value: React.ReactNode; sub?: string; icon: React.ElementType; color: string; pct?: number;
}) {
  return (
    <Card glow={color === "#3b82f6" ? "glow-blue" : color === "#10b981" ? "glow-green" : color === "#ef4444" ? "glow-red" : ""}>
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl" style={{ background: `${color}20` }}>
          <Icon size={15} style={{ color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">{label}</p>
          <div className="text-lg font-black text-white truncate">{value}</div>
          {sub && <p className="text-[10px] text-slate-500 mt-0.5">{sub}</p>}
        </div>
      </div>
      {pct !== undefined && (
        <div className="mt-3 h-1 bg-slate-800 rounded-full overflow-hidden">
          <motion.div className="h-full rounded-full" style={{ background: color }}
            initial={{ width: 0 }} animate={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
            transition={{ duration: 1, ease: "easeOut" }} />
        </div>
      )}
    </Card>
  );
}

export default function Dashboard() {
  const { data, connected, loading, startBot, stopBot } = useBotData();
  const router = useRouter();
  const [tab,           setTab]           = useState<Tab>("live");
  const [settingsOpen,  setSettingsOpen]  = useState(false);
  const [futuresSide,   setFuturesSide]   = useState<"LONG" | "SHORT">("LONG");
  const [futuresAmount, setFuturesAmount] = useState(10);
  const [futuresMsg,    setFuturesMsg]    = useState("");

  const { stats, position, price_history, equity_history, trades } = data;
  const pnlColor  = stats.total_pnl >= 0 ? "#10b981" : "#ef4444";
  const pairsData = (data as any).pairs as Record<string, any> ?? {};
  const activeSym = (data as any).active_symbol ?? "BTCUSDT";

  const changeSymbol = async (s: string) => {
    await fetch(`${API}/symbol?symbol=${s}`, { method: "POST" });
  };

  const openFutures = async () => {
    const endpoint = futuresSide === "LONG" ? "/futures/long" : "/futures/short";
    const r = await fetch(`${API}${endpoint}?symbol=${activeSym}&usdt=${futuresAmount}`, { method: "POST" }).then(x => x.json());
    setFuturesMsg(r.ok ? `${futuresSide} pozisyon açıldı!` : r.error ?? "Hata");
  };
  const closeFutures = async () => {
    const r = await fetch(`${API}/futures/close?symbol=${activeSym}`, { method: "POST" }).then(x => x.json());
    setFuturesMsg(r.ok ? "Pozisyon kapatıldı" : r.error ?? "Hata");
  };

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "live",     label: "Canli",     icon: Activity    },
    { id: "chart",    label: "Grafik",    icon: BarChart2   },
    { id: "pairs",    label: "Ciftler",   icon: Layers      },
    { id: "backtest", label: "Backtest",  icon: FlaskConical },
    { id: "futures",  label: "Futures",   icon: Zap         },
  ];

  return (
    <div className="min-h-screen p-4 md:p-6"
      style={{ background: "radial-gradient(ellipse at 20% 10%, #0d1f3c 0%, #060d1e 60%)" }}>

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <motion.header initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center glow-blue">
            <Activity size={15} className="text-blue-400" />
          </div>
          <div>
            <h1 className="text-base font-black text-white">Trading Bot</h1>
            <p className="text-[10px] text-slate-500">Binance Testnet · {activeSym}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs
            ${connected ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-red-500/30 bg-red-500/10 text-red-400"}`}>
            {connected ? <Wifi size={11}/> : <WifiOff size={11}/>}
            {connected ? "Bağlı" : "Bağlantı yok"}
          </div>
          <AnimatePresence>
            {data.running && (
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs">
                <span className="relative flex w-1.5 h-1.5">
                  <span className="absolute inset-0 rounded-full bg-blue-400 opacity-75 animate-ping"/>
                  <span className="relative rounded-full w-1.5 h-1.5 bg-blue-400"/>
                </span>
                #{(data as any).iteration ?? 0}
              </motion.div>
            )}
          </AnimatePresence>
          <motion.button whileTap={{ scale: 0.95 }} onClick={data.running ? stopBot : startBot}
            disabled={loading || !connected}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold border transition-all disabled:opacity-40
              ${data.running ? "bg-red-500/15 border-red-500/40 text-red-300 hover:bg-red-500/25"
                             : "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25"}`}>
            {data.running ? <><Square size={11}/> Durdur</> : <><Play size={11}/> Başlat</>}
          </motion.button>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => setSettingsOpen(true)}
            className="p-2 rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-slate-700/50 transition-colors">
            <Settings size={14} className="text-slate-400" />
          </motion.button>
          <motion.button whileTap={{ scale: 0.95 }}
            onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); router.push("/login"); }}
            className="p-2 rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-red-500/20 hover:border-red-500/40 transition-colors"
            title="Çıkış Yap">
            <LogOut size={14} className="text-slate-400" />
          </motion.button>
        </div>
      </motion.header>

      {/* ── SEKMELER ────────────────────────────────────────────────────── */}
      <div className="flex gap-1 mb-5 p-1 rounded-xl bg-slate-900/60 border border-slate-800 w-fit">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all
              ${tab === t.id ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                            : "text-slate-500 hover:text-slate-300"}`}>
            <t.icon size={12}/> {t.label}
          </button>
        ))}
      </div>

      {/* ── HATA ────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {data.error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center gap-2 mb-4 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
            <AlertTriangle size={13}/> {data.error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── TAB İÇERİKLERİ ─────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">

        {/* ── CANLI ──────────────────────────────────────────────────── */}
        {tab === "live" && (
          <motion.div key="live" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div variants={stagger} initial="hidden" animate="show"
              className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-4">
              <StatCard label="BTC Fiyati" color="#3b82f6" icon={TrendingUp}
                value={<AnimatedValue value={data.price} format={v => fmtUSD(v)}/>}
                sub="Piyasa fiyati"/>
              <StatCard label="RSI (14)" color={data.rsi < 35 ? "#10b981" : data.rsi > 65 ? "#ef4444" : "#f59e0b"} icon={BarChart2}
                value={<AnimatedValue value={data.rsi} format={v => v.toFixed(2)}/>}
                sub={data.rsi < 35 ? "AL Bolgesi (<35)" : data.rsi > 65 ? "SAT Bolgesi (>65)" : "Notr"}
                pct={data.rsi}/>
              <StatCard label="Bakiye" color="#8b5cf6" icon={Wallet}
                value={<AnimatedValue value={data.balance_usdt} format={v => fmtUSD(v)}/>}
                sub={`${(data as any).leverage ?? 1}x Kaldirac`}/>
              <StatCard label="Toplam P&L" color={pnlColor} icon={stats.total_pnl >= 0 ? TrendingUp : TrendingDown}
                value={<span style={{ color: pnlColor }}>
                  <AnimatedValue value={stats.total_pnl} format={v => fmtPnl(v)}/>
                  <span className="text-xs ml-1">USDT</span></span>}
                sub={`${stats.total_trades} kapatilmis`}/>
              <StatCard label="Win Rate" color={stats.win_rate >= 50 ? "#10b981" : "#ef4444"} icon={Trophy}
                value={<AnimatedValue value={stats.win_rate} format={v => fmtPct(v)}/>}
                sub={`${stats.win_trades}/${stats.total_trades}`} pct={stats.win_rate}/>
              <StatCard label="En iyi/kotu" color="#6366f1" icon={ShieldAlert}
                value={<span className="text-base">
                  <span className="text-emerald-400">+{stats.best_trade.toLocaleString("tr-TR",{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
                  <span className="text-slate-600 mx-1">/</span>
                  <span className="text-red-400">{stats.worst_trade.toLocaleString("tr-TR",{minimumFractionDigits:2,maximumFractionDigits:2})}</span></span>}
                sub="USDT"/>
            </motion.div>

            <motion.div variants={stagger} initial="hidden" animate="show"
              className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">
              <motion.div variants={fadeUp} className="lg:col-span-2 card p-5 glow-blue">
                <Sec>BTC Fiyat Grafiği</Sec>
                <PriceChart history={price_history} trades={trades}/>
                <div className="mt-4 pt-3 border-t border-slate-800">
                  <Sec>RSI (14) Geçmişi</Sec>
                  <RsiChart history={price_history}/>
                </div>
              </motion.div>
              <div className="flex flex-col gap-3">
                <Card glow={data.rsi < 30 ? "glow-green" : data.rsi > 70 ? "glow-red" : ""}>
                  <Sec>RSI Göstergesi</Sec>
                  <div className="flex justify-center py-2"><RsiGauge rsi={data.rsi}/></div>
                  <div className="flex justify-center mt-2"><SignalPill signal={data.signal}/></div>
                </Card>
                <Card>
                  <Sec>Acik Pozisyon</Sec>
                  {position.active ? (
                    <div className="space-y-2.5">
                      {[["Giris", fmtUSD(position.entry_price)],
                        ["Miktar", `${position.quantity.toLocaleString("tr-TR",{minimumFractionDigits:6})} BTC`]].map(([l,v]) => (
                        <div key={l} className="flex justify-between text-xs">
                          <span className="text-slate-500">{l}</span>
                          <span className="text-white font-mono">{v}</span>
                        </div>))}
                      <div className="flex justify-between text-xs items-center">
                        <span className="text-slate-500">P&L</span>
                        <motion.span key={position.pnl} initial={{ scale: 1.1 }} animate={{ scale: 1 }}
                          className={`font-mono font-bold text-sm ${position.pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {fmtPnl(position.pnl)} USDT
                        </motion.span>
                      </div>
                      <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2 text-[10px] text-slate-500">
                        <div>TP: %{(((data as any).take_profit_pct ?? 0.03) * 100).toFixed(1)}</div>
                        <div>SL: %{(((data as any).stop_loss_pct ?? 0.02) * 100).toFixed(1)}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-5 text-slate-600 text-xs">
                      <span className="text-2xl block mb-1">—</span>Acik pozisyon yok
                    </div>
                  )}
                </Card>
              </div>
            </motion.div>

            <motion.div variants={stagger} initial="hidden" animate="show" className="mb-4">
              <Card glow={stats.total_pnl >= 0 ? "glow-green" : "glow-red"}>
                <div className="flex items-center justify-between mb-2">
                  <Sec>Bakiye Eğrisi (Equity Curve)</Sec>
                  {equity_history.length > 1 && (
                    <span className={`text-xs font-bold ${stats.total_pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {fmtPnl(stats.total_pnl)} USDT
                    </span>)}
                </div>
                <EquityChart history={equity_history}/>
              </Card>
            </motion.div>

            <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">
              <motion.div variants={fadeUp} className="lg:col-span-2">
                <Card>
                  <div className="flex items-center justify-between mb-3">
                    <Sec>Islem Gecmisi</Sec>
                    <span className="text-[10px] text-slate-600">{trades.length} islem</span>
                  </div>
                  <TradeHistory trades={trades}/>
                </Card>
              </motion.div>
              <motion.div variants={fadeUp}>
                <PolymarketWidget/>
              </motion.div>
            </motion.div>
          </motion.div>
        )}

        {/* ── TRADINGVIEW GRAFIK ────────────────────────────────────── */}
        {tab === "chart" && (
          <motion.div key="chart" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="card p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest">
                  TradingView Profesyonel Grafik
                </p>
                <div className="flex gap-1">
                  {["BTCUSDT", "ETHUSDT", "SOLUSDT", "DOGEUSDT", "XRPUSDT"].map(sym => (
                    <button key={sym} onClick={() => changeSymbol(sym)}
                      className={`px-2 py-1 rounded text-[10px] font-bold border transition-all
                        ${activeSym === sym
                          ? "bg-blue-500/20 border-blue-500/50 text-blue-300"
                          : "border-slate-700 text-slate-500 hover:text-slate-300"}`}>
                      {sym.replace("USDT", "")}
                    </button>
                  ))}
                </div>
              </div>
              <TradingViewChart symbol={`BINANCE:${activeSym}`} height={500} />
            </div>
            <div className="card p-4">
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest mb-2">
                Webhook Entegrasyonu
              </p>
              <p className="text-xs text-slate-400 mb-2">
                TradingView alarmlarini bota bagla:
              </p>
              <div className="bg-slate-800/80 rounded-lg p-3 text-xs font-mono text-slate-300 select-all">
                https://furkan.fly.dev/webhook/tradingview
              </div>
              <p className="text-[10px] text-slate-500 mt-2">
                Alarm mesaji: {`{"symbol": "BTCUSDT", "action": "BUY", "price": {{close}}, "source": "tradingview"}`}
              </p>
            </div>
          </motion.div>
        )}

        {/* ── ÇİFTLER ────────────────────────────────────────────────── */}
        {tab === "pairs" && (
          <motion.div key="pairs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="card p-5 mb-4">
              <Sec>Takip Edilen Çiftler</Sec>
              <p className="text-xs text-slate-500 mb-4">Bir çifte tıkla → o çiftin detaylarını Canlı sekmesinde gör.</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {Object.entries(pairsData).map(([sym, pairData]: [string, any]) => (
                  <PairCard key={sym} symbol={sym} data={pairData ?? {
                    price:0,rsi:0,signal:"HOLD",position:{active:false,pnl:0},last_update:null,stats:{total_pnl:0,win_rate:0}
                  }} active={sym === activeSym} onClick={() => { changeSymbol(sym); setTab("live"); }}/>
                ))}
              </div>
            </div>
            <div className="card p-5">
              <Sec>Portföy Özeti</Sec>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(pairsData).map(([sym, p]: [string, any]) => {
                  const pData = p ?? {};
                  return (
                    <div key={sym} className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                      <p className="text-xs font-bold text-white mb-1">{sym.replace("USDT","")}</p>
                      <p className="text-[10px] text-slate-500">İşlem: {pData.stats?.total_trades ?? 0}</p>
                      <p className={`text-xs font-bold ${(pData.stats?.total_pnl ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {fmtPnl(pData.stats?.total_pnl ?? 0)} USDT
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── BACKTEST ────────────────────────────────────────────────── */}
        {tab === "backtest" && (
          <motion.div key="backtest" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="card p-5">
              <div className="flex items-start gap-3 mb-5 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <FlaskConical size={16} className="text-blue-400 mt-0.5 shrink-0"/>
                <div className="text-xs text-slate-300">
                  <p className="font-bold text-blue-300 mb-1">Backtest nedir?</p>
                  <p className="text-slate-400">Seçilen stratejinin geçmiş piyasa verilerinde nasıl performans gösterdiğini simüle eder. Gerçek Binance API'sinden veri çeker.</p>
                </div>
              </div>
              <BacktestPanel/>
            </div>
          </motion.div>
        )}

        {/* ── FUTURES ─────────────────────────────────────────────────── */}
        {tab === "futures" && (
          <motion.div key="futures" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Bilgi kartı */}
              <div className="card p-5">
                <Sec>Futures & Kaldıraç</Sec>
                <div className="space-y-3 text-xs text-slate-400 mb-5">
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <p className="font-bold text-amber-400 mb-1">Önemli Uyarı</p>
                    <p>Kaldıraç hem kârı hem zararı büyütür. %10 fiyat düşüşü 10x kaldıraçla tüm sermayeyi silebilir (liquidation).</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    {[
                      ["Long", "Fiyat yükselir diye bahse girersin"],
                      ["Short", "Fiyat düşer diye bahse girersin"],
                      ["Kaldıraç", "Pozisyon büyüklüğünü çarpar"],
                      ["Liquidation", "Kaldıraç * %X düşüşte = sıfır"],
                    ].map(([t,d]) => (
                      <div key={t} className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
                        <p className="font-bold text-white text-[11px] mb-0.5">{t}</p>
                        <p className="text-[10px] text-slate-500">{d}</p>
                      </div>))}
                  </div>
                </div>

                {!(data as any).futures_enabled && (
                  <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 text-xs">
                    <p className="font-bold text-white mb-2">Futures Aktif Değil</p>
                    <ol className="space-y-1.5 text-slate-400">
                      <li>1. <a href="https://testnet.binancefuture.com" target="_blank" className="text-blue-400 underline">testnet.binancefuture.com</a> → API Key al</li>
                      <li>2. config.py → FUTURES_API_KEY / FUTURES_API_SECRET gir</li>
                      <li>3. config.py → FUTURES_ENABLED = True</li>
                      <li>4. api.py'i yeniden başlat</li>
                    </ol>
                  </div>
                )}
              </div>

              {/* İşlem paneli */}
              <div className="card p-5">
                <Sec>Pozisyon Aç</Sec>
                <div className={!(data as any).futures_enabled ? "opacity-40 pointer-events-none" : ""}>
                  {/* Kaldıraç */}
                  <div className="mb-4">
                    <p className="text-xs text-slate-400 mb-2">Kaldıraç: <span className="font-bold text-yellow-400">{(data as any).leverage ?? 5}x</span></p>
                    <div className="flex gap-2 flex-wrap">
                      {[1,2,3,5,10,20].map(lv => (
                        <button key={lv} onClick={() => fetch(`${API}/settings?leverage=${lv}`, { method: "POST" })}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all
                            ${(data as any).leverage === lv ? "bg-yellow-500/20 border-yellow-500/40 text-yellow-300" : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500"}`}>
                          {lv}x
                        </button>))}
                    </div>
                  </div>

                  {/* Long / Short */}
                  <div className="mb-4">
                    <p className="text-xs text-slate-400 mb-2">Yön</p>
                    <div className="flex gap-2">
                      <button onClick={() => setFuturesSide("LONG")}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all
                          ${futuresSide === "LONG" ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300" : "bg-slate-800 border-slate-700 text-slate-500"}`}>
                        ▲ LONG
                      </button>
                      <button onClick={() => setFuturesSide("SHORT")}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all
                          ${futuresSide === "SHORT" ? "bg-red-500/20 border-red-500/40 text-red-300" : "bg-slate-800 border-slate-700 text-slate-500"}`}>
                        ▼ SHORT
                      </button>
                    </div>
                  </div>

                  {/* Miktar */}
                  <div className="mb-4">
                    <p className="text-xs text-slate-400 mb-2">Marjin (USDT): <span className="font-bold text-white">{futuresAmount}</span></p>
                    <input type="range" min={5} max={500} step={5} value={futuresAmount}
                      onChange={e => setFuturesAmount(Number(e.target.value))}
                      className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                      style={{ accentColor: futuresSide === "LONG" ? "#10b981" : "#ef4444" }}/>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Nominal: ~{(futuresAmount * ((data as any).leverage ?? 5)).toFixed(0)} USDT ({(data as any).leverage ?? 5}x)
                    </p>
                  </div>

                  {/* Butonlar */}
                  <div className="flex gap-2">
                    <button onClick={openFutures}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all
                        ${futuresSide === "LONG" ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30"
                          : "bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30"}`}>
                      {futuresSide} Aç
                    </button>
                    <button onClick={closeFutures}
                      className="px-4 py-2.5 rounded-xl text-sm font-bold bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 transition-all">
                      Kapat
                    </button>
                  </div>

                  {futuresMsg && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="mt-3 text-xs text-center text-slate-400">{futuresMsg}</motion.p>)}

                  {/* Açık Futures Pozisyon */}
                  {(data as any).futures_position?.active && (
                    <div className="mt-4 p-3 rounded-xl bg-slate-800/50 border border-slate-700 text-xs space-y-2">
                      <p className="font-bold text-white">Açık Futures Pozisyon</p>
                      {Object.entries((data as any).futures_position).filter(([k]) => k !== "active").map(([k,v]) => (
                        <div key={k} className="flex justify-between">
                          <span className="text-slate-500 capitalize">{k.replace(/_/g," ")}</span>
                          <span className="text-white font-mono">{String(v)}</span>
                        </div>))}
                    </div>)}
                </div>
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      <p className="text-center text-[10px] text-slate-700 mt-6">
        Binance Testnet · Gerçek para kullanılmıyor · {data.last_update && `Son: ${data.last_update}`}
      </p>

      {/* Settings Panel */}
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} current={{
        rsi_period:      (data as any).rsi_period ?? 14,
        rsi_oversold:    (data as any).rsi_oversold ?? 30,
        rsi_overbought:  (data as any).rsi_overbought ?? 70,
        take_profit_pct: (data as any).take_profit_pct ?? 0.03,
        stop_loss_pct:   (data as any).stop_loss_pct ?? 0.02,
        trade_amount:    (data as any).trade_amount ?? 10,
        leverage:        (data as any).leverage ?? 5,
        telegram_enabled:(data as any).telegram_enabled ?? false,
        futures_enabled: (data as any).futures_enabled ?? false,
        active_symbols:  (data as any).active_symbols ?? ["BTCUSDT"],
        loop_interval:   (data as any).loop_interval ?? 10,
      }}/>
    </div>
  );
}
