"use client";

import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "trading-r-tracker-web-v1";

function fmt(n) {
  return Number(n || 0).toFixed(2);
}

function toCsvValue(value) {
  const safe = String(value ?? "").replace(/"/g, '""');
  return `"${safe}"`;
}

export default function Page() {
  const [trades, setTrades] = useState([]);
  const [resultFilter, setResultFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    pair: "",
    setup: "",
    r: "",
    notes: ""
  });

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) setTrades(parsed);
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trades));
  }, [trades]);

  const filteredTrades = useMemo(() => {
    let items = [...trades];

    if (resultFilter === "wins") items = items.filter((t) => Number(t.r) > 0);
    if (resultFilter === "losses") items = items.filter((t) => Number(t.r) < 0);
    if (resultFilter === "breakeven") items = items.filter((t) => Number(t.r) === 0);

    const q = search.trim().toLowerCase();
    if (q) {
      items = items.filter((t) =>
        [t.date, t.pair, t.setup, t.notes, String(t.r)].some((v) =>
          String(v || "").toLowerCase().includes(q)
        )
      );
    }

    return items.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [trades, resultFilter, search]);

  const stats = useMemo(() => {
    const total = trades.length;
    const wins = trades.filter((t) => Number(t.r) > 0);
    const losses = trades.filter((t) => Number(t.r) < 0);
    const breakeven = trades.filter((t) => Number(t.r) === 0);

    const totalR = trades.reduce((sum, t) => sum + Number(t.r || 0), 0);
    const avgR = total ? totalR / total : 0;
    const winRate = total ? (wins.length / total) * 100 : 0;
    const avgWin = wins.length ? wins.reduce((s, t) => s + Number(t.r), 0) / wins.length : 0;
    const avgLoss = losses.length ? losses.reduce((s, t) => s + Number(t.r), 0) / losses.length : 0;

    let running = 0;
    let peak = 0;
    let maxDrawdown = 0;

    for (const t of [...trades].sort((a, b) => new Date(a.date) - new Date(b.date))) {
      running += Number(t.r || 0);
      peak = Math.max(peak, running);
      maxDrawdown = Math.min(maxDrawdown, running - peak);
    }

    return {
      total,
      wins: wins.length,
      losses: losses.length,
      breakeven: breakeven.length,
      totalR,
      avgR,
      winRate,
      avgWin,
      avgLoss,
      maxDrawdown
    };
  }, [trades]);

  const equity = useMemo(() => {
    let running = 0;
    return [...trades]
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map((t, index) => {
        running += Number(t.r || 0);
        return { x: index + 1, value: running };
      });
  }, [trades]);

  const chart = useMemo(() => {
    if (!equity.length) return null;

    const width = 700;
    const height = 220;
    const padding = 24;
    const values = equity.map((p) => p.value);
    const min = Math.min(...values, 0);
    const max = Math.max(...values, 0);
    const range = max - min || 1;

    const points = equity
      .map((p, i) => {
        const x = padding + (i * (width - padding * 2)) / Math.max(equity.length - 1, 1);
        const y = height - padding - ((p.value - min) / range) * (height - padding * 2);
        return `${x},${y}`;
      })
      .join(" ");

    const zeroY = height - padding - ((0 - min) / range) * (height - padding * 2);

    return { width, height, padding, points, zeroY };
  }, [equity]);

  function addTrade(e) {
    e.preventDefault();
    const rValue = Number(form.r);
    if (Number.isNaN(rValue)) return;

    const trade = {
      id: crypto.randomUUID(),
      date: form.date,
      pair: form.pair.trim(),
      setup: form.setup.trim(),
      r: rValue,
      notes: form.notes.trim(),
      createdAt: new Date().toISOString()
    };

    setTrades((prev) => [trade, ...prev]);
    setForm({
      date: new Date().toISOString().slice(0, 10),
      pair: "",
      setup: "",
      r: "",
      notes: ""
    });
  }

  function deleteTrade(id) {
    setTrades((prev) => prev.filter((t) => t.id !== id));
  }

  function clearAll() {
    if (window.confirm("Sigur vrei să ștergi toate trade-urile?")) {
      setTrades([]);
    }
  }

  function exportCsv() {
    const header = ["Date", "Pair", "Setup", "R", "Notes"];
    const rows = trades.map((t) => [t.date, t.pair, t.setup, t.r, t.notes]);
    const csv = [header, ...rows].map((row) => row.map(toCsvValue).join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "trading-r-tracker.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="container">
      <div className="topbar">
        <div>
          <h1 className="title">Trading R Tracker</h1>
          <p className="subtitle">Jurnal web pentru win-uri, loss-uri și performanță în R.</p>
        </div>

        <div className="actions">
          <button className="secondary" onClick={exportCsv}>Export CSV</button>
          <button className="danger" onClick={clearAll}>Reset</button>
        </div>
      </div>

      <div className="grid-stats">
        <div className="card">
          <div className="card-label">Total R</div>
          <div className="card-value">{fmt(stats.totalR)}</div>
          <div className="card-sub">Media/trade: {fmt(stats.avgR)} R</div>
        </div>

        <div className="card">
          <div className="card-label">Win-uri</div>
          <div className="card-value">{stats.wins}</div>
          <div className="card-sub">Win rate: {fmt(stats.winRate)}%</div>
        </div>

        <div className="card">
          <div className="card-label">Loss-uri</div>
          <div className="card-value">{stats.losses}</div>
          <div className="card-sub">Break-even: {stats.breakeven}</div>
        </div>

        <div className="card">
          <div className="card-label">Max drawdown</div>
          <div className="card-value">{fmt(stats.maxDrawdown)}</div>
          <div className="card-sub">Avg win: {fmt(stats.avgWin)} | Avg loss: {fmt(stats.avgLoss)}</div>
        </div>
      </div>

      <div className="main-grid">
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Adaugă trade</h2>

          <form onSubmit={addTrade}>
            <div className="two-cols">
              <div className="form-group">
                <label className="form-label">Data</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Pair / activ</label>
                <input
                  placeholder="ex: XAUUSD"
                  value={form.pair}
                  onChange={(e) => setForm({ ...form, pair: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Setup</label>
              <input
                placeholder="ex: breakout, reversal, scalp"
                value={form.setup}
                onChange={(e) => setForm({ ...form, setup: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Rezultat în R</label>
              <input
                placeholder="ex: 2 sau -1"
                value={form.r}
                onChange={(e) => setForm({ ...form, r: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Note</label>
              <textarea
                rows="5"
                placeholder="Ce ai făcut bine, greșeli, context..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>

            <button type="submit" style={{ width: "100%" }}>Salvează trade</button>
          </form>
        </div>

        <div>
          <div className="card" style={{ marginBottom: 24 }}>
            <h2 style={{ marginTop: 0 }}>Equity curve</h2>

            <div className="chart-wrap">
              {chart ? (
                <svg viewBox={`0 0 ${chart.width} ${chart.height}`} className="chart-svg">
                  <line
                    x1={chart.padding}
                    x2={chart.width - chart.padding}
                    y1={chart.zeroY}
                    y2={chart.zeroY}
                    stroke="currentColor"
                    opacity="0.18"
                  />
                  <polyline
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    points={chart.points}
                  />
                </svg>
              ) : (
                <div className="empty" style={{ width: "100%", textAlign: "center" }}>
                  Graficul apare după primele trade-uri.
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <h2 style={{ marginTop: 0 }}>Filtre și istoric</h2>

            <div className="filters">
              <select value={resultFilter} onChange={(e) => setResultFilter(e.target.value)}>
                <option value="all">Toate</option>
                <option value="wins">Doar wins</option>
                <option value="losses">Doar losses</option>
                <option value="breakeven">Doar breakeven</option>
              </select>

              <input
                placeholder="Caută după pair, setup, note..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="trade-list">
              {filteredTrades.length === 0 ? (
                <div className="empty">Nu există trade-uri care să corespundă filtrului.</div>
              ) : (
                filteredTrades.map((t) => (
                  <div key={t.id} className="trade-item">
                    <div style={{ flex: 1 }}>
                      <div className="trade-badges">
                        <span className="badge">{t.date}</span>
                        <span className="badge">{t.pair || "Fără pair"}</span>
                        <span className="badge">{t.setup || "Fără setup"}</span>
                        <span className="badge badge-dark">{fmt(t.r)} R</span>
                      </div>

                      {t.notes ? <div className="note">{t.notes}</div> : null}
                    </div>

                    <button className="small-btn" onClick={() => deleteTrade(t.id)}>
                      Șterge
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
