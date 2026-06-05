"use client";
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { EquityPoint } from "@/hooks/useBotData";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs shadow-xl">
      <p className="text-slate-400">{label}</p>
      <p className="text-white font-bold">
        ${payload[0]?.value?.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
      </p>
    </div>
  );
};

export default function EquityChart({ history }: { history: EquityPoint[] }) {
  if (history.length < 2) {
    return (
      <div className="flex items-center justify-center h-28 text-slate-600 text-sm">
        Bakiye değişince burada görünecek
      </div>
    );
  }

  const start   = history[0].balance;
  const isUp    = history[history.length - 1].balance >= start;
  const color   = isUp ? "#10b981" : "#ef4444";
  const gradId  = isUp ? "eqGreen" : "eqRed";

  const ticks = [...new Set(
    history.filter((_, i) => i % Math.max(1, Math.floor(history.length / 5)) === 0)
      .map(h => h.t)
  )];

  return (
    <ResponsiveContainer width="100%" height={120}>
      <AreaChart data={history} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0}   />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#1e2d4a" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="t" ticks={ticks} tick={{ fill: "#475569", fontSize: 10 }}
          axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#475569", fontSize: 10 }} axisLine={false}
          tickLine={false} width={62}
          tickFormatter={(v) => `$${v.toLocaleString("tr-TR")}`} />
        <Tooltip content={<CustomTooltip />} />
        <Area dataKey="balance" fill={`url(#${gradId})`} stroke={color}
          strokeWidth={2} dot={false} activeDot={{ r: 3 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
