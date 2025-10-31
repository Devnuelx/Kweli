import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/supabase';
import { transferTokens } from '@/lib/hedera/transferToken';
import jwt from 'jsonwebtoken';

export async function GET(request, { params }) {
  try {
    const { qr_hash } = params;
    
    // Get user from JWT token (if logged in)
    let userId = null;
    let user = null;
    const authHeader = request.headers.get('authorization');
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      try {
        const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET);
        userId = decoded.userId;
        
        // Fetch user details
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();
        
        user = userData;
      } catch (error) {
        console.log('JWT verification failed:', error.message);
        // Continue without user - anonymous scans allowed
      }
    }
    
    // Find product by QR hash
    const { data: product, error } = await supabase
      .from('products')
      .select(`
        *,
        companies (
          id,
          name,
          logo_url,
          city,
          country
        )
      `)
      .eq('qr_hash', qr_hash)
      .single();
    
    if (error || !product) {
      return NextResponse.json({
        success: false,
        error: 'Product not found',
        code: 'PRODUCT_NOT_FOUND'
      }, { status: 404 });
    }
    
    // Check if product is expired
    const isExpired = new Date(product.expiry_date) < new Date();
    
    // Log the scan
    await supabase
      .from('scans')
      .insert({
        product_id: product.id,
        user_id: userId,
        is_authentic: true,
        location: null // Could be added from request headers
      });
    
    // Award tokens if user is logged in
    const rewardAmount = 10; // QR scan rewards 10 tokens
    let tokensCredited = 0;
    let hederaTransactionId = null;
    
    if (userId) {
      try {
        // Update user's total rewards and scans
        const { error: updateError } = await supabase
          .from('users')
          .update({
            total_scans: (user.total_scans || 0) + 1,
            total_rewards: (user.total_rewards || 0) + rewardAmount
          })
          .eq('id', userId);
        
        if (!updateError) {
          tokensCredited = rewardAmount;
          
          // Transfer tokens via Hedera if user has a Hedera account
          if (user.hedera_account_id) {
            try {
              const receipt = await transferTokens(user.hedera_account_id, rewardAmount);
              hederaTransactionId = receipt?.transactionId?.toString();
            } catch (hederaError) {
              console.error('Hedera transfer failed:', hederaError);
              // Continue even if Hedera transfer fails - user still gets database credit
            }
          }
          
          // Log transaction to token_transactions table
          await supabase
            .from('token_transactions')
            .insert({
              user_id: userId,
              transaction_type: 'qr_scan',
              amount: rewardAmount,
              product_id: product.id,
              description: `QR scan reward - ${product.name}`,
              hedera_transaction_id: hederaTransactionId
            });
        }
      } catch (error) {
        console.error('Error crediting tokens:', error);
        // Don't fail the whole request if crediting fails
      }
    }
    
    return NextResponse.json({
      success: true,
      product: {
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
        isExpired: isExpired,
        company: {
          id: product.companies.id,
          name: product.companies.name,
          logo: product.companies.logo_url,
          location: `${product.companies.city}, ${product.companies.country}`
        },
        hederaExplorerUrl: `https://hashscan.io/testnet/topic/${product.hedera_topic_id}`
      },
      authenticity: {
        verified: true,
        blockchain: 'Hedera Hashgraph',
        transactionId: product.hedera_transaction_id,
        topicId: product.hedera_topic_id
      },
      reward: {
        amount: tokensCredited,
        credited: tokensCredited > 0,
        requiresLogin: !userId,
        hederaTransactionId
      },
      message: isExpired 
        ? '✅ Authentic but EXPIRED. Do not use.' 
        : '✅ Product verified as authentic!'
    });
    
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

