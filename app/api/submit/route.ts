import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      email,
      phone_no,
      pulse_before,
      pulse_after,
      feeling,
      noticed,
      would_use_again,
      one_word,
    } = body;

    if (
      !name || !email || !phone_no ||
      !pulse_before || !pulse_after ||
      !feeling || !noticed || !would_use_again || !one_word
    ) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    const noticedStr = Array.isArray(noticed) ? noticed.join(', ') : noticed;

    const stmt = db.prepare(`
      INSERT INTO responses
        (name, email, phone_no, pulse_before, pulse_after, feeling, noticed, would_use_again, one_word)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      name, email, phone_no,
      pulse_before, pulse_after,
      feeling, noticedStr,
      would_use_again, one_word
    );

    return NextResponse.json({ success: true, id: result.lastInsertRowid }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
