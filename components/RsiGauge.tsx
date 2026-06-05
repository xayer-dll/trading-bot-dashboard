"use client";
import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";

export default function RsiGauge({ rsi }: { rsi: number }) {
  const spring = useSpring(rsi, { stiffness: 60, damping: 20 });
  useEffect(() => { spring.set(rsi); }, [rsi, spring]);

  // RSI 0→100 = ibre acisi: 225° (sol-alt) → -45° (sag-alt)
  // Gosterge 270° kapliyor (sol-alt → ust → sag-alt)
  const needleRotation = useTransform(spring, [0, 100], [-135, 135]);

  const color = rsi < 35 ? "#10b981" : rsi > 65 ? "#ef4444" : "#f59e0b";
  const label = rsi < 35 ? "AL Bolgesi"
              : rsi > 65 ? "SAT Bolgesi"
              : "Notr Bolge";

  return (
    <div className="flex flex-col items-center select-none">
      <svg width={200} height={160} viewBox="100 180 800 550">

        {/* ── GOSTERGE ARC'LARI (gosterge.svg) ── */}

        {/* Koyu yesil (sag ust) — RSI 50-75 bolge */}
        <path d="M929.55,683.16h-164.4c-1.09-67.72-27.45-131.31-74.56-179.97l116.25-116.25c37.98,38.75,67.91,83.62,88.97,133.42,21.83,51.62,33.18,106.37,33.74,162.8Z"
          fill="#318754" opacity="0.85" />

        {/* Kirmizi (sol ust) — RSI 25-0 bolge */}
        <path d="M193.16,386.94l116.25,116.25c-47.11,48.67-73.47,112.25-74.56,179.97H70.45c.56-56.44,11.91-111.19,33.74-162.8,21.06-49.8,50.99-94.67,88.97-133.42Z"
          fill="#d83d3d" opacity="0.85" />

        {/* Acik yesil (sag) — RSI 75-100 bolge */}
        <path d="M800.62,380.71l-116.26,116.25c-48.66-47.11-112.24-73.44-179.97-74.54v-164.41c56.44.56,111.19,11.9,162.8,33.73,49.8,21.06,94.67,50.99,133.42,88.97Z"
          fill="#88cc4c" opacity="0.85" />

        {/* Sari (sol) — RSI 25-50 bolge */}
        <path d="M495.6,422.42c-67.72,1.1-131.31,27.43-179.97,74.54l-116.26-116.25c38.75-37.97,83.62-67.91,133.42-88.97,51.62-21.83,106.37-33.17,162.8-33.73v164.41Z"
          fill="#ffc536" opacity="0.85" />

        {/* ── ETIKETLER ── */}
        <text x="65" y="720" fill="#d83d3d" fontSize="48" fontWeight="700" textAnchor="middle">0</text>
        <text x="160" y="370" fill="#ffc536" fontSize="48" fontWeight="700" textAnchor="middle">25</text>
        <text x="500" y="230" fill="#88cc4c" fontSize="48" fontWeight="700" textAnchor="middle">50</text>
        <text x="840" y="370" fill="#318754" fontSize="48" fontWeight="700" textAnchor="middle">75</text>
        <text x="940" y="720" fill="#88cc4c" fontSize="48" fontWeight="700" textAnchor="middle">100</text>

        {/* ── IBRE (ibre.svg — merkez 500,683) ── */}
        <motion.g
          style={{
            transformOrigin: "500px 683px",
            rotate: needleRotation,
          }}
        >
          {/* Ibre govde + ok ucu (tek parca SVG) */}
          <path
            d="M493.07,633.58c-18.3,2.37-34.94,13.98-42.89,32.1-12.08,27.51.42,59.62,27.94,71.7,27.51,12.08,59.62-.42,71.7-27.94,7.96-18.12,5.25-38.22-5.39-53.3,33.72-95.08,48.55-180.3,48.55-180.3,0,0-52.72,68.58-99.91,157.74Z"
            fill={color}
          />
          {/* Ibre merkez delik */}
          <path
            d="M526.22,699.08c-6.35,14.48-23.25,21.06-37.74,14.7-14.48-6.35-21.06-23.25-14.7-37.74,6.35-14.48,23.25-21.06,37.74-14.7,14.48,6.35,21.06,23.25,14.7,37.74Z"
            fill="#0f172a"
          />
        </motion.g>

        {/* ── MERKEZ KAPAK ── */}
        <circle cx="500" cy="683" r="45" fill="#0f172a" stroke="#334155" strokeWidth="3" />
        <circle cx="500" cy="683" r="22" fill={color} opacity="0.85" />
        <circle cx="500" cy="683" r="9" fill="#0f172a" />

      </svg>

      {/* ── DEGER ── */}
      <motion.div
        key={Math.floor(rsi / 3)}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="text-center -mt-2"
      >
        <p className="text-3xl font-black tracking-tight" style={{ color }}>
          {rsi.toFixed(1)}
        </p>
        <p className="text-[11px] mt-0.5 font-semibold" style={{ color }}>{label}</p>
      </motion.div>
    </div>
  );
}
