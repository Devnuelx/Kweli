
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { supabase } from '@/lib/supabase/supabase';

export async function GET() {
  try {
    const session = await getServerSession();
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
    
    // Get total products
    const { count: totalProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', company.id);
    
    // Get current period scans (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const { count: totalScans } = await supabase
      .from('scans')
      .select('products!inner(*)', { count: 'exact', head: true })
      .eq('products.company_id', company.id);

    // Get previous period scans (30-60 days ago)
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const { count: previousScans } = await supabase
      .from('scans')
      .select('products!inner(*)', { count: 'exact', head: true })
      .eq('products.company_id', company.id)
      .gt('scanned_at', sixtyDaysAgo.toISOString())
      .lt('scanned_at', thirtyDaysAgo.toISOString());

    // Calculate scan percentage change
    const scanPercentChange = previousScans ? ((totalScans - previousScans) / previousScans) * 100 : 0;

    // Get total products for current and previous periods
    const { count: currentProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', company.id)
      .gt('created_at', thirtyDaysAgo.toISOString());

    const { count: previousProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', company.id)
      .gt('created_at', sixtyDaysAgo.toISOString())
      .lt('created_at', thirtyDaysAgo.toISOString());

    // Calculate products percentage change
    const productPercentChange = previousProducts ? ((currentProducts - previousProducts) / previousProducts) * 100 : 0;
    
    // Get fakes detected
    const { count: fakesDetected } = await supabase
      .from('scans')
      .select('*', { count: 'exact', head: true })
      .eq('is_authentic', false);

    // Get previous period fakes
    const { count: previousFakes } = await supabase
      .from('scans')
      .select('*', { count: 'exact', head: true })
      .eq('is_authentic', false)
      .gt('scanned_at', sixtyDaysAgo.toISOString())
      .lt('scanned_at', thirtyDaysAgo.toISOString());

    // Calculate fakes percentage change
    const fakesPercentChange = previousFakes ? ((fakesDetected - previousFakes) / previousFakes) * 100 : 0;
    
    // Get recent scans for company's products only
    const { data: recentScans } = await supabase
      .from('scans')
      .select(`
        *,
        products!inner (
          name,
          company_id
        )
      `)
      .eq('products.company_id', company.id)
      .order('scanned_at', { ascending: false })
      .limit(10);
    
    return NextResponse.json({
      success: true,
      stats: {
        totalProducts: totalProducts || 0,
        totalScans: totalScans || 0,
        fakesDetected: fakesDetected || 0,
        productPercentChange: Math.round(productPercentChange * 10) / 10,
        scanPercentChange: Math.round(scanPercentChange * 10) / 10,
        fakesPercentChange: Math.round(fakesPercentChange * 10) / 10,
        recentScans: (recentScans || []).map(scan => ({
          productName: scan.products?.name || 'Unknown',
          scannedAt: scan.scanned_at,
          isAuthentic: scan.is_authentic
        }))
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}