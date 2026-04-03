"use client";

import { useEffect, useState } from "react";

export default function Page() {
  const [r, setR] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem("r");
    if (saved !== null) setR(Number(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("r", r);
  }, [r]);

  return (
    <div
      style={{
        textAlign: "center",
        padding: 40,
        minHeight: "100vh",
        background: "#020617",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        color: "white",
      }}
    >
      <div
        style={{
          fontSize: 64,
          fontWeight: 700,
          marginBottom: 40,
          color: r >= 0 ? "#22c55e" : "#ef4444",
          textShadow:
            r >= 0
              ? "0 0 20px rgba(34,197,94,0.35)"
              : "0 0 20px rgba(239,68,68,0.35)",
        }}
      >
        {r}R
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <button
          onClick={() => setR(r + 1)}
          style={{
            padding: 24,
            fontSize: 22,
            fontWeight: 700,
            borderRadius: 16,
            border: "none",
            background: "#22c55e",
            color: "white",
            boxShadow: "0 0 20px rgba(34,197,94,0.35)",
            cursor: "pointer",
            transition: "transform 0.08s ease, box-shadow 0.2s ease",
          }}
        >
          WIN
        </button>

        <button
          onClick={() => setR(r - 1)}
          style={{
            padding: 24,
            fontSize: 22,
            fontWeight: 700,
            borderRadius: 16,
            border: "none",
            background: "#ef4444",
            color: "white",
            boxShadow: "0 0 20px rgba(239,68,68,0.35)",
            cursor: "pointer",
            transition: "transform 0.08s ease, box-shadow 0.2s ease",
          }}
        >
          LOSS
        </button>
      </div>
    </div>
  );
}
