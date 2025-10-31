// app/api/design-templates/upload/route.js
// Upload banner/design file to Supabase Storage
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabase } from '@/lib/supabase/supabase';
import { QrEmbedder } from '@/lib/services/qr/QrEmbedder';

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

    if (!designFile) {
      return NextResponse.json({
        success: false,
        error: 'Design file is required'
      }, { status: 400 });
    }

    // Convert file to buffer
    const arrayBuffer = await designFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate design
    const validation = await QrEmbedder.validateDesign(buffer);
    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        error: 'Invalid design file',
        details: validation.errors
      }, { status: 400 });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const extension = designFile.name.split('.').pop();
    const filename = `template_${timestamp}.${extension}`;
    const filePath = `templates/${session.user.id}/${filename}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('product-designs')
      .upload(filePath, buffer, {
        contentType: designFile.type,
        cacheControl: '3600'
      });

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('product-designs')
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      templateUrl: publicUrl,
      metadata: validation.metadata,
      filename
    });

  } catch (error) {
    console.error('Template upload error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

