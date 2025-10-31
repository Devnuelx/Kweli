// app/api/verify-ai/route.js
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/supabase';
import { productVerifier } from '@/lib/services/ai/ProductVerifier';
import { transferTokens } from '@/lib/hedera/transferToken';
import jwt from 'jsonwebtoken';

export async function POST(request) {
  try {
    const body = await request.json();
    const { image } = body;
    
    // Validate image
    if (!image || typeof image !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Invalid image format. Please provide a base64 encoded image.'
      }, { status: 400 });
    }
    
    // Remove data URI prefix if present
    const base64Image = image.replace(/^data:image\/\w+;base64,/, '');
    
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
        // Continue without user - anonymous verification allowed
      }
    }
    
    // Verify product using AI
    console.log('Starting AI product verification...');
    const verificationResult = await productVerifier.verifyProduct(base64Image);
    
    if (!verificationResult.success) {
      return NextResponse.json({
        success: false,
        error: verificationResult.error,
        details: verificationResult.details
      }, { status: 400 });
    }
    
    // Determine if user gets reward
    const rewardAmount = 5; // AI verification rewards 5 tokens
    let tokensCredited = 0;
    let hederaTransactionId = null;
    
    // Credit tokens if user is logged in and verification passed
    if (userId && verificationResult.rewardEligible) {
      try {
        // Update user's total rewards and scans
        const { error: updateError } = await supabase
          .from('users')
          .update({
            total_scans: (user.total_scans || 0) + 1,
            total_rewards: (user.total_rewards || 0) + rewardAmount
          })
          .eq('id', userId);
        
        if (updateError) {
          console.error('Error updating user rewards:', updateError);
        } else {
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
              transaction_type: 'ai_verification',
              amount: rewardAmount,
              description: `AI verification reward - ${verificationResult.extractedInfo.brandName} ${verificationResult.extractedInfo.productName}`,
              hedera_transaction_id: hederaTransactionId
            });
        }
      } catch (error) {
        console.error('Error crediting tokens:', error);
        // Don't fail the whole request if crediting fails
      }
    }
    
    // Return verification result
    return NextResponse.json({
      success: true,
      verified: verificationResult.verified,
      confidence: verificationResult.confidence,
      product: {
        brandName: verificationResult.extractedInfo.brandName,
        productName: verificationResult.extractedInfo.productName,
        category: verificationResult.extractedInfo.category,
        packagingQuality: verificationResult.extractedInfo.packagingQuality
      },
      analysis: verificationResult.analysis,
      webSearch: {
        found: verificationResult.webSearchResults.success,
        hasOfficialWebsite: verificationResult.webSearchResults.hasOfficialWebsite,
        totalResults: verificationResult.webSearchResults.totalResults
      },
      reward: {
        eligible: verificationResult.rewardEligible,
        amount: tokensCredited,
        credited: tokensCredited > 0,
        requiresLogin: !userId && verificationResult.rewardEligible,
        hederaTransactionId
      },
      message: verificationResult.verified 
        ? `✅ Product verified with ${verificationResult.confidence}% confidence!` 
        : `⚠️ Verification uncertain (${verificationResult.confidence}% confidence). Please verify through other means.`
    });
    
  } catch (error) {
    console.error('Verify AI error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}

