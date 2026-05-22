import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabase } from '@/lib/supabase/supabase';
import { FlutterwaveProvider } from '@/lib/services/billing/FlutterwaveProvider';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { data: company } = await supabase
      .from('companies')
      .select('id, email, subscription_tier')
      .eq('email', session.user.email)
      .single();

    if (!company) {
      return NextResponse.json({ success: false, error: 'Company not found' }, { status: 404 });
    }

    const body = await request.json();
    const { plan } = body; // 'pro' or 'enterprise'
    
    // Determine pricing
    let amount = 0;
    if (plan === 'pro') amount = 49;
    else if (plan === 'enterprise') amount = 199;
    else return NextResponse.json({ success: false, error: 'Invalid plan' }, { status: 400 });

    const provider = new FlutterwaveProvider();
    
    // Generate a unique reference
    const reference = `kweli-sub-${company.id}-${Date.now()}`;

    // Record the pending transaction
    const { error: txError } = await supabase
      .from('transactions')
      .insert({
        company_id: company.id,
        amount: amount,
        currency: 'USD',
        status: 'pending',
        provider: 'flutterwave',
        reference_id: reference
      });
      
    if (txError) throw txError;

    // We can define the absolute URL for the redirect
    // Since we don't know the exact host, Next.js request object has the URL origin
    const origin = new URL(request.url).origin;
    const redirectUrl = `${origin}/dashboard/billing/verify`;

    const paymentUrl = await provider.createPaymentLink({
      email: company.email,
      amount: amount,
      currency: 'USD',
      reference: reference,
      redirectUrl: redirectUrl
    });

    return NextResponse.json({ success: true, paymentUrl });
  } catch (error) {
    console.error('Billing setup error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
