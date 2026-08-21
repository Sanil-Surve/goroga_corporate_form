import { NextResponse } from 'next/server';
import db from '@/lib/db';

interface Row {
  feeling: string;
  noticed: string;
  would_use_again: string;
  pulse_before: string;
  pulse_after: string;
  one_word: string;
}

interface CountRow {
  value: string;
  count: number;
}

export async function GET() {
  try {
    const totalRow = db.prepare('SELECT COUNT(*) as count FROM responses').get() as { count: number };
    const total = totalRow.count;

    if (total === 0) {
      return NextResponse.json({
        total: 0,
        feeling: [],
        noticed: [],
        wouldUseAgain: [],
        recentWords: [],
        avgPulseBefore: null,
        avgPulseAfter: null,
      });
    }

    // Q2 — feeling distribution
    const feelingRows = db
      .prepare(
        `SELECT feeling as value, COUNT(*) as count
         FROM responses
         GROUP BY feeling
         ORDER BY count DESC`
      )
      .all() as CountRow[];

    // Q4 — would use again distribution
    const useAgainRows = db
      .prepare(
        `SELECT would_use_again as value, COUNT(*) as count
         FROM responses
         GROUP BY would_use_again
         ORDER BY count DESC`
      )
      .all() as CountRow[];

    // Q3 — noticed (comma-separated, split and count each tag)
    const noticedRaw = db
      .prepare('SELECT noticed FROM responses')
      .all() as { noticed: string }[];

    const noticedMap: Record<string, number> = {};
    for (const row of noticedRaw) {
      const tags = row.noticed.split(',').map((t) => t.trim()).filter(Boolean);
      for (const tag of tags) {
        noticedMap[tag] = (noticedMap[tag] ?? 0) + 1;
      }
    }
    const noticedRows: CountRow[] = Object.entries(noticedMap)
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count);

    // Pulse averages (only numeric values)
    const pulseRows = db
      .prepare('SELECT pulse_before, pulse_after FROM responses')
      .all() as Pick<Row, 'pulse_before' | 'pulse_after'>[];

    const numericBefore = pulseRows
      .map((r) => parseFloat(r.pulse_before))
      .filter((n) => !isNaN(n));
    const numericAfter = pulseRows
      .map((r) => parseFloat(r.pulse_after))
      .filter((n) => !isNaN(n));

    const avg = (arr: number[]) =>
      arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : null;

    // Recent one-word responses (last 20)
    const wordRows = db
      .prepare('SELECT one_word FROM responses ORDER BY id DESC LIMIT 20')
      .all() as { one_word: string }[];

    // Build word frequency map for one-word answers
    const wordMap: Record<string, number> = {};
    for (const row of wordRows) {
      const w = row.one_word.trim().toLowerCase();
      if (w) wordMap[w] = (wordMap[w] ?? 0) + 1;
    }
    const wordCloud = Object.entries(wordMap)
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    // Pulse trend — last 10 responses
    const trendRows = db
      .prepare(
        `SELECT id, pulse_before, pulse_after, created_at
         FROM responses ORDER BY id DESC LIMIT 10`
      )
      .all() as { id: number; pulse_before: string; pulse_after: string; created_at: string }[];

    const pulseTrend = trendRows
      .reverse()
      .map((r, i) => ({
        label: `#${r.id}`,
        before: parseFloat(r.pulse_before) || null,
        after: parseFloat(r.pulse_after) || null,
      }))
      .filter((r) => r.before !== null || r.after !== null);

    // Recent respondents — last 10
    const recentRespondents = db
      .prepare(
        `SELECT id, name, email, phone_no, feeling, would_use_again, created_at
         FROM responses ORDER BY id DESC LIMIT 10`
      )
      .all() as {
        id: number;
        name: string;
        email: string;
        phone_no: string;
        feeling: string;
        would_use_again: string;
        created_at: string;
      }[];

    return NextResponse.json({
      total,
      feeling: feelingRows,
      noticed: noticedRows,
      wouldUseAgain: useAgainRows,
      wordCloud,
      avgPulseBefore: avg(numericBefore),
      avgPulseAfter: avg(numericAfter),
      pulseTrend,
      recentRespondents,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to load stats.' }, { status: 500 });
  }
}
