// app/api/user/history/route.js
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/supabase';
import jwt from 'jsonwebtoken';

export async function GET(request) {
  try {
    // Get user from JWT token
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }
    
    const token = authHeader.replace('Bearer ', '');
    let userId;
    
    try {
      const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET);
      userId = decoded.userId;
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: 'Invalid or expired token'
      }, { status: 401 });
    }
    
    // Get pagination parameters from query string
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;
    
    // Fetch user's transaction history
    const { data: transactions, error, count } = await supabase
      .from('token_transactions')
      .select(`
        *,
        products (
          id,
          name,
          product_id,
          companies (
            name,
            logo_url
          )
        )
      `, { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      throw error;
    }
    
    // Fetch user's current balance
    const { data: userData } = await supabase
      .from('users')
      .select('total_rewards, total_scans')
      .eq('id', userId)
      .single();
    
    // Calculate running balance for each transaction
    let runningBalance = userData?.total_rewards || 0;
    const transactionsWithBalance = transactions.map((transaction, index) => {
      // For the first transaction (most recent), start with current balance
      if (index === 0) {
        runningBalance = userData?.total_rewards || 0;
      }
      
      const balanceAtTime = runningBalance;
      
      // Subtract this transaction amount to get previous balance
      // (since we're going backwards in time)
      runningBalance -= transaction.amount;
      
      return {
        id: transaction.id,
        type: transaction.transaction_type,
        amount: transaction.amount,
        description: transaction.description,
        product: transaction.products ? {
          id: transaction.products.id,
          name: transaction.products.name,
          productId: transaction.products.product_id,
          company: transaction.products.companies ? {
            name: transaction.products.companies.name,
            logo: transaction.products.companies.logo_url
          } : null
        } : null,
        hederaTransactionId: transaction.hedera_transaction_id,
        balanceAfter: balanceAtTime,
        timestamp: transaction.created_at
      };
    });
    
    // Calculate summary statistics
    const summary = {
      totalTransactions: count || 0,
      currentBalance: userData?.total_rewards || 0,
      totalScans: userData?.total_scans || 0,
      transactionsByType: {}
    };
    
    // Count transactions by type
    transactions.forEach(transaction => {
      const type = transaction.transaction_type;
      if (!summary.transactionsByType[type]) {
        summary.transactionsByType[type] = {
          count: 0,
          totalAmount: 0
        };
      }
      summary.transactionsByType[type].count++;
      summary.transactionsByType[type].totalAmount += parseFloat(transaction.amount);
    });
    
    return NextResponse.json({
      success: true,
      transactions: transactionsWithBalance,
      summary,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil((count || 0) / limit),
        totalItems: count || 0,
        itemsPerPage: limit,
        hasNextPage: offset + limit < (count || 0),
        hasPreviousPage: page > 1
      }
    });
    
  } catch (error) {
    console.error('History fetch error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch transaction history',
      details: error.message
    }, { status: 500 });
  }
}

