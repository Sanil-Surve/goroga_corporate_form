'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import { generatePdfReport } from '@/lib/generatePdfReport';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CountItem {
  value: string;
  count: number;
}

interface PulseTrendItem {
  label: string;
  before: number | null;
  after: number | null;
}

interface RecentRespondent {
  id: number;
  feeling: string;
  would_use_again: string;
  created_at: string;
}

interface Stats {
  total: number;
  feeling: CountItem[];
  noticed: CountItem[];
  wouldUseAgain: CountItem[];
  wordCloud: CountItem[];
  avgPulseBefore: number | null;
  avgPulseAfter: number | null;
  pulseTrend: PulseTrendItem[];
  recentRespondents: RecentRespondent[];
}

// ─── Palette ──────────────────────────────────────────────────────────────────

const TEAL = '#0a7e8c';
const TEAL_DARK = '#064d57';
const TEAL_MID = '#085f6a';
const TEAL_LIGHT = '#a7dde3';

const PIE_COLORS_FEELING = ['#0a7e8c', '#1aabb9', '#5dcad4', '#a7dde3'];
const PIE_COLORS_USE = ['#0a7e8c', '#e05c5c', '#f5a623'];
const BAR_COLORS = [
  '#0a7e8c', '#0e9aaa', '#13b5c8', '#1dd1e0',
  '#5ee0eb', '#8eedf3', '#b8f4f8',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const StatCard = ({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) => (
  <div className="bg-white rounded-2xl shadow p-6 flex flex-col gap-1">
    <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">{label}</span>
    <span className="text-4xl font-bold" style={{ color: accent ?? TEAL }}>
      {value}
    </span>
    {sub && <span className="text-xs text-gray-400">{sub}</span>}
  </div>
);

const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-white rounded-2xl shadow p-6">
    <h2 className="text-base font-semibold text-gray-700 mb-5 flex items-center gap-2">
      <span
        className="inline-block w-1 h-5 rounded-full"
        style={{ backgroundColor: TEAL }}
      />
      {title}
    </h2>
    {children}
  </div>
);

// Custom tooltip for charts
const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-4 py-2 text-sm">
        {label && <p className="font-medium text-gray-700 mb-1">{label}</p>}
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.color }}>
            {p.name}: <strong>{p.value}</strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Word cloud rendered as styled badges
