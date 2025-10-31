
// app/api/products/verify/route.js
// import { NextResponse } from 'next/server';
// import { supabase } from '@/lib/supabase/supabase';
// import jwt from 'jsonwebtoken';

// export async function POST(request) {
//   try {
//     const body = await request.json();
//     const { hash } = body;
    
//     // Get user from token (if logged in)
//     let userId = null;
//     const authHeader = request.headers.get('authorization');
//     if (authHeader) {
//       const token = authHeader.replace('Bearer ', '');
//       try {
//         const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET);
//         userId = decoded.userId;
//       } catch (e) {
//         // Invalid token, continue as anonymous
//       }
//     }
    
//     // Find product
//     const { data: product, error } = await supabase
//       .from('products')
//       .select(`
//         *,
//         companies (
//           id,
//           name,
//           logo_url,
//           city,
//           country
//         )
//       `)
//       .eq('qr_hash', hash)
//       .single();
    
//     if (error || !product) {
//       // Log fake scan
//       await supabase.from('scans').insert({
//         product_id: null,
//         user_id: userId,
//         is_authentic: false
//       });
      
//       // Award tokens for reporting fake
//       if (userId) {
//         await supabase
//           .from('users')
//           .update({ 
//             total_scans: supabase.raw('total_scans + 1'),
//             total_rewards: supabase.raw('total_rewards + 50')
//           })
//           .eq('id', userId);
//       }
      
//       return NextResponse.json({
//         success: true,
//         verified: false,
//         message: "⚠️ COUNTERFEIT ALERT: This product is not registered.",
//         reward: userId ? 50 : 0,
//         requiresLogin: !userId
//       });
//     }
    
//     // Check expiry
//     const isExpired = new Date(product.expiry_date) < new Date();
    
//     // Log scan
//     await supabase.from('scans').insert({
//       product_id: product.id,
//       user_id: userId,
//       is_authentic: true
//     });
    
//     // Award tokens
//     const rewardAmount = isExpired ? 5 : 10;
//     if (userId) {
//       await supabase
//         .from('users')
//         .update({ 
//           total_scans: supabase.raw('total_scans + 1'),
//           total_rewards: supabase.raw('total_rewards + ' + rewardAmount)
//         })
//         .eq('id', userId);
//     }
    
//     return NextResponse.json({
//       success: true,
//       verified: true,
//       isExpired,
//       product: {
//         name: product.name,
//         description: product.description,
//         category: product.category,
//         manufacturer: product.manufacturer,
//         productId: product.product_id,
//         serialNumber: product.serial_number,
//         batchNumber: product.batch_number,
//         manufacturingDate: product.manufacturing_date,
//         expiryDate: product.expiry_date,
//         companyName: product.companies.name,
//         companyLogo: product.companies.logo_url,
//         companyLocation: `${product.companies.city}, ${product.companies.country}`,
//         hederaExplorerUrl: `https://hashscan.io/testnet/topic/${product.hedera_topic_id}`
//       },
//       reward: userId ? rewardAmount : 0,
//       requiresLogin: !userId,
//       message: isExpired 
//         ? "✅ Authentic but EXPIRED. Do not use." 
//         : "✅ Product verified as authentic!"
//     });
    
//   } catch (error) {
//     console.error('Error:', error);
//     return NextResponse.json({ 
//       success: false, 
//       error: error.message 
//     }, { status: 500 });
//   }
// }


// app/api/products/verify/route.js
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/supabase';
import jwt from 'jsonwebtoken';

export async function POST(request) {
  try {
    const body = await request.json();
    const { hash } = body;
    
    // Validate hash format
    if (!hash || typeof hash !== 'string' || hash.length !== 64) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid hash format' 
      }, { status: 400 });
    }
    
    // Get user from token (if logged in)
    let userId = null;
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      try {
        const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET);
        userId = decoded.userId;
      } catch (e) {
        // Invalid token, continue as anonymous
      }
    }
    
    // Find product
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
      .eq('qr_hash', hash)
      .single();
    
    if (error || !product) {
      // Log fake scan
      await supabase.from('scans').insert({
        product_id: null,
        user_id: userId,
        is_authentic: false
      });
      
      // Award tokens for reporting fake (using RPC function)
      if (userId) {
        await supabase.rpc('increment_user_rewards', {
          user_uuid: userId,
          scan_increment: 1,
          reward_increment: 50
        });
      }
      
      return NextResponse.json({
        success: true,
        verified: false,
        message: "⚠️ COUNTERFEIT ALERT: This product is not registered.",
        reward: userId ? 50 : 0,
        requiresLogin: !userId
      });
    }
    
    // Check expiry
    const isExpired = new Date(product.expiry_date) < new Date();
    
    // Log scan
    await supabase.from('scans').insert({
      product_id: product.id,
      user_id: userId,
      is_authentic: true
    });
    
    // Award tokens (using RPC function)
    const rewardAmount = isExpired ? 5 : 10;
    if (userId) {
      await supabase.rpc('increment_user_rewards', {
        user_uuid: userId,
        scan_increment: 1,
        reward_increment: rewardAmount
      });
    }
    
    return NextResponse.json({
      success: true,
      verified: true,
      isExpired,
      product: {
        name: product.name,
        description: product.description,
        category: product.category,
        manufacturer: product.manufacturer,
        productId: product.product_id,
        serialNumber: product.serial_number,
        batchNumber: product.batch_number,
        manufacturingDate: product.manufacturing_date,
        expiryDate: product.expiry_date,
        companyName: product.companies.name,
        companyLogo: product.companies.logo_url,
        companyLocation: `${product.companies.city || 'Unknown'}, ${product.companies.country || 'Nigeria'}`,
        hederaExplorerUrl: `https://hashscan.io/testnet/topic/${product.hedera_topic_id}`
      },
      reward: userId ? rewardAmount : 0,
      requiresLogin: !userId,
      message: isExpired 
        ? "✅ Authentic but EXPIRED. Do not use." 
        : "✅ Product verified as authentic!"
    });
    
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}