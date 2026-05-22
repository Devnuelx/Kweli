// app/api/products/report-fake/route.js
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/supabase';
import { submitProductToHedera } from '@/lib/hedera/hcs';
import { transferTokens } from '@/lib/hedera/transferToken';
import jwt from 'jsonwebtoken';

const REPORT_REWARD = 5; // VFY tokens per report

// POST — Submit a fake product report
export async function POST(request) {
  try {
    const formData = await request.formData();
    const productName = formData.get('productName');
    const brandName = formData.get('brandName');
    const description = formData.get('description');
    const location = formData.get('location');
    const imageFile = formData.get('image'); // File object or null

    // Validate required fields
    if (!productName || !description) {
      return NextResponse.json({
        success: false,
        error: 'Product name and description are required'
      }, { status: 400 });
    }

    // Get user from JWT token (optional — allow anonymous reports)
    let userId = null;
    const authHeader = request.headers.get('authorization');

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      try {
        const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET);
        userId = decoded.userId;
      } catch (error) {
        console.log('JWT verification failed:', error.message);
        // Continue without user — anonymous reports allowed
      }
    }

    // Upload image to Supabase Storage if provided
    let imageUrl = null;
    if (imageFile && imageFile.size > 0) {
      try {
        const fileExt = imageFile.name?.split('.').pop() || 'jpg';
        const fileName = `report_${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
        const filePath = `fake-reports/${fileName}`;

        const buffer = Buffer.from(await imageFile.arrayBuffer());

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('reports')
          .upload(filePath, buffer, {
            contentType: imageFile.type || 'image/jpeg',
            upsert: false
          });

        if (uploadError) {
          console.error('Image upload error:', uploadError);
        } else {
          const { data: urlData } = supabase.storage
            .from('reports')
            .getPublicUrl(filePath);
          imageUrl = urlData?.publicUrl || null;
        }
      } catch (uploadErr) {
        console.error('Image processing error:', uploadErr);
        // Continue without image — report still saved
      }
    }

    // Save report to database
    const { data: report, error: dbError } = await supabase
      .from('fake_reports')
      .insert({
        user_id: userId,
        product_name: productName,
        brand_name: brandName || null,
        description,
        location: location || null,
        image_url: imageUrl,
        status: 'pending'
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    }

    // Log the report to Hedera for immutable record
    let hederaResult = null;
    try {
      hederaResult = await submitProductToHedera({
        action: 'REPORT_FAKE',
        reportId: report.id,
        productName,
        brandName: brandName || 'Unknown',
        location: location || 'Not specified',
        reportedBy: userId || 'anonymous',
        timestamp: new Date().toISOString()
      });
    } catch (hederaError) {
      console.error('Hedera logging failed:', hederaError);
      // Continue even if Hedera logging fails — report is saved in DB
    }

    // Award 5 VFY tokens if user is authenticated
    let tokensCredited = 0;
    let rewardTxId = null;
    if (userId) {
      try {
        // Credit tokens in database
        const { data: user } = await supabase
          .from('users')
          .select('total_rewards, hedera_account_id')
          .eq('id', userId)
          .single();

        if (user) {
          await supabase
            .from('users')
            .update({ total_rewards: (user.total_rewards || 0) + REPORT_REWARD })
            .eq('id', userId);

          tokensCredited = REPORT_REWARD;

          // Transfer on-chain if user has Hedera account
          if (user.hedera_account_id) {
            try {
              await transferTokens(user.hedera_account_id, REPORT_REWARD);
              rewardTxId = `report-reward-${report.id}`;
            } catch (transferErr) {
              console.error('Hedera token transfer failed:', transferErr);
              // DB credit still stands
            }
          }

          // Log to token_transactions
          await supabase
            .from('token_transactions')
            .insert({
              user_id: userId,
              transaction_type: 'fake_report',
              amount: REPORT_REWARD,
              description: `Fake report reward - ${productName}`,
              hedera_transaction_id: rewardTxId
            });
        }
      } catch (rewardErr) {
        console.error('Reward crediting error:', rewardErr);
        // Don't fail the whole request
      }
    }

    return NextResponse.json({
      success: true,
      report: {
        id: report.id,
        productName: report.product_name,
        brandName: report.brand_name,
        status: report.status,
        imageUrl: report.image_url,
        createdAt: report.created_at,
        hederaTransactionId: hederaResult?.transactionId || null
      },
      reward: {
        amount: tokensCredited,
        credited: tokensCredited > 0,
        requiresLogin: !userId
      },
      message: '🚨 Report submitted successfully. Thank you for helping fight counterfeits!'
    });

  } catch (error) {
    console.error('Report fake error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to submit report'
    }, { status: 500 });
  }
}

// GET — Fetch reports (for logged-in users: their reports, optionally all pending)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status'); // optional filter
    const offset = (page - 1) * limit;

    // Get user from JWT token
    let userId = null;
    const authHeader = request.headers.get('authorization');

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      try {
        const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET);
        userId = decoded.userId;
      } catch (error) {
        return NextResponse.json({
          success: false,
          error: 'Invalid or expired token'
        }, { status: 401 });
      }
    } else {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    // Build query — users see their own reports
    let query = supabase
      .from('fake_reports')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Optional status filter
    if (status) {
      query = query.eq('status', status);
    }

    const { data: reports, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      reports: (reports || []).map(r => ({
        id: r.id,
        productName: r.product_name,
        brandName: r.brand_name,
        description: r.description,
        location: r.location,
        imageUrl: r.image_url,
        status: r.status,
        createdAt: r.created_at
      })),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil((count || 0) / limit),
        totalItems: count || 0
      }
    });

  } catch (error) {
    console.error('Fetch reports error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch reports'
    }, { status: 500 });
  }
}
