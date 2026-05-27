import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabase } from '@/lib/supabase/supabase';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id')
      .eq('email', session.user.email)
      .single();

    if (companyError || !company) {
      return NextResponse.json({ success: false, error: "Company not found" }, { status: 404 });
    }

    const { error: updateError } = await supabase
      .from('companies')
      .update({ onboarding_complete: true })
      .eq('id', company.id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Onboarding complete error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
