import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/supabase';

export async function GET(request, { params }) {
  try {
    const { batch_number } = params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = Math.min(parseInt(searchParams.get('limit')) || 50, 100); // Max 100 per page
    const offset = (page - 1) * limit;
    
    // Get products by batch number
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        *,
        companies (
          id,
          name,
          logo_url
        )
      `)
      .eq('batch_number', batch_number)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (productsError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Database error' 
      }, { status: 500 });
    }
    
    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('batch_number', batch_number);
    
    return NextResponse.json({
      success: true,
      products: products.map(product => ({
        id: product.id,
        productId: product.product_id,
        name: product.name,
        category: product.category,
        description: product.description,
        manufacturer: product.manufacturer,
        batchNumber: product.batch_number,
        serialNumber: product.serial_number,
        manufacturingDate: product.manufacturing_date,
        expiryDate: product.expiry_date,
        isExpired: new Date(product.expiry_date) < new Date(),
        company: {
          id: product.companies.id,
          name: product.companies.name,
          logo: product.companies.logo_url
        },
        hederaExplorerUrl: `https://hashscan.io/testnet/topic/${product.hedera_topic_id}`
      })),
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        pages: Math.ceil((totalCount || 0) / limit)
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

