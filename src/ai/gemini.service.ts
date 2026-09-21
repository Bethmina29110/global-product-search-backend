import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private genAI?: GoogleGenerativeAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  async rewriteQuery(query: string): Promise<string> {
    if (!this.genAI) {
      this.logger.warn('GEMINI_API_KEY is missing. Returning original query.');
      return query;
    }

    try {
      // Use a faster model for simple text rewriting if preferred, but flash is fine and fast.
      const model = this.genAI.getGenerativeModel({ model: 'gemini-3.5-flash-lite' });

      const prompt = `
You are an expert e-commerce search optimizer.
The user has provided a conversational search query. Your job is to extract the core product keywords to be used in a Google Shopping search.
Do not include conversational filler words like "I want", "recommend me", "show me", "where can I find", etc.
Keep it concise and optimized for an exact-match keyword search engine.

User Query: "${query}"

Return ONLY the optimized keywords. Do not include any quotes, markdown, or other text.
      `.trim();

      const result = await model.generateContent(prompt);
      const rewrittenQuery = await result.response.text();
      
      const cleanedQuery = rewrittenQuery.trim();
      this.logger.log(`Original query: "${query}" -> Rewritten query: "${cleanedQuery}"`);
      return cleanedQuery;

    } catch (error: any) {
      this.logger.error(`Failed to rewrite query: ${error.message}. Falling back to original query.`);
      return query;
    }
  }

  async extractProducts(query: string, structuredProducts: any[]): Promise<any> {
    if (!this.genAI) {
      this.logger.error('GEMINI_API_KEY is missing. Cannot call Gemini API.');
      throw new InternalServerErrorException('AI Service is not configured properly.');
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-3.5-flash-lite' });

      const context = JSON.stringify(structuredProducts, null, 2);

      const prompt = `
User Query: "${query}"

You are an expert shopping assistant. I am providing you with a list of actual products retrieved from Google Shopping, pre-ranked by semantic similarity to the user's query.
Your task is to evaluate these products, extract specifications, and return a strict JSON response.

Return ONLY valid JSON. Do not use markdown backticks. Do not include any explanation outside the JSON.

Schema:
{
  "topRecommendation": {
    "title": "string (MUST exactly match one of the input product titles)",
    "reason": "string (Why is this the best choice? Be specific about price, specs, and relevance to the query)",
    "score": 10
  },
  "products": [
    {
      "title": "string (MUST exactly match the input title so it can be matched back to the original data)",
      "category": "string (Dynamic category, e.g. 'Gaming Laptops', 'Running Shoes', 'OLED TVs', 'Smartwatches')",
      "specifications": {
        "DynamicKeyBasedOnCategory": "DynamicValue"
      },
      "confidence": 95,
      "summary": "string (One sentence explaining why this product fits the user's need)",
      "reasoning": "string (One sentence explaining why this was selected over similar products)",
      "score": 9
    }
  ]
}

Rules:
* 'title' MUST EXACTLY match the input title so it can be mapped back to the original search result.
* 'confidence' is an integer from 1 to 100 representing how well this product matches the user query.
* 'score' is an integer from 1 to 10. Prioritize: exact match with query intent, lower price, higher rating, better specifications.
* 'specifications' MUST be a dynamic key-value object. NEVER use fixed keys like 'cpu', 'gpu', 'ram', 'storage', 'display'. Instead, use human-readable labels appropriate for the product category:
  - Laptops: { "Processor": "...", "Graphics": "...", "Memory": "...", "Storage": "..." }
  - Phones: { "Chip": "...", "Camera": "...", "Battery": "...", "Display": "..." }
  - TVs: { "Resolution": "...", "Panel": "...", "Refresh Rate": "...", "Screen Size": "..." }
  - Shoes: { "Material": "...", "Sole": "...", "Closure": "..." }
  - Any other category: extract the 2-4 most relevant specifications from the product title.
* Only include specifications that are explicitly mentioned or clearly inferable from the title. Do not invent data.
* Sort the 'products' array by 'score' descending.

Structured Products Context:
${context}
`;

      const result = await model.generateContent(prompt);
      const responseText = await result.response.text();
      
      let parsedJson;
      try {
        let cleanText = responseText.trim();
        if (cleanText.startsWith('\`\`\`json')) {
          cleanText = cleanText.substring(7);
        } else if (cleanText.startsWith('\`\`\`')) {
          cleanText = cleanText.substring(3);
        }
        if (cleanText.endsWith('\`\`\`')) {
          cleanText = cleanText.substring(0, cleanText.length - 3);
        }
        
        parsedJson = JSON.parse(cleanText.trim());
      } catch (parseError: any) {
        this.logger.error('\n=======================================');
        this.logger.error('🔴 GEMINI JSON PARSE FAILED');
        this.logger.error('Raw response from Gemini:');
        this.logger.error(responseText);
        this.logger.error('=======================================\n');
        throw new InternalServerErrorException('AI generated malformed product data.');
      }

      return parsedJson;
    } catch (error: any) {
      if (error.message === 'AI generated malformed product data.') {
        throw error; // Re-throw the parse error
      }
      
      this.logger.error('\n=======================================');
      this.logger.error('🔴 GEMINI API NETWORK/QUOTA FAILED');
      this.logger.error(`Error Message: ${error.message}`);
      this.logger.error(`Full Stack Trace: ${error.stack || error}`);
      this.logger.error('=======================================\n');
      throw new InternalServerErrorException('Failed to generate AI response.');
    }
  }
}
