import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/supabase';
import { TermiiService } from '@/lib/services/notifications/TermiiService';
import { ResendService } from '@/lib/services/notifications/ResendService';

export async function POST(request) {
  try {
    const body = await request.json();
    const { serial_code, consumer_phone, consumer_email } = body;

    if (!serial_code) {
      return NextResponse.json({ success: false, error: "Missing serial code" }, { status: 400 });
    }

    // 1. Validate the unit
    const { data: unit, error: unitError } = await supabase
      .from('product_units')
      .select(`
        id, 
        products(
          company_id, 
          name, 
          companies(name)
        )
      `)
      .eq('serial_code', serial_code)
      .single();

    if (unitError || !unit) {
      return NextResponse.json({ success: false, error: "Invalid product" }, { status: 400 });
    }

    // 2. Check if already entered
    const { data: existingEntry } = await supabase
      .from('campaign_entries')
      .select('id')
      .eq('unit_id', unit.id)
      .single();

    if (existingEntry) {
      return NextResponse.json({ success: false, error: "This product has already been entered into the campaign." }, { status: 400 });
    }

    // 3. Find active campaign for this company
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('id, name, max_winners, campaign_prizes(*)')
      .eq('company_id', unit.products.company_id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json({ success: false, error: "No active campaigns found for this product." }, { status: 404 });
    }

    // 4. Instant Win Logic
    let wonPrize = null;
    let isWinner = false;

    const roll = Math.random();
    let cumulativeProbability = 0;

    for (const prize of campaign.campaign_prizes) {
      if (prize.current_winners >= prize.quantity) continue;

      cumulativeProbability += prize.win_probability;
      if (roll <= cumulativeProbability) {
        wonPrize = prize;
        isWinner = true;
        break;
      }
    }

    // 5. Record Entry
    const { data: entry, error: entryError } = await supabase
      .from('campaign_entries')
      .insert({
        campaign_id: campaign.id,
        unit_id: unit.id,
        consumer_phone: consumer_phone || null,
        consumer_email: consumer_email || null,
        is_winner: isWinner,
        prize_id: isWinner ? wonPrize.id : null
      })
      .select()
      .single();

    if (entryError) throw entryError;

    // 6. Update Prize Count and Send Notifications if won
    if (isWinner) {
      await supabase
        .from('campaign_prizes')
        .update({ current_winners: wonPrize.current_winners + 1 })
        .eq('id', wonPrize.id);

      // Async Notification Dispatch
      const brandName = unit.products.companies.name;
      const productName = unit.products.name;
      
      if (consumer_phone) {
        TermiiService.sendSms(
          consumer_phone,
          `Congrats! You won ${wonPrize.name} from ${brandName} for verifying ${productName}! Keep an eye out for details.`
        ).catch(console.error);
      }

      if (consumer_email) {
        ResendService.sendEmail(
          consumer_email,
          `You're a Winner! 🎉`,
          `<h1>Congratulations!</h1>
           <p>You verified a genuine <strong>${productName}</strong> and won <strong>${wonPrize.name}</strong> from ${brandName}.</p>
           <p>Thank you for choosing authentic products!</p>`
        ).catch(console.error);
      }
    }

    return NextResponse.json({
      success: true,
      isWinner,
      prize: isWinner ? { name: wonPrize.name, type: wonPrize.type } : null,
      message: isWinner ? "Congratulations! You won!" : "Sorry, you didn't win this time."
    });

  } catch (error) {
    console.error("Campaign Enter error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
