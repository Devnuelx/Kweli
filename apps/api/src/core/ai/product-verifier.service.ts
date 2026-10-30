import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cheerio from 'cheerio';

export interface WebSearchResult {
  results: Array<{ title: string; snippet: string; link: string }>;
  hasOfficialSite: boolean;
}

export interface VerificationResult {
  verified: boolean;
  confidence: number;
  riskLevel: 'low' | 'medium' | 'high';
  product: {
    brandName: string;
    productName: string;
    category: string;
    packagingQuality: number;
    textClarity: number;
    imageQuality: number;
  };
  suspiciousElements: string[];
  legitimacyIndicators: string[];
  webSearch: WebSearchResult;
  warnings: string[];
  recommendations: string[];
  rewardEligible: boolean;
}

@Injectable()
export class ProductVerifierService {
  private readonly logger = new Logger(ProductVerifierService.name);

  constructor(private readonly configService: ConfigService) {}

  async verifyProduct(imageBase64: string): Promise<VerificationResult> {
    try {
      const apiKey = this.configService.get<string>('GEMINI_API_KEY');
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY not configured');
      }

      // 1. Analyze image with Gemini
      const aiResponse = await this.analyzeImageWithGemini(imageBase64, apiKey);
      
      // 2. Web search for legitimacy
      let webSearch: WebSearchResult = { results: [], hasOfficialSite: false };
      try {
        if (aiResponse.brandName && aiResponse.productName) {
          webSearch = await this.searchProductOnline(aiResponse.brandName, aiResponse.productName);
        }
      } catch (err) {
        const error = err as Error;
        this.logger.warn(`Web search failed: ${error.message}`);
      }

      // 3. Calculate confidence
      const confidence = this.calculateConfidenceScore(aiResponse, webSearch);
      
      // 4. Assess risk
      const suspiciousCount = aiResponse.suspiciousElements?.length || 0;
      let riskLevel: 'low' | 'medium' | 'high' = 'high';
      
      if (confidence >= 80 && suspiciousCount === 0) {
        riskLevel = 'low';
      } else if (confidence >= 60 && suspiciousCount <= 1) {
        riskLevel = 'medium';
      }

      // 5. Generate warnings/recommendations
      const warnings = [...(aiResponse.suspiciousElements || [])];
      if (confidence < 70) warnings.push('Overall confidence score is low.');
      if (!webSearch.hasOfficialSite && riskLevel !== 'low') {
        warnings.push('Could not definitively verify brand presence online.');
      }

      const recommendations = [];
      if (riskLevel === 'high') recommendations.push('Do not consume. Please report this product.');
      else if (riskLevel === 'medium') recommendations.push('Exercise caution. Verify batch numbers with the manufacturer.');
      else recommendations.push('Product appears authentic based on visual analysis.');

      return {
        verified: riskLevel === 'low',
        confidence,
        riskLevel,
        product: aiResponse,
        suspiciousElements: aiResponse.suspiciousElements || [],
        legitimacyIndicators: aiResponse.legitimacyIndicators || [],
        webSearch,
        warnings,
        recommendations,
        rewardEligible: riskLevel === 'low', // Reward only for low risk
      };

    } catch (error) {
      const err = error as Error;
      this.logger.error(`AI Verification failed: ${err.message}`, err.stack);
      throw new InternalServerErrorException('Product verification service unavailable');
    }
  }

  private async analyzeImageWithGemini(imageBase64: string, apiKey: string): Promise<any> {
    const prompt = `You are an expert product authentication AI. Analyze this product image to determine its authenticity.
Return ONLY a raw JSON object (no markdown, no backticks) with the following structure:
{
  "brandName": "Extracted brand name or null",
  "productName": "Extracted product name or null",
  "category": "Product category",
  "packagingQuality": 8, // scale 1-10
  "textClarity": 9, // scale 1-10
  "imageQuality": 7, // scale 1-10
  "suspiciousElements": ["list of any weird fonts, misspellings, poor print quality, missing seals"],
  "legitimacyIndicators": ["holograms, clear print, proper seals"],
  "batchNumber": "extracted batch/lot number or null",
  "dates": "extracted mfg/exp dates or null"
}`;

    // Clean base64 string if it has data URI prefix
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: base64Data
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json',
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!textResult) {
      throw new Error('Invalid response from Gemini');
    }

    try {
      // Remove any markdown formatting if Gemini ignored the instruction
      const cleanJson = textResult.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (e) {
      this.logger.error('Failed to parse Gemini JSON', textResult);
      throw new Error('Failed to parse AI analysis results');
    }
  }

  async searchProductOnline(brandName: string, productName: string): Promise<WebSearchResult> {
    const query = `${brandName} ${productName} official site`;
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      return { results: [], hasOfficialSite: false };
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const results: Array<{title: string; snippet: string; link: string}> = [];
    let hasOfficialSite = false;

    $('.g').each((i, el) => {
      if (i > 4) return; // Only top 5
      const title = $(el).find('h3').text();
      const link = $(el).find('a').attr('href') || '';
      const snippet = $(el).find('.VwiC3b').text();
      
      if (title && link) {
        results.push({ title, snippet, link });
        
        // Very basic official site heuristic
        const lowerLink = link.toLowerCase();
        const lowerBrand = brandName.toLowerCase().replace(/\s+/g, '');
        if (lowerLink.includes(lowerBrand) || lowerLink.includes('official')) {
          hasOfficialSite = true;
        }
      }
    });

    return { results, hasOfficialSite };
  }

  private calculateConfidenceScore(aiResponse: any, webSearch: WebSearchResult): number {
    let score = 0;
    
    // Base image metrics (55% of total)
    const imgQ = (aiResponse.imageQuality || 5) / 10;
    const packQ = (aiResponse.packagingQuality || 5) / 10;
    const textQ = (aiResponse.textClarity || 5) / 10;
    
    score += imgQ * 15; // 15%
    score += packQ * 25; // 25%
    score += textQ * 15; // 15%
    
    // Legitimacy indicators (+ points)
    if (aiResponse.legitimacyIndicators?.length > 0) {
      score += Math.min(10, aiResponse.legitimacyIndicators.length * 5);
    }
    
    // Suspicious elements (- points)
    if (aiResponse.suspiciousElements?.length > 0) {
      score -= Math.min(30, aiResponse.suspiciousElements.length * 10);
    }
    
    // Web presence (45% of total)
    if (webSearch.hasOfficialSite) {
      score += 25; // 25% for official site
    } else if (webSearch.results.length > 0) {
      score += 10; // Partial credit for general presence
    }
    
    // If brand/product identified clearly
    if (aiResponse.brandName && aiResponse.productName) {
      score += 20; // 20%
    }
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }
}
