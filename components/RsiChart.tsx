"use client";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  Tooltip, ReferenceLine, CartesianGrid,
} from "recharts";
import { PricePoint } from "@/hooks/useBotData";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const v = payload[0]?.value ?? 0;
  const color = v < 35 ? "#10b981" : v > 65 ? "#ef4444" : "#f59e0b";
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs shadow-xl">
      <p className="text-slate-400">{label}</p>
      <p className="font-bold" style={{ color }}>RSI: {v.toFixed(2)}</p>
    </div>
  );
};

export default function RsiChart({ history }: { history: PricePoint[] }) {
  if (!history.length) return null;

  const ticks = [...new Set(history.filter((_, i) => i % 10 === 0).map(h => h.t))];

  return (
    <ResponsiveContainer width="100%" height={110}>
      <AreaChart data={history} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="rsiGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#f59e0b" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity={0}    />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#1e2d4a" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="t" ticks={ticks} tick={{ fill: "#475569", fontSize: 10 }}
          axisLine={false} tickLine={false} />
        <YAxis domain={[0, 100]} tick={{ fill: "#475569", fontSize: 10 }}
          axisLine={false} tickLine={false} width={28} ticks={[0, 30, 50, 70, 100]} />
        <Tooltip content={<CustomTooltip />} />
        {/* Asiri satilmis cizgisi (BUY esigi) */}
        <ReferenceLine y={35} stroke="#10b981" strokeDasharray="4 4" strokeWidth={1} />
        {/* Asiri alinmis cizgisi (SELL esigi) */}
        <ReferenceLine y={65} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={1} />
        <Area dataKey="rsi" fill="url(#rsiGrad)" stroke="#f59e0b"
          strokeWidth={1.5} dot={false} activeDot={{ r: 3, fill: "#fbbf24" }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
