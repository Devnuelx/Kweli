import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/supabase';
import { submitVerificationToHedera } from '@/lib/hedera/hcs';

export async function POST(request, { params }) {
  try {
    const { serial } = params;
    
    // Parse request info (IP, user agent, etc.) for analytics
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const reqBody = await request.json().catch(() => ({}));
    const { latitude, longitude } = reqBody;

    if (!serial) {
      return NextResponse.json({ success: false, status: 'fake', error: 'Missing serial code' }, { status: 400 });
    }

    // Lookup the unit
    const { data: unit, error: unitError } = await supabase
      .from('product_units')
      .select(`
        id,
        serial_code,
        status,
        scan_count,
        products!inner (
          id,
          name,
          company_id,
          batch_size,
          companies!inner (
            id,
            name,
            hedera_topic_id
          )
        )
      `)
      .eq('serial_code', serial)
      .single();

    if (unitError || !unit) {
      // FAKE - Log the fake scan event (for anomaly detection later)
      await supabase.from('scan_events').insert({
        serial_code: serial,
        scan_status: 'fake',
        ip_address: ipAddress,
        user_agent: userAgent,
        latitude,
        longitude
      });

      return NextResponse.json({
        success: true,
        status: 'fake'
      });
    }

    // Unit found. Determine authentic vs duplicate
    const isFirstScan = unit.scan_count === 0;
    const currentStatus = isFirstScan ? 'authentic' : 'duplicate';

    // Update unit scan count
    await supabase
      .from('product_units')
      .update({
        scan_count: unit.scan_count + 1,
        status: currentStatus === 'authentic' ? 'scanned' : unit.status
      })
      .eq('id', unit.id);

    // Log the scan event
    await supabase.from('scan_events').insert({
      unit_id: unit.id,
      serial_code: unit.serial_code,
      scan_status: currentStatus,
      ip_address: ipAddress,
      user_agent: userAgent,
      latitude,
      longitude
    });

    // Fire off to Hedera asynchronously
    try {
      submitVerificationToHedera({
        productId: unit.products.id,
        companyId: unit.products.company_id,
        serialCode: unit.serial_code,
        scanResult: currentStatus,
        topicId: unit.products.companies.hedera_topic_id
      }).catch(err => console.error("Async Hedera Submit Failed", err));
    } catch (hErr) {
      console.error("Hedera submission prep failed", hErr);
    }

    return NextResponse.json({
      success: true,
      status: currentStatus,
      product: {
        name: unit.products.name,
        company: unit.products.companies.name,
        scanCount: unit.scan_count + 1
      }
    });

  } catch (error) {
    console.error("Scan error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
