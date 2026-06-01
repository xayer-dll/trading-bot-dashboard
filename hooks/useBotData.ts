"use client";
import { useEffect, useState, useCallback } from "react";

const API  = process.env.NEXT_PUBLIC_API_URL  ?? "http://localhost:8000";
const WS   = (process.env.NEXT_PUBLIC_WS_URL  ?? "ws://localhost:8000") + "/ws";

export interface Position {
  active: boolean; entry_price: number; quantity: number; pnl: number;
}
export interface Trade {
  time: string; action: "BUY" | "SELL"; price: number; rsi: number; pnl: number | null;
}
export interface PricePoint {
  t: string; price: number; rsi: number; signal?: string | null;
}
export interface EquityPoint {
  t: string; balance: number;
}
export interface Stats {
  total_trades: number; win_trades: number; total_pnl: number;
  win_rate: number; best_trade: number; worst_trade: number;
}
export interface BotState {
  running: boolean; price: number; rsi: number;
  signal: "BUY" | "SELL" | "HOLD"; balance_usdt: number;
  position: Position; last_update: string | null; error: string | null;
  trades: Trade[]; iteration: number;
  price_history: PricePoint[]; equity_history: EquityPoint[];
  stats: Stats; take_profit_pct: number; stop_loss_pct: number;
}

const DEFAULT: BotState = {
  running: false, price: 0, rsi: 0, signal: "HOLD", balance_usdt: 0,
  position: { active: false, entry_price: 0, quantity: 0, pnl: 0 },
  last_update: null, error: null, trades: [], iteration: 0,
  price_history: [], equity_history: [],
  stats: { total_trades: 0, win_trades: 0, total_pnl: 0, win_rate: 0, best_trade: 0, worst_trade: 0 },
  take_profit_pct: 0.03, stop_loss_pct: 0.02,
};

export function useBotData() {
  const [data, setData]           = useState<BotState>(DEFAULT);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading]     = useState(false);

  useEffect(() => {
    let ws: WebSocket;
    let retry: ReturnType<typeof setTimeout>;
    function connect() {
      ws = new WebSocket(WS);
      ws.onopen    = () => setConnected(true);
      ws.onclose   = () => { setConnected(false); retry = setTimeout(connect, 3000); };
      ws.onerror   = () => ws.close();
      // Gelen veriyi default değerlerle birleştir (eksik alan varsa çökmez)
      ws.onmessage = (e) => {
        try {
          const incoming = JSON.parse(e.data);
          setData(prev => ({ ...DEFAULT, ...prev, ...incoming,
            stats:    { ...DEFAULT.stats,    ...(incoming.stats    ?? {}) },
            position: { ...DEFAULT.position, ...(incoming.position ?? {}) },
          }));
        } catch {}
      };
    }
    connect();
    return () => { ws?.close(); clearTimeout(retry); };
  }, []);

  const startBot = useCallback(async () => {
    setLoading(true);
    try { await fetch(`${API}/start`, { method: "POST" }); } finally { setLoading(false); }
  }, []);

  const stopBot = useCallback(async () => {
    setLoading(true);
    try { await fetch(`${API}/stop`, { method: "POST" }); } finally { setLoading(false); }
  }, []);

  const updateSettings = useCallback(async (tp: number, sl: number) => {
    await fetch(`${API}/settings?take_profit=${tp}&stop_loss=${sl}`, { method: "POST" });
  }, []);

  return { data, connected, loading, startBot, stopBot, updateSettings };
}
