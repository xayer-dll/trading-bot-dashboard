"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Settings, Save, MessageCircle, Zap, Target, ShieldAlert, TrendingUp, DollarSign, Timer } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface Props {
  open: boolean;
  onClose: () => void;
  current: {
    rsi_period: number; rsi_oversold: number; rsi_overbought: number;
    take_profit_pct: number; stop_loss_pct: number; trade_amount: number;
    leverage: number; loop_interval: number; telegram_enabled: boolean;
    futures_enabled: boolean; active_symbols: string[];
  };
}

const AVAILABLE_SYMBOLS = ["BTCUSDT","ETHUSDT","SOLUSDT","BNBUSDT","ADAUSDT"];

function Slider({ label, value, min, max, step = 1, format, onChange, icon: Icon, color }: {
  label: string; value: number; min: number; max: number; step?: number;
  format: (v: number) => string; onChange: (v: number) => void;
  icon: React.ElementType; color: string;
}) {
  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon size={13} style={{ color }} />
          <span className="text-xs text-slate-300">{label}</span>
        </div>
        <span className="text-sm font-bold" style={{ color }}>{format(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{ accentColor: color, background: `linear-gradient(to right, ${color} ${((value-min)/(max-min))*100}%, #1e2d4a ${((value-min)/(max-min))*100}%)` }}
      />
      <div className="flex justify-between text-[10px] text-slate-600 mt-1">
        <span>{format(min)}</span><span>{format(max)}</span>
      </div>
    </div>
  );
}

