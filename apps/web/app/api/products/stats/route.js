import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { supabase } from '@/lib/supabase/supabase';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { data: company } = await supabase
      .from('companies')
      .select('id')
      .eq('email', session.user.email)
      .single();
    
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }
    
    // Get total units generated
    const { count: totalUnits } = await supabase
      .from('product_units')
      .select('id, products!inner(company_id)', { count: 'exact', head: true })
      .eq('products.company_id', company.id);

    // Get total products (batches)
    const { count: totalProducts } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', company.id);
    
    // Get total scans (authentic + duplicate)
    const { count: totalScans } = await supabase
      .from('scan_events')
      .select('id, product_units!inner(products!inner(company_id))', { count: 'exact', head: true })
      .eq('product_units.products.company_id', company.id)
      .in('scan_status', ['authentic', 'duplicate']);

    // Get fakes detected (globally or we could try to guess if it matches their serial pattern... 
    // for now we just show global fakes or let's not show fakes if we can't tie it to company easily.
    // Wait, if a serial was scanned but NOT in db, it's a global fake. If it was in DB but flagged duplicate, that's local.)
    // Let's get "duplicates" as potential fraud attempts for this company.
    const { count: duplicatesDetected } = await supabase
      .from('scan_events')
      .select('id, product_units!inner(products!inner(company_id))', { count: 'exact', head: true })
      .eq('product_units.products.company_id', company.id)
      .eq('scan_status', 'duplicate');
    
    // Get recent scans for company's products only
    const { data: recentScans } = await supabase
      .from('scan_events')
      .select(`
        id,
        serial_code,
        scan_status,
        scanned_at,
        latitude,
        longitude,
        product_units!inner (
          products!inner (
            name,
            company_id
          )
        )
      `)
      .eq('product_units.products.company_id', company.id)
      .order('scanned_at', { ascending: false })
      .limit(20);
    
    return NextResponse.json({
      success: true,
      stats: {
        totalProducts: totalProducts || 0,
        totalUnits: totalUnits || 0,
        totalScans: totalScans || 0,
        fraudAttempts: duplicatesDetected || 0,
        recentScans: (recentScans || []).map(scan => ({
          productName: scan.product_units?.products?.name || 'Unknown',
          scannedAt: scan.scanned_at,
          status: scan.scan_status,
          serialCode: scan.serial_code,
          lat: scan.latitude,
          lng: scan.longitude
        }))
      }
    });
    
  } catch (error) {
    console.error('Stats API Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}