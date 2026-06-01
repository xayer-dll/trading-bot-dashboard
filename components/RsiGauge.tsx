"use client";
import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";

export default function RsiGauge({ rsi }: { rsi: number }) {
  const spring = useSpring(rsi, { stiffness: 60, damping: 20 });

  useEffect(() => { spring.set(rsi); }, [rsi, spring]);

  const angle = useTransform(spring, [0, 100], [-90, 90]);
  const color = rsi < 30 ? "#10b981" : rsi > 70 ? "#ef4444" : "#f59e0b";
  const label = rsi < 30 ? "Asiri Satilmis" : rsi > 70 ? "Asiri Alinmis" : "Notrl";

  const r = 70, cx = 100, cy = 95;
  function arc(a1: number, a2: number) {
    const t = (d: number) => (d * Math.PI) / 180;
    return `M ${cx + r * Math.cos(t(a1 - 90))} ${cy + r * Math.sin(t(a1 - 90))}
            A ${r} ${r} 0 ${a2 - a1 > 180 ? 1 : 0} 1
            ${cx + r * Math.cos(t(a2 - 90))} ${cy + r * Math.sin(t(a2 - 90))}`;
  }

  return (
    <div className="flex flex-col items-center select-none">
      <svg width="200" height="110" viewBox="0 0 200 110">
        {/* Track */}
        <path d={arc(0, 180)} fill="none" stroke="#1e2d4a" strokeWidth={10} strokeLinecap="round" />
        {/* Zones */}
        <path d={arc(0,  54)} fill="none" stroke="#10b98133" strokeWidth={10} strokeLinecap="round" />
        <path d={arc(54,126)} fill="none" stroke="#f59e0b22" strokeWidth={10} strokeLinecap="round" />
        <path d={arc(126,180)} fill="none" stroke="#ef444433" strokeWidth={10} strokeLinecap="round" />
        {/* Active arc */}
        <motion.path
          d={arc(0, (rsi / 100) * 180)}
          fill="none" stroke={color} strokeWidth={10} strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
        {/* Labels */}
        <text x="14"  y="105" fill="#10b981" fontSize="9" fontWeight="600">30</text>
        <text x="93"  y="22"  fill="#94a3b8" fontSize="9" fontWeight="600">50</text>
        <text x="178" y="105" fill="#ef4444" fontSize="9" fontWeight="600">70</text>
        {/* Needle */}
        <motion.line
          x1={cx} y1={cy} x2={cx} y2={cy - r + 8}
          stroke={color} strokeWidth={3} strokeLinecap="round"
          style={{
            transformOrigin: `${cx}px ${cy}px`,
            rotate: angle,
          }}
        />
        <circle cx={cx} cy={cy} r={5} fill={color} />
      </svg>

      <motion.div
        key={Math.floor(rsi)}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center -mt-1"
      >
        <p className="text-3xl font-black" style={{ color }}>{rsi.toFixed(1)}</p>
        <p className="text-xs mt-0.5" style={{ color }}>{label}</p>
      </motion.div>
    </div>
  );
}
