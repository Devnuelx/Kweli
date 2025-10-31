// app/api/products/register/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabase } from '@/lib/supabase/supabase';
import { generateProductHash } from '@/lib/hedera/hash';
import { generateQRCode } from '@/lib/hedera/qrGenerator';
import { submitProductToHedera } from '@/lib/hedera/hcs';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: "Unauthorized" 
      }, { status: 401 });
    }

    // Get company using session.user.id (which IS the company id)
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("id, secret")
      .eq("id", session.user.id)  // Changed from session.user.companyId
      .single();

    if (companyError || !company) {
      return NextResponse.json({ 
        success: false, 
        error: "Company not found" 
      }, { status: 404 });
    }

    const body = await request.json();
    const { 
      productId, 
      name, 
      batchNumber, 
      manufacturingDate, 
      expiryDate,
      quantity = 1,
      startingSerialNumber = 1
    } = body;

    const products = [];

    for (let i = 0; i < quantity; i++) {
      const serialNumber = `${batchNumber}-${String(startingSerialNumber + i).padStart(6, "0")}`;
      const uniqueProductId = `${productId}-${serialNumber}`;

      const qrHash = generateProductHash(
        { 
          productId: uniqueProductId, 
          companyId: company.id, 
          batchNumber, 
          serialNumber, 
          manufacturingDate 
        },
        company.secret
      );

      const qrCodeImage = await generateQRCode(qrHash, uniqueProductId);

      const hederaResult = await submitProductToHedera({
        productId: uniqueProductId,
        companyId: company.id,
        name,
        batchNumber,
        serialNumber,
        manufacturingDate,
        expiryDate,
        qrHash
      });

      const { data: product, error } = await supabase
        .from("products")
        .insert({
          product_id: uniqueProductId,
          company_id: company.id,
          name,
          batch_number: batchNumber,
          serial_number: serialNumber,
          manufacturing_date: manufacturingDate,
          expiry_date: expiryDate,
          qr_hash: qrHash,
          qr_code_image: qrCodeImage,
          hedera_transaction_id: hederaResult.transactionId,
          hedera_topic_id: hederaResult.topicId
        })
        .select()
        .single();

      if (error) throw error;

      products.push({
        id: product.id,
        productId: product.product_id,
        serialNumber: product.serial_number,
        qrHash: product.qr_hash,
        qrCodeImage: product.qr_code_image
      });
    }

    return NextResponse.json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}