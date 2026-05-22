import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabase } from '@/lib/supabase/supabase';
import { submitProductToHedera } from '@/lib/hedera/hcs';
import crypto from 'crypto';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: "Unauthorized" 
      }, { status: 401 });
    }

    // Get company
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("id, secret, hedera_topic_id")
      .eq("id", session.user.id)
      .single();

    if (companyError || !company) {
      return NextResponse.json({ 
        success: false, 
        error: "Company not found" 
      }, { status: 404 });
    }

    const body = await request.json();
    const { 
      name, 
      sku, 
      category,
      description,
      batchSize = 1
    } = body;

    if (batchSize > 10000) {
       return NextResponse.json({ success: false, error: "Max batch size is 10,000" }, { status: 400 });
    }

    // Anchor product batch creation to Hedera
    let hederaResult = { transactionId: null, topicId: company.hedera_topic_id };
    try {
      hederaResult = await submitProductToHedera({
        companyId: company.id,
        name,
        sku,
        batchSize,
        category,
        action: "CREATE_BATCH"
      });
    } catch (hErr) {
      console.error("Hedera submission failed, proceeding:", hErr);
    }

    // Create the main Product row
    const { data: product, error: productError } = await supabase
      .from("products")
      .insert({
        company_id: company.id,
        name,
        sku: sku || null,
        category: category || null,
        description: description || null,
        batch_size: batchSize,
        units_generated: true,
        hedera_topic_id: hederaResult.topicId,
        status: 'active'
      })
      .select()
      .single();

    if (productError) throw productError;

    // Generate N product_units
    const units = [];
    const MAX_BULK_INSERT = 1000;
    
    for (let i = 0; i < batchSize; i++) {
      const serial_code = crypto.randomUUID();
      units.push({
        product_id: product.id,
        serial_code,
        qr_url: `https://kweli-web.vercel.app/v/${serial_code}`,
        status: 'unscanned',
        scan_count: 0
      });
    }

    // Bulk insert units in chunks
    for (let i = 0; i < units.length; i += MAX_BULK_INSERT) {
      const chunk = units.slice(i, i + MAX_BULK_INSERT);
      const { error: unitsError } = await supabase
        .from("product_units")
        .insert(chunk);
      
      if (unitsError) {
        console.error("Error inserting units chunk:", unitsError);
        throw unitsError;
      }
    }

    return NextResponse.json({
      success: true,
      product: {
        id: product.id,
        name: product.name,
        batch_size: batchSize
      }
    });
  } catch (error) {
    console.error("Error in product registration:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}