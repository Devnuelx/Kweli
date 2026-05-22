import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { supabase } from '@/lib/supabase/supabase';

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get company's current API key (secret)
    const { data: company } = await supabase
      .from('companies')
      .select('secret')
      .eq('email', session.user.email)
      .single();
    
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }
    
    // Mask the API key (show only last 4 characters)
    const maskedKey = `kw_${'*'.repeat(company.secret.length - 7)}${company.secret.slice(-4)}`;
    
    return NextResponse.json({
      success: true,
      apiKey: maskedKey
    });
    
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

