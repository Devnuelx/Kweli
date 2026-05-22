import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { supabase } from '@/lib/supabase/supabase';
import crypto from 'crypto';

export async function POST() {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Generate new API key
    const newSecret = crypto.randomBytes(32).toString('hex');
    const newApiKey = `kw_${newSecret}`;
    
    // Update company's secret in database
    const { data: company, error } = await supabase
      .from('companies')
      .update({ secret: newSecret })
      .eq('email', session.user.email)
      .select()
      .single();
    
    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to regenerate API key' 
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      apiKey: newApiKey
    });
    
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

