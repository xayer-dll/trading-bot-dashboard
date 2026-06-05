"use client";
import { useEffect, useRef, memo } from "react";

interface Props {
  symbol?: string;
  theme?: "dark" | "light";
  height?: number;
}

function TradingViewChart({ symbol = "BINANCE:BTCUSDT", theme = "dark", height = 400 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Onceki widget'i temizle
    containerRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: symbol,
      interval: "1",
      timezone: "Europe/Istanbul",
      theme: theme,
      style: "1",  // Candlestick
      locale: "tr",
      allow_symbol_change: true,
      calendar: false,
      support_host: "https://www.tradingview.com",
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      studies: [
        "RSI@tv-basicstudies",
        "MACD@tv-basicstudies",
        "BB@tv-basicstudies",
      ],
      backgroundColor: "rgba(6, 13, 30, 1)",
      gridColor: "rgba(30, 45, 74, 0.3)",
    });

    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [symbol, theme]);

  return (
    <div className="tradingview-widget-container" style={{ height, width: "100%" }}>
      <div ref={containerRef} style={{ height: "100%", width: "100%" }} />
    </div>
  );
}

export default memo(TradingViewChart);
