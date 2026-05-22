// app/api/waitlist/route.js
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/supabase';

// POST — Join the waitlist
export async function POST(request) {
  try {
    const body = await request.json();
    const { email, source } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json({
        success: false,
        error: 'A valid email address is required'
      }, { status: 400 });
    }

    // Check if email already exists
    const { data: existing } = await supabase
      .from('waitlist')
      .select('id, pending_rewards')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (existing) {
      return NextResponse.json({
        success: true,
        alreadyJoined: true,
        pendingRewards: existing.pending_rewards,
        message: "You're already on the waitlist! We'll notify you when we launch."
      });
    }

    // Insert new waitlist entry
    const { data: entry, error: dbError } = await supabase
      .from('waitlist')
      .insert({
        email: email.toLowerCase().trim(),
        source: source || 'waitlist',
        pending_rewards: 0
      })
      .select()
      .single();

    if (dbError) {
      // Handle unique constraint violation gracefully
      if (dbError.code === '23505') {
        return NextResponse.json({
          success: true,
          alreadyJoined: true,
          message: "You're already on the waitlist!"
        });
      }
      console.error('Waitlist DB error:', dbError);
      throw dbError;
    }

    return NextResponse.json({
      success: true,
      alreadyJoined: false,
      message: "🎉 You're on the list! We'll notify you when we launch."
    });

  } catch (error) {
    console.error('Waitlist error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to join waitlist'
    }, { status: 500 });
  }
}

// POST to /api/waitlist/deposit — Credit pending rewards to a waitlist email
export async function PUT(request) {
  try {
    const body = await request.json();
    const { email, amount } = body;

    if (!email || !amount) {
      return NextResponse.json({
        success: false,
        error: 'Email and amount are required'
      }, { status: 400 });
    }

    // Upsert: create entry if doesn't exist, add rewards if it does
    const { data: existing } = await supabase
      .from('waitlist')
      .select('id, pending_rewards')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (existing) {
      await supabase
        .from('waitlist')
        .update({ pending_rewards: (existing.pending_rewards || 0) + amount })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('waitlist')
        .insert({
          email: email.toLowerCase().trim(),
          source: 'fake_report',
          pending_rewards: amount
        });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Waitlist deposit error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to deposit rewards'
    }, { status: 500 });
  }
}