export default function SettingsPanel({ open, onClose, current }: Props) {
  const [rsiPeriod,     setRsiPeriod]     = useState(current.rsi_period);
  const [rsiOversold,   setRsiOversold]   = useState(current.rsi_oversold);
  const [rsiOverbought, setRsiOverbought] = useState(current.rsi_overbought);
  const [tp,            setTp]            = useState(current.take_profit_pct * 100);
  const [sl,            setSl]            = useState(current.stop_loss_pct * 100);
  const [amount,        setAmount]        = useState(current.trade_amount);
  const [leverage,      setLeverage]      = useState(current.leverage);
  const [interval,     setIntervalSec]   = useState(current.loop_interval ?? 10);
  const [symbols,       setSymbols]       = useState<string[]>(current.active_symbols);
  const [saving,        setSaving]        = useState(false);
  const [saved,         setSaved]         = useState(false);

  const toggleSymbol = (s: string) => {
    if (s === symbols[0]) return; // ana çift kaldırılamaz
    setSymbols(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const save = async () => {
    setSaving(true);
    try {
      const p = new URLSearchParams({
        rsi_period:      rsiPeriod.toString(),
        rsi_oversold:    rsiOversold.toString(),
        rsi_overbought:  rsiOverbought.toString(),
        take_profit_pct: (tp / 100).toString(),
        stop_loss_pct:   (sl / 100).toString(),
        trade_amount:    amount.toString(),
        leverage:        leverage.toString(),
        loop_interval:   interval.toString(),
      });
      await fetch(`${API}/settings?${p}`, { method: "POST" });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 h-full w-80 z-50 overflow-y-auto"
            style={{ background: "#0b1526", borderLeft: "1px solid #1e2d4a" }}
          >
            {/* Başlık */}
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Settings size={16} className="text-blue-400" />
                <span className="font-bold text-white">Ayarlar</span>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors">
                <X size={15} className="text-slate-400" />
              </button>
            </div>

            <div className="p-5 space-y-6">
              {/* RSI Ayarları */}
              <section>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                  <TrendingUp size={11} /> RSI Parametreleri
                </p>
                <Slider label="RSI Periyodu" value={rsiPeriod} min={5} max={30}
                  format={v => `${v} mum`} onChange={setRsiPeriod}
                  icon={TrendingUp} color="#3b82f6" />
                <Slider label="Aşırı Satılmış (BUY)" value={rsiOversold} min={10} max={45}
                  format={v => `< ${v}`} onChange={setRsiOversold}
                  icon={TrendingUp} color="#10b981" />
                <Slider label="Aşırı Alınmış (SELL)" value={rsiOverbought} min={55} max={90}
                  format={v => `> ${v}`} onChange={setRsiOverbought}
                  icon={TrendingUp} color="#ef4444" />
              </section>

              {/* Risk Yönetimi */}
              <section>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                  <ShieldAlert size={11} /> Risk Yönetimi
                </p>
                <Slider label="Take-Profit" value={tp} min={0.5} max={10} step={0.1}
                  format={v => `%${v.toFixed(1)}`} onChange={setTp}
                  icon={Target} color="#10b981" />
                <Slider label="Stop-Loss" value={sl} min={0.5} max={5} step={0.1}
                  format={v => `%${v.toFixed(1)}`} onChange={setSl}
                  icon={ShieldAlert} color="#ef4444" />
                <Slider label="İşlem Miktarı" value={amount} min={5} max={500} step={5}
                  format={v => `${v} USDT`} onChange={setAmount}
                  icon={DollarSign} color="#8b5cf6" />
              </section>

              {/* Futures Kaldıraç */}
              <section>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                  <Zap size={11} /> Futures Kaldıraç
                </p>
                <Slider label="Kaldıraç" value={leverage} min={1} max={20}
                  format={v => `${v}x`} onChange={setLeverage}
                  icon={Zap} color="#f59e0b" />
                {!current.futures_enabled && (
                  <p className="text-[10px] text-amber-500/70 bg-amber-500/10 px-3 py-2 rounded-lg">
                    Futures API key gerekli. config.py → FUTURES_API_KEY / FUTURES_ENABLED=True
                  </p>
                )}
              </section>

              {/* Bot Hızı */}
              <section>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                  <Timer size={11} /> Bot Hızı
                </p>
                <Slider label="Kontrol Sıklığı" value={interval} min={5} max={120} step={5}
                  format={v => v < 60 ? `${v}sn` : `${(v/60).toFixed(0)}dk`}
                  onChange={setIntervalSec} icon={Timer} color="#06b6d4" />
                <p className="text-[10px] text-slate-500 bg-slate-800/50 px-3 py-2 rounded-lg">
                  {interval <= 15 ? "Scalping (hızlı, dikkatli ol)" :
                   interval <= 30 ? "Aktif trading (tavsiye edilen)" :
                   interval <= 60 ? "Normal trading" : "Swing trading (yavaş)"}
                  {" · "}Günde ~{Math.floor(86400/interval).toLocaleString()} kontrol
                </p>
              </section>

              {/* Çiftler */}
              <section>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-3">
                  Takip Edilen Çiftler
                </p>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_SYMBOLS.map(s => (
                    <button key={s} onClick={() => toggleSymbol(s)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all
                        ${symbols.includes(s)
                          ? "bg-blue-500/20 border-blue-500/50 text-blue-300"
                          : "bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-500"
                        } ${s === symbols[0] ? "opacity-60 cursor-not-allowed" : ""}`}>
                      {s.replace("USDT", "")}
                    </button>
                  ))}
                </div>
              </section>

              {/* Telegram */}
              <section>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <MessageCircle size={11} /> Telegram Bildirimleri
                </p>
                <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs
                  ${current.telegram_enabled
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    : "border-slate-700 bg-slate-800/50 text-slate-500"}`}>
                  <span className={`w-2 h-2 rounded-full ${current.telegram_enabled ? "bg-emerald-400" : "bg-slate-600"}`} />
                  {current.telegram_enabled ? "Aktif" : "Pasif — config.py ayarla"}
                </div>
                {!current.telegram_enabled && (
                  <ol className="mt-3 space-y-1 text-[10px] text-slate-500">
                    <li>1. @BotFather → /newbot → TOKEN al</li>
                    <li>2. Botuna /start at</li>
                    <li>3. getUpdates → chat_id bul</li>
                    <li>4. config.py → TELEGRAM_ENABLED=True</li>
                  </ol>
                )}
              </section>

              {/* Kaydet */}
              <motion.button
                whileTap={{ scale: 0.97 }} onClick={save} disabled={saving}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all
                  ${saved
                    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 border"
                    : "bg-blue-500/20 border-blue-500/40 text-blue-300 border hover:bg-blue-500/30"
                  }`}>
                <Save size={14} />
                {saving ? "Kaydediliyor..." : saved ? "Kaydedildi!" : "Kaydet"}
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
