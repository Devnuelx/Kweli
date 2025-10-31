import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/supabase';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      companyName, 
      email, 
      password,
      phone,
      address,
      city
    } = body;
    
    // Check if company already exists
    const { data: existingCompany } = await supabase
      .from('companies')
      .select('id')
      .eq('email', email)
      .single();
    
    if (existingCompany) {
      return NextResponse.json({ 
        success: false, 
        error: 'Company with this email already exists' 
      }, { status: 400 });
    }
    
    // Hash password with bcrypt (NOT SHA-256)
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Generate secret
    const secret = crypto.randomBytes(32).toString('hex');
    
    // Create company
    const { data: company, error } = await supabase
      .from('companies')
      .insert({
        name: companyName,
        email: email,
        password_hash: passwordHash,  // Changed from user_id
        secret: secret,
        phone: phone || null,
        address: address || null,
        city: city || null
        // Removed industry and website - they don't exist in DB
      })
      .select()
      .single();
    
    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to create account' 
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      company: {
        id: company.id,
        name: company.name,
        email: company.email
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}