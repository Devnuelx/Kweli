// app/api/auth/consumer/signup/route.js
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/supabase';
import bcrypt from 'bcrypt';

export async function POST(request) {
  try {
    const { email, password, name, phone } = await request.json();
    
    // Check if user exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
    
    if (existing) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }
    
    const passwordHash = await bcrypt.hash(password, 10);
    
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email,
        name,
        phone,
        password_hash: passwordHash
      })
      .select('id, email, name, total_scans, total_rewards')
      .single();
    
    if (error) throw error;
    
    return NextResponse.json({
      success: true,
      user
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}