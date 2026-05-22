// app/api/products/download/route.js
// Handles flexible product downloads (QR only or embedded in design)
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { ProductDownloader } from '@/lib/services/download/ProductDownloader';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: "Unauthorized" 
      }, { status: 401 });
    }

    const body = await request.json();
    const { 
      productIds, 
      format, // 'qr-only' or 'embedded'
      outputType, // 'zip' or 'pdf'
      includeMetadata 
    } = body;

    // Validate input
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Product IDs are required'
      }, { status: 400 });
    }

    if (!format || !['qr-only', 'embedded'].includes(format)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid format. Must be "qr-only" or "embedded"'
      }, { status: 400 });
    }

    const companyId = session.user.id;
    let result;

    // Handle different download formats
    if (format === 'qr-only') {
      result = await ProductDownloader.downloadQrCodesOnly(productIds, companyId);
    } else if (format === 'embedded') {
      // Check if company has active template
      const hasTemplate = await ProductDownloader.hasActiveTemplate(companyId);
      
      if (!hasTemplate) {
        return NextResponse.json({
          success: false,
          error: 'No active template found. Please set up a banner template first.',
          code: 'NO_TEMPLATE'
        }, { status: 400 });
      }

      result = await ProductDownloader.downloadEmbedded(
        productIds, 
        companyId, 
        outputType || 'zip',
        {
          includeMetadata: includeMetadata || false
        }
      );
    }

    return NextResponse.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message 
      },
      { status: 500 }
    );
  }
}

