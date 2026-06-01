"use client";
import {
  ResponsiveContainer, ComposedChart, Area, Line,
  XAxis, YAxis, Tooltip, ReferenceLine, CartesianGrid,
} from "recharts";
import { PricePoint, Trade } from "@/hooks/useBotData";

interface Props { history: PricePoint[]; trades: Trade[]; }

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs shadow-xl">
      <p className="text-slate-400 mb-1">{label}</p>
      <p className="text-white font-bold">
        ${payload[0]?.value?.toLocaleString("en-US", { minimumFractionDigits: 2 })}
      </p>
    </div>
  );
};

// BUY/SELL noktaları için özel dot
const CustomDot = (props: any) => {
  const { cx, cy, payload } = props;
  if (!payload.signal || payload.signal === "HOLD") return null;
  const isBuy = payload.signal === "BUY";
  return (
    <g>
      <circle cx={cx} cy={cy} r={6} fill={isBuy ? "#10b981" : "#ef4444"}
        stroke={isBuy ? "#6ee7b7" : "#fca5a5"} strokeWidth={2} />
      <text x={cx} y={cy - 10} textAnchor="middle" fontSize={9}
        fill={isBuy ? "#10b981" : "#ef4444"} fontWeight="bold">
        {isBuy ? "B" : "S"}
      </text>
    </g>
  );
};

export default function PriceChart({ history, trades }: Props) {
  if (!history.length) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-600 text-sm">
        Botu başlat → grafik dolacak
      </div>
    );
  }

  const prices = history.map(h => h.price);
  const minP   = Math.min(...prices) * 0.9995;
  const maxP   = Math.max(...prices) * 1.0005;

  // Tick sayısını azalt (kalabalık görünmesini önle)
  const ticks = [...new Set(history.filter((_, i) => i % 10 === 0).map(h => h.t))];

  return (
    <ResponsiveContainer width="100%" height={200}>
      <ComposedChart data={history} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0}   />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#1e2d4a" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="t" ticks={ticks} tick={{ fill: "#475569", fontSize: 10 }}
          axisLine={false} tickLine={false} />
        <YAxis domain={[minP, maxP]} tick={{ fill: "#475569", fontSize: 10 }}
          axisLine={false} tickLine={false} width={70}
          tickFormatter={(v) => `$${(v / 1000).toFixed(1)}K`} />
        <Tooltip content={<CustomTooltip />} />
        <Area dataKey="price" fill="url(#priceGrad)" stroke="#3b82f6"
          strokeWidth={2} dot={<CustomDot />} activeDot={{ r: 4, fill: "#60a5fa" }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
