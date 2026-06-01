"use client";
import { useEffect, useRef } from "react";
import { animate } from "framer-motion";

interface Props {
  value: number;
  format?: (v: number) => string;
  className?: string;
}

// Sayı değişince smooth animasyonla sayar
export default function AnimatedValue({ value, format, className = "" }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef(value);

  useEffect(() => {
    if (!ref.current) return;
    const from = prev.current;
    prev.current = value;
    const ctrl = animate(from, value, {
      duration: 0.6,
      ease: "easeOut",
      onUpdate: (v) => {
        if (ref.current)
          ref.current.textContent = format ? format(v) : v.toFixed(2);
      },
    });
    return () => ctrl.stop();
  }, [value, format]);

  return (
    <span ref={ref} className={className}>
      {format ? format(value) : value.toFixed(2)}
    </span>
  );
}
