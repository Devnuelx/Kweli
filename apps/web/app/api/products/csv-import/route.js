// app/api/products/csv-import/route.js
// Simplified: Only handles CSV import and product registration
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabase } from '@/lib/supabase/supabase';
import { CsvParser } from '@/lib/services/csv/CsvParser';
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

    // Get company
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("id, secret")
      .eq("id", session.user.id)
      .single();

    if (companyError || !company) {
      return NextResponse.json({ 
        success: false, 
        error: "Company not found" 
      }, { status: 404 });
    }

    const formData = await request.formData();
    const csvFile = formData.get('csv');

    // Validate CSV file
    if (!csvFile) {
      return NextResponse.json({
        success: false,
        error: 'CSV file is required'
      }, { status: 400 });
    }

    // Parse CSV
    const csvText = await csvFile.text();
    const parseResult = await CsvParser.parse(csvText);

    if (!parseResult.success) {
      return NextResponse.json({
        success: false,
        error: 'CSV validation failed',
        details: parseResult.error
      }, { status: 400 });
    }

    const csvRows = parseResult.data;
    const allProducts = [];
    const batchId = `batch_${Date.now()}`;

    // Process products - ONLY registration, NO design generation
    for (const row of csvRows) {
      const quantity = row.quantity || 1;
      const startingSerial = row.startingSerialNumber || 1;

      for (let i = 0; i < quantity; i++) {
        const serialNumber = `${row.batchNumber}-${String(startingSerial + i).padStart(6, "0")}`;
        const uniqueProductId = `${row.productId}-${serialNumber}`;

        // Generate QR hash
        const qrHash = generateProductHash(
          {
            productId: uniqueProductId,
            companyId: company.id,
            batchNumber: row.batchNumber,
            serialNumber,
            manufacturingDate: row.manufacturingDate
          },
          company.secret
        );

        // Generate QR code (data URL for DB storage)
        const qrCodeDataUrl = await generateQRCode(qrHash, uniqueProductId);

        // Submit to Hedera
        const hederaResult = await submitProductToHedera({
          productId: uniqueProductId,
          companyId: company.id,
          name: row.name,
          batchNumber: row.batchNumber,
          serialNumber,
          manufacturingDate: row.manufacturingDate,
          expiryDate: row.expiryDate,
          qrHash
        });

        // Save to database
        const { data: product, error } = await supabase
          .from("products")
          .insert({
            product_id: uniqueProductId,
            company_id: company.id,
            name: row.name,
            batch_number: row.batchNumber,
            serial_number: serialNumber,
            manufacturing_date: row.manufacturingDate,
            expiry_date: row.expiryDate,
            qr_hash: qrHash,
            qr_code_image: qrCodeDataUrl,
            hedera_transaction_id: hederaResult.transactionId,
            hedera_topic_id: hederaResult.topicId
          })
          .select()
          .single();

        if (error) {
          console.error(`Error saving product ${uniqueProductId}:`, error);
          continue;
        }

        allProducts.push({
          id: product.id,
          productId: uniqueProductId,
          serialNumber,
          qrHash,
          batchNumber: row.batchNumber,
          name: row.name
        });
      }
    }

    return NextResponse.json({
      success: true,
      count: allProducts.length,
      batchId,
      productIds: allProducts.map(p => p.id),
      products: allProducts.map(p => ({
        id: p.id,
        productId: p.productId,
        serialNumber: p.serialNumber,
        batchNumber: p.batchNumber,
        name: p.name
      }))
    });

  } catch (error) {
    console.error('CSV import error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

