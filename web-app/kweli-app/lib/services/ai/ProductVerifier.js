// lib/services/ai/ProductVerifier.js
import OpenAI from 'openai';
import axios from 'axios';
import * as cheerio from 'cheerio';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Verifies product authenticity using AI vision and web search
 */
export class ProductVerifier {
  
  /**
   * Main verification method
   * @param {string} imageBase64 - Base64 encoded image string
   * @returns {Promise<Object>} Verification result with confidence score
   */
  async verifyProduct(imageBase64) {
    try {
      // Step 1: Extract product information from image using OpenAI Vision
      const extractedInfo = await this.extractProductInfo(imageBase64);
      
      if (!extractedInfo.success) {
        return {
          success: false,
          error: 'Failed to extract product information from image',
          details: extractedInfo.error
        };
      }
      
      // Step 2: Search for official product information online
      const webSearchResults = await this.searchProductOnline(
        extractedInfo.brandName,
        extractedInfo.productName
      );
      
      // Step 3: Calculate detailed confidence scoring
      const scoring = this.calculateDetailedScore(extractedInfo, webSearchResults);
      
      // Step 4: Assess risk level
      const riskAssessment = this.assessRisk(scoring, extractedInfo);
      
      // Step 5: Generate warnings and recommendations
      const warnings = this.generateWarnings(extractedInfo, webSearchResults, scoring);
      const recommendations = this.generateRecommendations(riskAssessment.level, extractedInfo);
      
      return {
        success: true,
        verified: riskAssessment.level === 'low',
        confidence: scoring.overall,
        riskLevel: riskAssessment.level,
        extractedInfo: {
          brandName: extractedInfo.brandName,
          productName: extractedInfo.productName,
          category: extractedInfo.category,
          packagingQuality: extractedInfo.packagingQuality,
          batchNumber: extractedInfo.batchNumber,
          manufacturingDate: extractedInfo.manufacturingDate,
          expiryDate: extractedInfo.expiryDate,
          suspiciousElements: extractedInfo.suspiciousElements || [],
          legitimacyIndicators: extractedInfo.legitimacyIndicators || [],
        },
        scoring: {
          overall: scoring.overall,
          breakdown: {
            imageQuality: scoring.imageQuality,
            packagingQuality: scoring.packagingQuality,
            brandLegitimacy: scoring.brandLegitimacy,
            webPresence: scoring.webPresence,
            textClarity: scoring.textClarity,
          }
        },
        analysis: scoring.analysis,
        webSearchResults: {
          success: webSearchResults.success,
          hasOfficialWebsite: webSearchResults.hasOfficialWebsite,
          totalResults: webSearchResults.totalResults,
          relevantLinks: webSearchResults.results?.slice(0, 3) || [],
        },
        warnings,
        recommendations,
        rewardEligible: riskAssessment.level === 'low' && scoring.overall >= 70,
        message: this.generateMessage(riskAssessment.level, scoring.overall)
      };
      
    } catch (error) {
      console.error('Product verification error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Extract product information from image using OpenAI Vision
   * @param {string} imageBase64 - Base64 encoded image
   * @returns {Promise<Object>} Extracted product information
   */
  async extractProductInfo(imageBase64) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this product image thoroughly and extract the following information in JSON format:
{
  "brandName": "exact brand name visible",
  "productName": "product name/model",
  "category": "product category (e.g., pharmaceuticals, electronics, food, fashion)",
  "packagingQuality": "poor/average/good/excellent",
  "imageQuality": "poor/average/good/excellent",
  "textClarity": "poor/average/good/excellent (how clear is text on packaging)",
  "batchNumber": "batch/lot number if visible",
  "manufacturingDate": "manufacturing date if visible",
  "expiryDate": "expiry date if visible",
  "suspiciousElements": ["list any suspicious elements like misspellings, poor printing, blurry text, misaligned labels, etc"],
  "legitimacyIndicators": ["list quality indicators like holograms, proper seals, QR codes, professional printing, etc"],
  "overallImpression": "brief assessment of authenticity"
}

Be extremely thorough and critical. Look for:
- Print quality and clarity
- Spelling and grammar errors
- Professional packaging design
- Presence of security features
- Label alignment and quality
- Color consistency
- Any signs of tampering
- Font quality and consistency

If you cannot clearly identify something, indicate "Unknown" or "Not visible".`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        max_tokens: 800
      });
      
      const content = response.choices[0].message.content;
      
      // Parse JSON response
      let parsedInfo;
      try {
        // Try to extract JSON from markdown code blocks if present
        const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/);
        if (jsonMatch) {
          parsedInfo = JSON.parse(jsonMatch[1]);
        } else {
          parsedInfo = JSON.parse(content);
        }
      } catch (e) {
        // If parsing fails, try to extract key information manually
        console.error('Failed to parse OpenAI response:', e);
        parsedInfo = {
          brandName: this.extractField(content, 'brandName') || 'Unknown',
          productName: this.extractField(content, 'productName') || 'Unknown',
          category: this.extractField(content, 'category') || 'Unknown',
          packagingQuality: 'average',
          imageQuality: 'average',
          textClarity: 'average',
          suspiciousElements: [],
          legitimacyIndicators: [],
          overallImpression: content,
          rawResponse: content
        };
      }
      
      return {
        success: true,
        ...parsedInfo
      };
      
    } catch (error) {
      console.error('OpenAI Vision error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Helper to extract field from text response
   */
  extractField(text, fieldName) {
    const regex = new RegExp(`"${fieldName}"\\s*:\\s*"([^"]*)"`, 'i');
    const match = text.match(regex);
    return match ? match[1] : null;
  }
  
