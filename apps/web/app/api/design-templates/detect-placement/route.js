// app/api/design-templates/detect-placement/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { QrPlacementDetector } from '@/lib/services/qr/QrPlacementDetector';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: "Unauthorized" 
      }, { status: 401 });
    }

    const formData = await request.formData();
    const designFile = formData.get('design');
    const placeholderColor = formData.get('placeholderColor');
    const textMarker = formData.get('textMarker');

    if (!designFile) {
      return NextResponse.json({
        success: false,
        error: 'Design file is required'
      }, { status: 400 });
    }

    // Convert file to buffer
    const arrayBuffer = await designFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Detect placements using all methods
    const detectionOptions = {};
    if (placeholderColor) detectionOptions.placeholderColor = placeholderColor;
    if (textMarker) detectionOptions.textMarker = textMarker;

    const results = await QrPlacementDetector.detectAll(buffer, detectionOptions);

    // If no placements detected, provide default centered placement
    if (!results.success || results.placements.length === 0) {
      const defaultPlacement = QrPlacementDetector.createDefaultPlacement(
        results.imageDimensions || { width: 1000, height: 1000 },
        200
      );
      
      results.placements.push(defaultPlacement);
      results.methods.push('default');
    }

    return NextResponse.json({
      success: true,
      ...results
    });
  } catch (error) {
    console.error('Error detecting placement:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

