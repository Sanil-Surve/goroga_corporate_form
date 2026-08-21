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

// ─── Color Palette ────────────────────────────────────────────────────────────

const TEAL_PRIMARY = '#0a7e8c';
const TEAL_DARK = '#064d57';

const PIE_COLORS_FEELING = ['#0a7e8c', '#14b8a6', '#38bdf8', '#a78bfa'];
const PIE_COLORS_USE: Record<string, string> = {
  Yes: '#10b981',
  Maybe: '#f59e0b',
  No: '#ef4444',
};

const BAR_COLORS = [
  '#0a7e8c',
  '#0d9488',
  '#06b6d4',
  '#0284c7',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
];

// ─── UI Components ────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  badge?: string;
  badgeType?: 'positive' | 'neutral' | 'accent';
  icon: React.ReactNode;
  gradient: string;
}

const StatCard = ({
  label,
  value,
  sub,
  badge,
  badgeType = 'neutral',
  icon,
  gradient,
}: StatCardProps) => (
  <div className="relative bg-white rounded-2xl p-4 sm:p-5 border border-slate-100/80 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between">
    <div
      className="absolute -top-10 -right-10 w-24 h-24 rounded-full opacity-10 blur-xl pointer-events-none"
      style={{ background: gradient }}
    />
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] sm:text-xs font-semibold tracking-wider text-slate-400 uppercase">
          {label}
        </span>
        <div
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-white shadow-sm"
          style={{ background: gradient }}
        >
          {icon}
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
          {value}
        </span>
        {badge && (
          <span
            className={`text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full ${
              badgeType === 'positive'
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/50'
                : badgeType === 'accent'
                  ? 'bg-teal-50 text-teal-700 border border-teal-200/50'
                  : 'bg-slate-100 text-slate-600'
            }`}
          >
            {badge}
          </span>
        )}
      </div>
    </div>
    {sub && <p className="text-[11px] sm:text-xs text-slate-400 mt-2">{sub}</p>}
  </div>
);

