import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/supabase';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { createTopic } from '@/lib/hedera/hcs';

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
    
    // Hash password with bcrypt
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Generate secret
    const secret = crypto.randomBytes(32).toString('hex');
    
    // Create Hedera topic for the brand
    let hederaTopicId = null;
    try {
      hederaTopicId = await createTopic();
    } catch (hederaError) {
      console.error('Failed to create Hedera topic, proceeding without it:', hederaError);
    }
    
    // Create trial subscription
    // 14 days from now
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);
    
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .insert({
        status: 'trial',
        trial_ends_at: trialEndsAt.toISOString(),
      })
      .select()
      .single();

    if (subError) {
      console.error('Failed to create trial subscription:', subError);
    }
    
    // Create company
    const { data: company, error } = await supabase
      .from('companies')
      .insert({
        name: companyName,
        email: email,
        password_hash: passwordHash,
        secret: secret,
        phone: phone || null,
        address: address || null,
        city: city || null,
        hedera_topic_id: hederaTopicId,
        subscription_id: subscription?.id || null,
        onboarding_complete: false
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
        email: company.email,
        hedera_topic_id: hederaTopicId,
        subscription: {
          id: subscription?.id,
          status: 'trial',
          trial_ends_at: trialEndsAt.toISOString()
        }
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