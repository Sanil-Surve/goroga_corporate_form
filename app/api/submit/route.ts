import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

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

    const rows = await sql`
      INSERT INTO responses
        (name, email, phone_no, pulse_before, pulse_after, feeling, noticed, would_use_again, one_word)
      VALUES
        (${name}, ${email}, ${phone_no}, ${pulse_before}, ${pulse_after}, ${feeling}, ${noticedStr}, ${would_use_again}, ${one_word})
      RETURNING id
    `;

    return NextResponse.json({ success: true, id: rows[0].id }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