  /**
   * Search for product information online
   * @param {string} brandName - Brand name to search
   * @param {string} productName - Product name to search
   * @returns {Promise<Object>} Web search results
   */
  async searchProductOnline(brandName, productName) {
    try {
      const searchQuery = `${brandName} ${productName} official product`;
      const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
      
      // Fetch Google search results
      const response = await axios.get(googleSearchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 5000
      });
      
      const $ = cheerio.load(response.data);
      
      // Extract search results
      const results = [];
      $('.g').each((i, element) => {
        if (i >= 5) return false; // Limit to top 5 results
        
        const title = $(element).find('h3').text();
        const link = $(element).find('a').attr('href');
        const snippet = $(element).find('.VwiC3b').text() || $(element).find('.IsZvec').text();
        
        if (title && link) {
          results.push({
            title,
            link,
            snippet
          });
        }
      });
      
      // Check if brand website is in results
      const brandDomain = brandName.toLowerCase().replace(/\s+/g, '');
      const hasOfficialWebsite = results.some(result => 
        result.link.toLowerCase().includes(brandDomain) ||
        result.title.toLowerCase().includes('official')
      );
      
      return {
        success: true,
        query: searchQuery,
        results,
        hasOfficialWebsite,
        totalResults: results.length
      };
      
    } catch (error) {
      console.error('Web search error:', error);
      return {
        success: false,
        error: 'Failed to search online',
        details: error.message,
        results: [],
        hasOfficialWebsite: false,
        totalResults: 0
      };
    }
  }
  
  /**
   * Calculate detailed confidence score (0-100)
   */
  calculateDetailedScore(extractedInfo, webSearchResults) {
    const scores = {
      imageQuality: this.scoreQuality(extractedInfo.imageQuality),
      packagingQuality: this.scoreQuality(extractedInfo.packagingQuality),
      textClarity: this.scoreQuality(extractedInfo.textClarity),
      brandLegitimacy: 0,
      webPresence: 0
    };

    const analysis = [];

    // Score brand legitimacy
    if (extractedInfo.brandName && extractedInfo.brandName !== 'Unknown') {
      scores.brandLegitimacy = 70;
      analysis.push(`Brand identified: ${extractedInfo.brandName}`);
      
      if (!extractedInfo.suspiciousElements || extractedInfo.suspiciousElements.length === 0) {
        scores.brandLegitimacy = 85;
        analysis.push('No suspicious elements detected');
      } else {
        analysis.push(`${extractedInfo.suspiciousElements.length} suspicious element(s) found`);
      }
      
      if (extractedInfo.legitimacyIndicators && extractedInfo.legitimacyIndicators.length > 0) {
        scores.brandLegitimacy = Math.min(100, scores.brandLegitimacy + (extractedInfo.legitimacyIndicators.length * 5));
        analysis.push(`${extractedInfo.legitimacyIndicators.length} legitimacy indicator(s) present`);
      }
    } else {
      analysis.push('Brand name not clearly identifiable');
    }

    // Score web presence
    if (webSearchResults.success) {
      scores.webPresence = 50;
      if (webSearchResults.hasOfficialWebsite) {
        scores.webPresence = 85;
        analysis.push('Official brand website found');
      }
      if (webSearchResults.totalResults > 5) {
        scores.webPresence = Math.min(100, scores.webPresence + 15);
        analysis.push(`Strong online presence (${webSearchResults.totalResults} results)`);
      }
    } else {
      analysis.push('Limited online verification available');
    }

    // Add packaging quality to analysis
    if (extractedInfo.packagingQuality === 'excellent' || extractedInfo.packagingQuality === 'good') {
      analysis.push('High quality packaging detected');
    } else if (extractedInfo.packagingQuality === 'poor') {
      analysis.push('Low packaging quality - potential concern');
    }

    // Weighted average
    const weights = {
      imageQuality: 0.15,
      packagingQuality: 0.25,
      textClarity: 0.15,
      brandLegitimacy: 0.25,
      webPresence: 0.20
    };

    const overall = Math.round(
      scores.imageQuality * weights.imageQuality +
      scores.packagingQuality * weights.packagingQuality +
      scores.textClarity * weights.textClarity +
      scores.brandLegitimacy * weights.brandLegitimacy +
      scores.webPresence * weights.webPresence
    );

    return {
      overall,
      ...scores,
      analysis
    };
  }

  /**
   * Convert quality rating to score
   */
  scoreQuality(quality) {
    const qualityMap = {
      'poor': 25,
      'average': 50,
      'good': 75,
      'excellent': 95
    };
    return qualityMap[quality?.toLowerCase()] || 50;
  }

  /**
   * Assess risk level based on scoring
   */
  assessRisk(scoring, extractedInfo) {
    const { overall } = scoring;
    const suspiciousCount = extractedInfo.suspiciousElements?.length || 0;

    if (overall >= 80 && suspiciousCount === 0) {
      return {
        level: 'low',
        description: 'Product appears authentic with high confidence'
      };
    } else if (overall >= 60 && suspiciousCount <= 1) {
      return {
        level: 'medium',
        description: 'Product authenticity uncertain, proceed with caution'
      };
    } else {
      return {
        level: 'high',
        description: 'High risk of counterfeit, verification strongly recommended'
      };
    }
  }

  /**
   * Generate warnings based on findings
   */
  generateWarnings(extractedInfo, webSearchResults, scoring) {
    const warnings = [];

    if (scoring.imageQuality < 50) {
      warnings.push('Image quality is poor - results may be inaccurate');
    }

    if (scoring.packagingQuality < 60) {
      warnings.push('Packaging quality appears below standard');
    }

    if (extractedInfo.suspiciousElements?.length > 0) {
      extractedInfo.suspiciousElements.forEach(element => {
        warnings.push(`⚠️ ${element}`);
      });
    }

    if (!webSearchResults.hasOfficialWebsite) {
      warnings.push('No official website found for this brand');
    }

    if (webSearchResults.totalResults < 3) {
      warnings.push('Limited online presence for this product');
    }

    if (!extractedInfo.batchNumber || extractedInfo.batchNumber === 'Not visible') {
      warnings.push('No batch/lot number visible on packaging');
    }

    return warnings;
  }

  /**
   * Generate recommendations based on risk level
   */
  generateRecommendations(riskLevel, extractedInfo) {
    const recommendations = [];

    if (riskLevel === 'high') {
      recommendations.push('⚠️ Do not use this product until verified');
      recommendations.push('Contact the manufacturer directly for verification');
      recommendations.push('Purchase only from authorized retailers');
      recommendations.push('Report suspected counterfeit to authorities');
    } else if (riskLevel === 'medium') {
      recommendations.push('Verify batch number on manufacturer website if available');
      recommendations.push('Look for QR code and scan for definitive verification');
      recommendations.push('Compare with known authentic products');
      recommendations.push('Purchase from verified retailers when possible');
    } else {
      recommendations.push('✅ Product appears authentic');
      if (extractedInfo.batchNumber && extractedInfo.batchNumber !== 'Not visible') {
        recommendations.push(`Verify batch number "${extractedInfo.batchNumber}" on official website for 100% confirmation`);
      }
      recommendations.push('Always prefer QR code verification when available');
      recommendations.push('Keep receipt and packaging for warranty purposes');
    }

    return recommendations;
  }

  /**
   * Generate user-friendly message
   */
  generateMessage(riskLevel, confidence) {
    if (riskLevel === 'low') {
      return `✅ Product verified with ${confidence}% confidence! Likely authentic.`;
    } else if (riskLevel === 'medium') {
      return `⚠️ Verification uncertain (${confidence}% confidence). Please verify through other means.`;
    } else {
      return `❌ High risk of counterfeit (${confidence}% confidence). Do not use without further verification.`;
    }
  }
}

// Export singleton instance
export const productVerifier = new ProductVerifier();