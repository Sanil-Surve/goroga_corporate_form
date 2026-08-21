import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface CountItem {
  value: string;
  count: number;
}

export interface PulseTrendItem {
  label: string;
  before: number | null;
  after: number | null;
}

export interface RecentRespondent {
  id: number;
  feeling: string;
  would_use_again: string;
  created_at: string;
}

export interface Stats {
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

export function generatePdfReport(stats: Stats) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let currentY = 14;

  // Colors
  const primaryTeal: [number, number, number] = [10, 126, 140];
  const darkTeal: [number, number, number] = [6, 77, 87];
  const charcoal: [number, number, number] = [33, 37, 41];
  const mutedGray: [number, number, number] = [107, 114, 128];
  const cardBg: [number, number, number] = [240, 249, 250];

  // ── Header Banner ──
  doc.setFillColor(...primaryTeal);
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Decorative bottom line on header
  doc.setFillColor(167, 221, 227);
  doc.rect(0, 28, pageWidth, 1.5, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('GoRoga Analytics Report', margin, 14);

  // Subtitle & Timestamp
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(220, 245, 248);
  doc.text('Corporate Event · Response & Outcome Summary', margin, 21);

  const generatedDate = new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.text(`Generated: ${generatedDate}`, pageWidth - margin, 21, { align: 'right' });

  currentY = 36;

  // ── Summary KPI Cards ──
  const cardWidth = (pageWidth - margin * 2 - 9) / 4;
  const cardHeight = 22;

  const yesCount = stats.wouldUseAgain.find((r) => r.value === 'Yes')?.count ?? 0;
  const yesPct = stats.total > 0 ? Math.round((yesCount / stats.total) * 100) : 0;

  let pulseDiffStr = '—';
  if (stats.avgPulseBefore !== null && stats.avgPulseAfter !== null) {
    const diff = Number((stats.avgPulseAfter - stats.avgPulseBefore).toFixed(1));
    pulseDiffStr = diff <= 0 ? `${diff} BPM` : `+${diff} BPM`;
  }

  const kpis = [
    { label: 'TOTAL SUBMISSIONS', val: stats.total.toString(), sub: 'All-time responses' },
    {
      label: 'AVG PULSE BEFORE',
      val: stats.avgPulseBefore !== null ? `${stats.avgPulseBefore} BPM` : '—',
      sub: 'Numeric readings',
    },
    {
      label: 'AVG PULSE AFTER',
      val: stats.avgPulseAfter !== null ? `${stats.avgPulseAfter} BPM` : '—',
      sub: `Change: ${pulseDiffStr}`,
    },
    {
      label: 'WOULD USE AGAIN',
      val: `${yesPct}%`,
      sub: `${yesCount} of ${stats.total} said Yes`,
    },
  ];

  kpis.forEach((kpi, idx) => {
    const x = margin + idx * (cardWidth + 3);

    // Card background
    doc.setFillColor(...cardBg);
    doc.roundedRect(x, currentY, cardWidth, cardHeight, 2, 2, 'F');
    doc.setDrawColor(200, 230, 235);
    doc.roundedRect(x, currentY, cardWidth, cardHeight, 2, 2, 'S');

    // Label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(...mutedGray);
    doc.text(kpi.label, x + 3, currentY + 5.5);

    // Main Value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...darkTeal);
    doc.text(kpi.val, x + 3, currentY + 13);

    // Subtext
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(...mutedGray);
    doc.text(kpi.sub, x + 3, currentY + 18.5);
  });

  currentY += cardHeight + 8;

  // Helper to add section title
  const addSectionTitle = (title: string, y: number) => {
    doc.setFillColor(...primaryTeal);
    doc.rect(margin, y - 4, 2.5, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...charcoal);
    doc.text(title, margin + 5, y);
    return y + 4;
  };

  // ── Table 1: Q2 - Feeling Breakdown & Table 2: Q4 - Would Use Again ──
  currentY = addSectionTitle('1. Post-Session Feeling & Reusability Breakdown', currentY);

  const feelingRows = stats.feeling.map((item) => [
    item.value,
    item.count.toString(),
    stats.total > 0 ? `${Math.round((item.count / stats.total) * 100)}%` : '0%',
  ]);

  const useAgainRows = stats.wouldUseAgain.map((item) => [
    item.value,
    item.count.toString(),
    stats.total > 0 ? `${Math.round((item.count / stats.total) * 100)}%` : '0%',
  ]);

  const halfWidth = (pageWidth - margin * 2 - 6) / 2;

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin + halfWidth + 6 },
    tableWidth: halfWidth,
    head: [['How Felt (Q2)', 'Count', 'Share']],
    body: feelingRows.length > 0 ? feelingRows : [['No data', '0', '0%']],
    theme: 'grid',
    headStyles: {
      fillColor: primaryTeal,
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      cellPadding: 2,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: charcoal,
      cellPadding: 2,
    },
    alternateRowStyles: {
      fillColor: [248, 252, 253],
    },
  });

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin + halfWidth + 6, right: margin },
    tableWidth: halfWidth,
    head: [['Would Use Again (Q4)', 'Count', 'Share']],
    body: useAgainRows.length > 0 ? useAgainRows : [['No data', '0', '0%']],
    theme: 'grid',
    headStyles: {
      fillColor: darkTeal,
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      cellPadding: 2,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: charcoal,
      cellPadding: 2,
    },
    alternateRowStyles: {
      fillColor: [248, 252, 253],
    },
  });

  // Get current Y after the tables
  const docAny = doc as unknown as { lastAutoTable?: { finalY?: number } };
  currentY = (docAny.lastAutoTable?.finalY ?? currentY + 30) + 8;

  // ── Table 3: Q3 - What Participants Noticed ──
  currentY = addSectionTitle('2. Noticeable Effects & Observations (Q3 - Multiple Choice)', currentY);

  const noticedRows = stats.noticed.map((item) => [
    item.value,
    item.count.toString(),
    stats.total > 0 ? `${Math.round((item.count / stats.total) * 100)}%` : '0%',
  ]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['Observation / Noticed Effect', 'Submissions Count', 'Percentage of Total Respondents']],
    body: noticedRows.length > 0 ? noticedRows : [['No data recorded', '0', '0%']],
    theme: 'grid',
    headStyles: {
      fillColor: primaryTeal,
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      cellPadding: 2.2,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: charcoal,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 40, halign: 'center' },
      2: { halign: 'center' },
    },
    alternateRowStyles: {
      fillColor: [248, 252, 253],
    },
  });

  currentY = (docAny.lastAutoTable?.finalY ?? currentY + 30) + 8;

  // Check if we have enough space for Word Cloud and Recent Submissions, else add page
  if (currentY + 60 > pageHeight - 20) {
    doc.addPage();
    currentY = 20;
  }

  // ── Section 4: Word Cloud / One-Word Feedback ──
  currentY = addSectionTitle('3. One-Word Experience Keywords (Top Mentions)', currentY);

  if (stats.wordCloud.length > 0) {
    const wordList = stats.wordCloud
      .map((w) => `${w.value} (${w.count})`)
      .join('   •   ');

    doc.setFillColor(...cardBg);
    doc.roundedRect(margin, currentY, pageWidth - margin * 2, 14, 2, 2, 'F');
    doc.setDrawColor(200, 230, 235);
    doc.roundedRect(margin, currentY, pageWidth - margin * 2, 14, 2, 2, 'S');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...darkTeal);
    doc.text(wordList, margin + 4, currentY + 8.5, {
      maxWidth: pageWidth - margin * 2 - 8,
    });

    currentY += 20;
  } else {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(...mutedGray);
    doc.text('No feedback keywords submitted yet.', margin, currentY + 4);
    currentY += 10;
  }

  // ── Section 5: Recent Submissions Table ──
  if (currentY + 50 > pageHeight - 20) {
    doc.addPage();
    currentY = 20;
  }

  currentY = addSectionTitle('4. Recent Submissions (Last 10 Submissions Log)', currentY);

  const recentRows = stats.recentRespondents.map((r) => [
    `#${r.id}`,
    r.feeling || '—',
    r.would_use_again || '—',
    new Date(r.created_at).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
  ]);

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['Submission ID', 'Feeling After Session', 'Would Use Again', 'Timestamp']],
    body: recentRows.length > 0 ? recentRows : [['—', 'No data', '—', '—']],
    theme: 'grid',
    headStyles: {
      fillColor: darkTeal,
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      cellPadding: 2,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: charcoal,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 50 },
      2: { cellWidth: 40 },
      3: { halign: 'left' },
    },
    alternateRowStyles: {
      fillColor: [248, 252, 253],
    },
  });

  // ── Add page numbers and footer to all pages ──
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...mutedGray);

    // Footer divider line
    doc.setDrawColor(220, 225, 230);
    doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);

    doc.text(
      'GoRoga Corporate Event Analytics · Confidential',
      margin,
      pageHeight - 6
    );
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth - margin,
      pageHeight - 6,
      { align: 'right' }
    );
  }

  // Save PDF
  const dateSlug = new Date().toISOString().slice(0, 10);
  doc.save(`GoRoga_Analytics_Report_${dateSlug}.pdf`);
}