const SectionCard = ({
  title,
  subtitle,
  icon,
  children,
  action,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  action?: React.ReactNode;
}) => (
  <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-100/80 shadow-sm">
    <div className="flex items-start justify-between gap-2 mb-4 sm:mb-5 pb-3 border-b border-slate-100">
      <div>
        <h2 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
          {icon && <span className="text-teal-600">{icon}</span>}
          {title}
        </h2>
        {subtitle && (
          <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">{subtitle}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
    {children}
  </div>
);

// Custom Chart Tooltip
const CustomChartTooltip = ({
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
      <div className="bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-xl shadow-lg px-3 py-2 text-xs">
        {label && <p className="font-semibold text-slate-700 mb-1">{label}</p>}
        {payload.map((p) => (
          <div key={p.name} className="flex items-center gap-2 py-0.5">
            <span
              className="w-2 h-2 rounded-full inline-block"
              style={{ backgroundColor: p.color }}
            />
            <span className="text-slate-500">{p.name}:</span>
            <span className="font-bold text-slate-800">{p.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// ─── Main Admin Component ─────────────────────────────────────────────────────

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
      setError('Could not load statistics. Please check your database connection.');
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

  // Derived Calculations
  const yesCount = stats?.wouldUseAgain.find((r) => r.value === 'Yes')?.count ?? 0;
  const yesPct = stats && stats.total > 0 ? Math.round((yesCount / stats.total) * 100) : 0;

  const pulseDelta =
    stats?.avgPulseBefore !== null &&
    stats?.avgPulseBefore !== undefined &&
    stats?.avgPulseAfter !== null &&
    stats?.avgPulseAfter !== undefined
      ? Number((stats.avgPulseAfter - stats.avgPulseBefore).toFixed(1))
      : null;

  return (
    <div className="min-h-screen bg-[#f8fafb] text-slate-900">
      {/* ── Top Navigation Bar ── */}
      <header
        className="sticky top-0 z-30 shadow-md backdrop-blur-md"
        style={{
          background: `linear-gradient(135deg, ${TEAL_PRIMARY} 0%, ${TEAL_DARK} 100%)`,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                      GoRoga Admin
                    </h1>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Live
                    </span>
                  </div>
                  <p className="text-[11px] text-teal-100/80 hidden sm:block">
                    Corporate Event Post-Session Analytics
                  </p>
                </div>
              </div>

              {/* Mobile Actions in Header */}
              <div className="flex items-center gap-2 sm:hidden">
                <button
                  onClick={handleDownloadPdf}
                  disabled={!stats || loading || isExportingPdf}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white bg-white/20 hover:bg-white/30 transition-all border border-white/30 disabled:opacity-50"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {isExportingPdf ? 'Exporting…' : 'PDF'}
                </button>
                <button
                  onClick={fetchStats}
                  disabled={loading}
                  className="w-8 h-8 rounded-full bg-white text-teal-800 flex items-center justify-center shadow-sm disabled:opacity-50"
                  title="Refresh"
                >
                  <span className={loading ? 'animate-spin' : ''}>↻</span>
                </button>
              </div>
            </div>

            {/* Desktop Actions */}
            <div className="hidden sm:flex items-center gap-3">
              <span className="text-xs text-teal-100/70">
                Updated {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <button
                onClick={handleDownloadPdf}
                disabled={!stats || loading || isExportingPdf}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all shadow-sm hover:brightness-110 active:scale-95 disabled:opacity-50 text-white cursor-pointer bg-[#0e9aaa] border border-white/25"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {isExportingPdf ? 'Generating PDF…' : 'Download PDF Report'}
              </button>
              <button
                onClick={fetchStats}
                disabled={loading}
                className="px-4 py-2 rounded-full text-xs sm:text-sm font-semibold bg-white text-teal-800 shadow-sm transition-all hover:bg-slate-50 active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                <span className={loading ? 'animate-spin' : ''}>↻</span>
                {loading ? 'Refreshing…' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Content Container ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-8 space-y-5 sm:space-y-6">
        {/* Error Notification */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-4 py-3 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={fetchStats} className="font-semibold underline ml-2">
              Retry
            </button>
          </div>
        )}

        {/* Skeleton Loading State */}
        {loading && !stats && (
          <div className="space-y-5 animate-pulse">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-5 h-28 border border-slate-100" />
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl p-6 h-64 border border-slate-100" />
              <div className="bg-white rounded-2xl p-6 h-64 border border-slate-100" />
            </div>
          </div>
        )}

        {stats && (
          <>
            {/* ── KPI Metric Cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <StatCard
                label="Total Responses"
                value={stats.total}
                sub="all-time submissions"
                gradient="linear-gradient(135deg, #0a7e8c, #064d57)"
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
              />

              <StatCard
                label="Avg Pulse Before"
                value={stats.avgPulseBefore !== null ? stats.avgPulseBefore : '—'}
                badge={stats.avgPulseBefore !== null ? 'BPM' : undefined}
                sub="pre-session reading"
                gradient="linear-gradient(135deg, #0284c7, #0369a1)"
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                }
              />

              <StatCard
                label="Avg Pulse After"
                value={stats.avgPulseAfter !== null ? stats.avgPulseAfter : '—'}
                badge={
                  pulseDelta !== null
                    ? `${pulseDelta <= 0 ? '↓ ' : '+ '}${Math.abs(pulseDelta)} BPM`
                    : undefined
                }
                badgeType={pulseDelta !== null && pulseDelta <= 0 ? 'positive' : 'neutral'}
                sub={
                  pulseDelta !== null
                    ? pulseDelta <= 0
                      ? 'net relaxation drop'
                      : 'post-session reading'
                    : 'post-session reading'
                }
                gradient="linear-gradient(135deg, #0d9488, #115e59)"
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                }
              />

              <StatCard
                label="Would Use Again"
                value={`${yesPct}%`}
                badge={`${yesCount}/${stats.total} Yes`}
                badgeType="positive"
                sub="positive satisfaction"
                gradient="linear-gradient(135deg, #10b981, #047857)"
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                  </svg>
                }
              />
            </div>

            {stats.total === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm">
                <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-4 text-2xl">
                  📋
                </div>
                <h3 className="text-lg font-bold text-slate-800">No responses recorded yet</h3>
                <p className="text-slate-400 text-sm mt-1 max-w-sm mx-auto">
                  Share your GoRoga feedback form link with participants to begin gathering live insights.
                </p>
                <a
                  href="/"
                  className="inline-flex items-center gap-2 mt-6 px-6 py-2.5 rounded-full text-white text-sm font-semibold shadow-sm transition-all hover:opacity-90"
                  style={{ background: `linear-gradient(135deg, ${TEAL_PRIMARY}, ${TEAL_DARK})` }}
                >
                  Open Participant Form →
                </a>
              </div>
            ) : (
              <>
                {/* ── Row 1: Feeling (Donut) + Would Use Again (Donut) ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {/* Q2: Feeling Post Session */}
                  <SectionCard
                    title="Q2 · How participants feel now"
                    subtitle="Post-session comparison vs before"
                    icon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    }
                  >
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                      <div className="relative w-48 h-48 flex-shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={stats.feeling}
                              dataKey="count"
                              nameKey="value"
                              cx="50%"
                              cy="50%"
                              outerRadius={75}
                              innerRadius={50}
                              paddingAngle={4}
                              stroke="none"
                            >
                              {stats.feeling.map((_, i) => (
                                <Cell
                                  key={i}
                                  fill={PIE_COLORS_FEELING[i % PIE_COLORS_FEELING.length]}
                                />
                              ))}
                            </Pie>
                            <Tooltip content={<CustomChartTooltip />} />
                          </PieChart>
                        </ResponsiveContainer>
                        {/* Center metric */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className="text-2xl font-bold text-slate-800">
                            {stats.total}
                          </span>
                          <span className="text-[10px] uppercase font-semibold text-slate-400">
                            Responses
                          </span>
                        </div>
                      </div>

                      {/* Custom Clean Legend & Progress List */}
                      <div className="w-full space-y-2.5">
                        {stats.feeling.map((item, i) => {
                          const pct = Math.round((item.count / stats.total) * 100);
                          const color = PIE_COLORS_FEELING[i % PIE_COLORS_FEELING.length];
                          return (
                            <div key={item.value} className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: color }}
                                  />
                                  <span className="font-medium text-slate-700">
                                    {item.value}
                                  </span>
                                </div>
                                <span className="font-semibold text-slate-800">
                                  {item.count} <span className="text-slate-400 font-normal">({pct}%)</span>
                                </span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{ width: `${pct}%`, backgroundColor: color }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </SectionCard>

                  {/* Q4: Would Use Again */}
                  <SectionCard
                    title="Q4 · Would you use GoRoga again?"
                    subtitle="Intent to reuse & recommend"
                    icon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    }
                  >
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                      <div className="relative w-48 h-48 flex-shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={stats.wouldUseAgain}
                              dataKey="count"
                              nameKey="value"
                              cx="50%"
                              cy="50%"
                              outerRadius={75}
                              innerRadius={50}
                              paddingAngle={4}
                              stroke="none"
                            >
                              {stats.wouldUseAgain.map((item, i) => (
                                <Cell
                                  key={i}
                                  fill={
                                    PIE_COLORS_USE[item.value] ||
                                    PIE_COLORS_FEELING[i % PIE_COLORS_FEELING.length]
                                  }
                                />
                              ))}
                            </Pie>
                            <Tooltip content={<CustomChartTooltip />} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className="text-xl font-bold text-emerald-600">
                            {yesPct}%
                          </span>
                          <span className="text-[10px] uppercase font-semibold text-slate-400">
                            Said Yes
                          </span>
                        </div>
                      </div>

                      {/* Custom Clean Legend & Progress List */}
                      <div className="w-full space-y-2.5">
                        {stats.wouldUseAgain.map((item, i) => {
                          const pct = Math.round((item.count / stats.total) * 100);
                          const color =
                            PIE_COLORS_USE[item.value] ||
                            PIE_COLORS_FEELING[i % PIE_COLORS_FEELING.length];
                          return (
                            <div key={item.value} className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: color }}
                                  />
                                  <span className="font-medium text-slate-700">
                                    {item.value}
                                  </span>
                                </div>
                                <span className="font-semibold text-slate-800">
                                  {item.count} <span className="text-slate-400 font-normal">({pct}%)</span>
                                </span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{ width: `${pct}%`, backgroundColor: color }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </SectionCard>
                </div>

                {/* ── Row 2: Q3 What Participants Noticed Most ── */}
                <SectionCard
                  title="Q3 · What participants noticed the most"
                  subtitle="Multiple choices selected by attendees"
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  }
                >
                  <div className="h-64 sm:h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={stats.noticed}
                        margin={{ top: 10, right: 10, left: -20, bottom: 45 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis
                          dataKey="value"
                          tick={{ fontSize: 11, fill: '#64748b' }}
                          angle={-25}
                          textAnchor="end"
                          interval={0}
                          height={50}
                        />
                        <YAxis
                          allowDecimals={false}
                          tick={{ fontSize: 11, fill: '#64748b' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip content={<CustomChartTooltip />} cursor={{ fill: '#f8fafc' }} />
                        <Bar dataKey="count" name="Selections" radius={[6, 6, 0, 0]} maxBarSize={48}>
                          {stats.noticed.map((_, i) => (
                            <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </SectionCard>

                {/* ── Row 3: Pulse Trend ── */}
                {stats.pulseTrend.length > 0 && (
                  <SectionCard
                    title="Pulse Trend · Before vs After Session"
                    subtitle="Real-time BPM comparison across recent submissions"
                    icon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                      </svg>
                    }
                  >
                    <div className="h-64 sm:h-72 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={stats.pulseTrend}
                          margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                          <XAxis
                            dataKey="label"
                            tick={{ fontSize: 11, fill: '#64748b' }}
                            axisLine={{ stroke: '#e2e8f0' }}
                          />
                          <YAxis
                            tick={{ fontSize: 11, fill: '#64748b' }}
                            axisLine={false}
                            tickLine={false}
                            domain={['dataMin - 10', 'dataMax + 10']}
                          />
                          <Tooltip content={<CustomChartTooltip />} />
                          <Line
                            type="monotone"
                            dataKey="before"
                            name="Pulse Before (BPM)"
                            stroke="#0284c7"
                            strokeWidth={2.5}
                            dot={{ r: 4, fill: '#0284c7', strokeWidth: 2, stroke: '#fff' }}
                            activeDot={{ r: 6 }}
                            connectNulls
                          />
                          <Line
                            type="monotone"
                            dataKey="after"
                            name="Pulse After (BPM)"
                            stroke="#10b981"
                            strokeWidth={2.5}
                            dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                            activeDot={{ r: 6 }}
                            connectNulls
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex items-center justify-center gap-6 mt-3 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-1 bg-[#0284c7] rounded-full" />
                        <span className="text-slate-600 font-medium">Before Session (BPM)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-1 bg-[#10b981] rounded-full" />
                        <span className="text-slate-600 font-medium">After Session (BPM)</span>
                      </div>
                    </div>
                  </SectionCard>
                )}

                {/* ── Row 4: One-Word Experience Cloud ── */}
                <SectionCard
                  title="One-Word Experience · Top Mentions"
                  subtitle="How participants summarized their session in one word"
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                  }
                >
                  {stats.wordCloud.length > 0 ? (
                    <div className="flex flex-wrap gap-2 sm:gap-2.5">
                      {stats.wordCloud.map((w, idx) => {
                        const max = stats.wordCloud[0].count;
                        const isTop = w.count === max;
                        return (
                          <span
                            key={w.value}
                            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all hover:scale-105 ${
                              isTop
                                ? 'bg-teal-600 text-white shadow-sm'
                                : idx % 2 === 0
                                  ? 'bg-teal-50 text-teal-800 border border-teal-200/60'
                                  : 'bg-cyan-50 text-cyan-800 border border-cyan-200/60'
                            }`}
                          >
                            <span>{w.value}</span>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                                isTop
                                  ? 'bg-white/25 text-white'
                                  : 'bg-white text-slate-600 border border-slate-200/60'
                              }`}
                            >
                              {w.count}
                            </span>
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-slate-400 text-xs sm:text-sm italic">
                      No word feedback submitted yet.
                    </p>
                  )}
                </SectionCard>

                {/* ── Row 5: Full Response Summary Table ── */}
                <SectionCard
                  title="Full Response Summary"
                  subtitle="Aggregated breakdown across all questions"
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                  }
                >
                  <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <table className="w-full text-xs sm:text-sm text-left">
                      <thead>
                        <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                          <th className="py-2.5 px-3">Question</th>
                          <th className="py-2.5 px-3">Option</th>
                          <th className="py-2.5 px-3 text-center">Count</th>
                          <th className="py-2.5 px-3">Share</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {[
                          { q: 'Q2 · Feeling', rows: stats.feeling },
                          { q: 'Q3 · Noticed', rows: stats.noticed },
                          { q: 'Q4 · Use Again', rows: stats.wouldUseAgain },
                        ].flatMap(({ q, rows }) =>
                          rows.map((r, i) => {
                            const pct = Math.round((r.count / stats.total) * 100);
                            return (
                              <tr key={`${q}-${i}`} className="hover:bg-slate-50/70 transition-colors">
                                <td className="py-2 px-3 text-slate-400 text-xs font-medium">
                                  {i === 0 ? q : ''}
                                </td>
                                <td className="py-2 px-3 font-semibold text-slate-700">
                                  {r.value}
                                </td>
                                <td className="py-2 px-3 text-center text-slate-800 font-bold">
                                  {r.count}
                                </td>
                                <td className="py-2 px-3 min-w-[120px]">
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                      <div
                                        className="h-full rounded-full bg-teal-600 transition-all duration-300"
                                        style={{ width: `${pct}%` }}
                                      />
                                    </div>
                                    <span className="text-slate-500 text-xs font-semibold w-8 text-right">
                                      {pct}%
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </SectionCard>

                {/* ── Row 6: Recent Submissions ── */}
                {stats.recentRespondents.length > 0 && (
                  <SectionCard
                    title="Recent Submissions Log"
                    subtitle="Latest 10 responses received"
                    icon={
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    }
                  >
                    <div className="overflow-x-auto -mx-4 sm:mx-0">
                      <table className="w-full text-xs sm:text-sm text-left">
                        <thead>
                          <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                            <th className="py-2.5 px-3">#</th>
                            <th className="py-2.5 px-3">Feeling</th>
                            <th className="py-2.5 px-3">Use Again</th>
                            <th className="py-2.5 px-3">Submitted</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {stats.recentRespondents.map((r) => (
                            <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-2.5 px-3 font-bold text-teal-700">#{r.id}</td>
                              <td className="py-2.5 px-3">
                                <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200/50">
                                  {r.feeling || '—'}
                                </span>
                              </td>
                              <td className="py-2.5 px-3">
                                <span
                                  className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                                    r.would_use_again === 'Yes'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
                                      : r.would_use_again === 'No'
                                        ? 'bg-red-50 text-red-700 border border-red-200/50'
                                        : 'bg-amber-50 text-amber-700 border border-amber-200/50'
                                  }`}
                                >
                                  {r.would_use_again || '—'}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-slate-500 text-xs whitespace-nowrap">
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

      {/* ── Footer ── */}
      <footer className="text-center py-6 text-xs text-slate-400 border-t border-slate-100 bg-white">
        GoRoga Admin Dashboard · Auto-refresh and on-demand analytics
      </footer>
    </div>
  );
}
