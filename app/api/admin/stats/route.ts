import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  try {
    // Total count
    const totalRes = await sql`SELECT COUNT(*)::int AS count FROM responses`;
    const total: number = totalRes[0]?.count ?? 0;

    if (total === 0) {
      return NextResponse.json({
        total: 0,
        feeling: [],
        noticed: [],
        wouldUseAgain: [],
        wordCloud: [],
        avgPulseBefore: null,
        avgPulseAfter: null,
        pulseTrend: [],
        recentRespondents: [],
      });
    }

    // Q2 — feeling distribution
    const feelingRows = await sql`
      SELECT feeling AS value, COUNT(*)::int AS count
      FROM responses
      GROUP BY feeling
      ORDER BY count DESC
    `;

    // Q4 — would use again distribution
    const useAgainRows = await sql`
      SELECT would_use_again AS value, COUNT(*)::int AS count
      FROM responses
      GROUP BY would_use_again
      ORDER BY count DESC
    `;

    // Q3 — noticed (comma-separated → unnest → count each tag)
    const noticedRows = await sql`
      SELECT TRIM(tag) AS value, COUNT(*)::int AS count
      FROM responses,
           UNNEST(STRING_TO_ARRAY(noticed, ',')) AS tag
      WHERE TRIM(tag) != ''
      GROUP BY TRIM(tag)
      ORDER BY count DESC
    `;

    // Pulse averages (only rows where value is a valid number)
    const pulseAvgRes = await sql`
      SELECT
        ROUND(
          AVG(CASE WHEN pulse_before ~ '^[0-9]+\.?[0-9]*$'
                   THEN pulse_before::numeric ELSE NULL END)::numeric, 1
        ) AS avg_before,
        ROUND(
          AVG(CASE WHEN pulse_after ~ '^[0-9]+\.?[0-9]*$'
                   THEN pulse_after::numeric ELSE NULL END)::numeric, 1
        ) AS avg_after
      FROM responses
    `;
    const avgPulseBefore = pulseAvgRes[0]?.avg_before
      ? Number(pulseAvgRes[0].avg_before)
      : null;
    const avgPulseAfter = pulseAvgRes[0]?.avg_after
      ? Number(pulseAvgRes[0].avg_after)
      : null;

    // Word cloud — one_word frequency (top 15)
    const wordCloudRows = await sql`
      SELECT LOWER(TRIM(one_word)) AS value, COUNT(*)::int AS count
      FROM responses
      WHERE TRIM(one_word) != ''
      GROUP BY LOWER(TRIM(one_word))
      ORDER BY count DESC
      LIMIT 15
    `;

    // Pulse trend — last 10 responses (only numeric pulse values)
    const trendRows = await sql`
      SELECT
        id,
        pulse_before,
        pulse_after
      FROM responses
      ORDER BY id DESC
      LIMIT 10
    `;

    const pulseTrend = [...trendRows]
      .reverse()
      .map((r) => ({
        label: `#${r.id}`,
        before: /^[0-9]+\.?[0-9]*$/.test(String(r.pulse_before).trim())
          ? Number(r.pulse_before)
          : null,
        after: /^[0-9]+\.?[0-9]*$/.test(String(r.pulse_after).trim())
          ? Number(r.pulse_after)
          : null,
      }))
      .filter((r) => r.before !== null || r.after !== null);

    // Recent responses — last 10
    const recentRespondents = await sql`
      SELECT id, feeling, would_use_again, created_at
      FROM responses
      ORDER BY id DESC
      LIMIT 10
    `;

    return NextResponse.json({
      total,
      feeling: feelingRows,
      noticed: noticedRows,
      wouldUseAgain: useAgainRows,
      wordCloud: wordCloudRows,
      avgPulseBefore,
      avgPulseAfter,
      pulseTrend,
      recentRespondents,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to load stats.' }, { status: 500 });
  }
}