const WordCloud = ({ words }: { words: CountItem[] }) => {
  if (!words.length) return <p className="text-gray-400 text-sm">No data yet.</p>;
  const max = words[0].count;
  return (
    <div className="flex flex-wrap gap-2">
      {words.map((w) => {
        const size = 12 + Math.round((w.count / max) * 16);
        const opacity = 0.4 + (w.count / max) * 0.6;
        return (
          <span
            key={w.value}
            className="px-3 py-1 rounded-full text-white font-medium"
            style={{
              fontSize: size,
              backgroundColor: TEAL,
              opacity,
            }}
          >
            {w.value}
            {w.count > 1 && (
              <span className="ml-1 text-xs opacity-80">×{w.count}</span>
            )}
          </span>
        );
      })}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/stats', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load');
      const data: Stats = await res.json();
      setStats(data);
      setLastRefresh(new Date());
    } catch {
      setError('Could not load statistics. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDownloadPdf = () => {
    if (!stats) return;
    try {
      setIsExportingPdf(true);
      generatePdfReport(stats);
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f0f9fa' }}>
      {/* Top nav */}
      <header
        className="sticky top-0 z-10 shadow-md"
        style={{ background: `linear-gradient(135deg, ${TEAL} 0%, ${TEAL_DARK} 100%)` }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">GoRoga Admin Panel</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadPdf}
              disabled={!stats || loading || isExportingPdf}
              className="flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold transition-all shadow-sm hover:brightness-110 disabled:opacity-50 text-white cursor-pointer"
              style={{
                backgroundColor: '#0a9396',
                border: '1px solid rgba(255, 255, 255, 0.35)',
              }}
              title="Download comprehensive PDF analytics report"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              {isExportingPdf ? 'Exporting PDF…' : 'Download PDF'}
            </button>

            <button
              onClick={fetchStats}
              disabled={loading}
              className="px-4 py-1.5 rounded-full text-sm font-medium bg-white transition-opacity hover:opacity-80 disabled:opacity-50 cursor-pointer"
              style={{ color: TEAL }}
            >
              {loading ? 'Refreshing…' : '↻ Refresh'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && !stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow p-6 h-28 animate-pulse" />
            ))}
          </div>
        )}

        {stats && (
          <>
            {/* ── Stat cards ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                label="Total Responses"
                value={stats.total}
                sub="all-time submissions"
              />
              <StatCard
                label="Avg Pulse Before"
                value={stats.avgPulseBefore ?? '—'}
                sub="BPM (numeric entries only)"
                accent={TEAL_MID}
              />
              <StatCard
                label="Avg Pulse After"
                value={stats.avgPulseAfter ?? '—'}
                sub="BPM (numeric entries only)"
                accent={TEAL_DARK}
              />
              <StatCard
                label="Would Use Again"
                value={
                  stats.wouldUseAgain.find((r) => r.value === 'Yes')?.count ?? 0
                }
                sub={`of ${stats.total} said Yes`}
                accent="#059669"
              />
            </div>

            {stats.total === 0 ? (
              <div className="bg-white rounded-2xl shadow p-16 text-center">
                <p className="text-5xl mb-4">📋</p>
                <p className="text-gray-500 font-medium">No responses yet.</p>
                <p className="text-gray-400 text-sm mt-1">
                  Charts will appear once users submit the form.
                </p>
                <a
                  href="/"
                  className="inline-block mt-6 px-6 py-2 rounded-full text-white text-sm font-medium"
                  style={{ background: `linear-gradient(135deg, ${TEAL}, ${TEAL_DARK})` }}
                >
                  Go to Form →
                </a>
              </div>
            ) : (
              <>
                {/* ── Row 1: Feeling (pie) + Would Use Again (pie) ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Q2 Pie */}
                  <SectionCard title="Q2 · How did you feel after the session?">
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={stats.feeling}
                          dataKey="count"
                          nameKey="value"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          innerRadius={50}
                          paddingAngle={3}
                          label={({ name, percent }: { name?: string; percent?: number }) =>
                            `${name ?? ''} (${((percent ?? 0) * 100).toFixed(0)}%)`
                          }
                          labelLine={false}
                        >
                          {stats.feeling.map((_, i) => (
                            <Cell
                              key={i}
                              fill={PIE_COLORS_FEELING[i % PIE_COLORS_FEELING.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                          formatter={(v) => (
                            <span className="text-sm text-gray-600">{v}</span>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </SectionCard>

                  {/* Q4 Pie */}
                  <SectionCard title="Q4 · Would you use GoRoga again?">
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={stats.wouldUseAgain}
                          dataKey="count"
                          nameKey="value"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          innerRadius={50}
                          paddingAngle={3}
                          label={({ name, percent }: { name?: string; percent?: number }) =>
                            `${name ?? ''} (${((percent ?? 0) * 100).toFixed(0)}%)`
                          }
                          labelLine={false}
                        >
                          {stats.wouldUseAgain.map((_, i) => (
                            <Cell
                              key={i}
                              fill={PIE_COLORS_USE[i % PIE_COLORS_USE.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                          formatter={(v) => (
                            <span className="text-sm text-gray-600">{v}</span>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </SectionCard>
                </div>

                {/* ── Q3 Bar chart (noticed) ── */}
                <SectionCard title="Q3 · What did participants notice the most? (Checkboxes — multiple select)">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={stats.noticed}
                      margin={{ top: 5, right: 20, left: 0, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="value"
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        angle={-30}
                        textAnchor="end"
                        interval={0}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        label={{
                          value: 'Count',
                          angle: -90,
                          position: 'insideLeft',
                          style: { fill: '#9ca3af', fontSize: 11 },
                        }}
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f0f9fa' }} />
                      <Bar dataKey="count" name="Responses" radius={[6, 6, 0, 0]}>
                        {stats.noticed.map((_, i) => (
                          <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </SectionCard>

                {/* ── Pulse trend line chart ── */}
                {stats.pulseTrend.length > 0 && (
                  <SectionCard title="Pulse Trend · Before vs After (last 10 responses)">
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart
                        data={stats.pulseTrend}
                        margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                          dataKey="label"
                          tick={{ fontSize: 12, fill: '#6b7280' }}
                        />
                        <YAxis
                          tick={{ fontSize: 12, fill: '#6b7280' }}
                          label={{
                            value: 'BPM',
                            angle: -90,
                            position: 'insideLeft',
                            style: { fill: '#9ca3af', fontSize: 11 },
                          }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="before"
                          name="Before Session"
                          stroke={TEAL}
                          strokeWidth={2.5}
                          dot={{ r: 4, fill: TEAL }}
                          connectNulls
                        />
                        <Line
                          type="monotone"
                          dataKey="after"
                          name="After Session"
                          stroke="#f5a623"
                          strokeWidth={2.5}
                          dot={{ r: 4, fill: '#f5a623' }}
                          connectNulls
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </SectionCard>
                )}

                {/* ── Q2 Horizontal bar (alternative view) ── */}
                <SectionCard title="Q2 · Feeling Breakdown — Bar View">
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart
                      layout="vertical"
                      data={stats.feeling}
                      margin={{ top: 5, right: 40, left: 80, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                      <XAxis
                        type="number"
                        allowDecimals={false}
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                      />
                      <YAxis
                        type="category"
                        dataKey="value"
                        tick={{ fontSize: 13, fill: '#374151' }}
                        width={80}
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f0f9fa' }} />
                      <Bar dataKey="count" name="Responses" radius={[0, 6, 6, 0]}>
                        {stats.feeling.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS_FEELING[i % PIE_COLORS_FEELING.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </SectionCard>

                {/* ── Word cloud ── */}
                <SectionCard title="One-Word Experience · Word Cloud (top 15)">
                  <WordCloud words={stats.wordCloud} />
                </SectionCard>

                {/* ── Raw counts table ── */}
                <SectionCard title="Full Response Summary Table">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead>
                        <tr className="border-b border-gray-100">
                          {['Question', 'Option', 'Count', 'Share'].map((h) => (
                            <th
                              key={h}
                              className="pb-2 pr-6 text-xs font-semibold uppercase tracking-wide text-gray-400"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {[
                          { q: 'Q2 · Feeling', rows: stats.feeling },
                          { q: 'Q3 · Noticed', rows: stats.noticed },
                          { q: 'Q4 · Use Again', rows: stats.wouldUseAgain },
                        ].flatMap(({ q, rows }) =>
                          rows.map((r, i) => (
                            <tr key={`${q}-${i}`} className="hover:bg-gray-50 transition-colors">
                              <td className="py-2 pr-6 text-gray-400 text-xs">
                                {i === 0 ? q : ''}
                              </td>
                              <td className="py-2 pr-6 font-medium text-gray-700">
                                {r.value}
                              </td>
                              <td className="py-2 pr-6 text-gray-600">{r.count}</td>
                              <td className="py-2 pr-6">
                                <div className="flex items-center gap-2">
                                  <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                      className="h-full rounded-full"
                                      style={{
                                        width: `${Math.round((r.count / stats.total) * 100)}%`,
                                        backgroundColor: TEAL,
                                      }}
                                    />
                                  </div>
                                  <span className="text-gray-400 text-xs">
                                    {Math.round((r.count / stats.total) * 100)}%
                                  </span>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </SectionCard>

                {/* ── Recent Responses ── */}
                {stats.recentRespondents.length > 0 && (
                  <SectionCard title="Recent Responses (last 10)">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead>
                          <tr className="border-b border-gray-100">
                            {['#', 'Feeling', 'Use Again', 'Submitted'].map((h) => (
                              <th
                                key={h}
                                className="pb-2 pr-4 text-xs font-semibold uppercase tracking-wide text-gray-400 whitespace-nowrap"
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {stats.recentRespondents.map((r) => (
                            <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                              <td className="py-2.5 pr-4 text-gray-400 text-xs">#{r.id}</td>
                              <td className="py-2.5 pr-4">
                                <span
                                  className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                                  style={{ backgroundColor: TEAL_MID }}
                                >
                                  {r.feeling || '—'}
                                </span>
                              </td>
                              <td className="py-2.5 pr-4">
                                <span
                                  className="px-2 py-0.5 rounded-full text-xs font-medium"
                                  style={{
                                    backgroundColor:
                                      r.would_use_again === 'Yes'
                                        ? '#d1fae5'
                                        : r.would_use_again === 'No'
                                          ? '#fee2e2'
                                          : '#fef3c7',
                                    color:
                                      r.would_use_again === 'Yes'
                                        ? '#065f46'
                                        : r.would_use_again === 'No'
                                          ? '#991b1b'
                                          : '#92400e',
                                  }}
                                >
                                  {r.would_use_again || '—'}
                                </span>
                              </td>
                              <td className="py-2.5 pr-4 text-gray-400 text-xs whitespace-nowrap">
                                {new Date(r.created_at).toLocaleString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </SectionCard>
                )}
              </>
            )}
          </>
        )}
      </main>

      <footer className="text-center py-6 text-xs text-gray-400">
        GoRoga Admin · Data refreshed on demand
      </footer>
    </div>
  );
}
