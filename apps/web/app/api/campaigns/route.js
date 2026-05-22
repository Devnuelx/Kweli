import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabase } from '@/lib/supabase/supabase';

// Get list of campaigns for the company
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { data: company } = await supabase
      .from('companies')
      .select('id')
      .eq('email', session.user.email)
      .single();

    const { data: campaigns, error } = await supabase
      .from('campaigns')
      .select(`
        id, name, type, start_date, end_date, is_active, max_winners,
        campaign_prizes ( id, name, quantity, current_winners, win_probability )
      `)
      .eq('company_id', company.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, campaigns });
  } catch (error) {
    console.error("GET Campaigns error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Create a new campaign
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { data: company } = await supabase
      .from('companies')
      .select('id')
      .eq('email', session.user.email)
      .single();

    const body = await request.json();
    const { name, type = 'instant_win', start_date, end_date, max_winners, prizes } = body;

    // 1. Insert Campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .insert({
        company_id: company.id,
        name,
        type,
        start_date,
        end_date,
        is_active: true,
        max_winners
      })
      .select()
      .single();

    if (campaignError) throw campaignError;

    // 2. Insert Prizes
    if (prizes && prizes.length > 0) {
      const prizesToInsert = prizes.map(p => ({
        campaign_id: campaign.id,
        name: p.name,
        description: p.description || null,
        type: p.type || 'physical', // digital, physical
        value: p.value || 0,
        quantity: p.quantity,
        current_winners: 0,
        win_probability: p.win_probability // e.g., 0.05 for 5% chance
      }));

      const { error: prizesError } = await supabase
        .from('campaign_prizes')
        .insert(prizesToInsert);

      if (prizesError) throw prizesError;
    }

    return NextResponse.json({ success: true, campaign });
  } catch (error) {
    console.error("POST Campaign error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
