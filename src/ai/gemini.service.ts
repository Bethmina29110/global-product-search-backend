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

  async extractProducts(query: string, structuredProducts: any[]): Promise<any> {
    if (!this.genAI) {
      this.logger.error('GEMINI_API_KEY is missing. Cannot call Gemini API.');
      throw new InternalServerErrorException('AI Service is not configured properly.');
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const context = JSON.stringify(structuredProducts, null, 2);

      const prompt = `
User Query: "${query}"

You are an expert shopping assistant. I am providing you with a list of actual products retrieved from Google Shopping.
Your task is to evaluate these products based on the user's query, extract specifications, rank them, and return a strict JSON response.

Return ONLY valid JSON. Do not use markdown backticks.

Schema:
{
  "topRecommendation": {
    "title": "string (Must exactly match the input title)",
    "reason": "string (Why is this the best choice? Consider price, specs, and ratings)",
    "score": 10
  },
  "products": [
    {
      "title": "string (Must exactly match the input title)",
      "category": "string (Dynamic category based on the product, e.g., 'Running Shoes', 'Smartphones', 'Gaming Laptops')",
      "specs": {
        "key": "string (Extract any highly relevant technical specifications or details dynamically as key-value pairs, e.g., {'RAM': '16GB', 'Material': 'Leather'})"
      },
      "confidence": 95,
      "summary": "string (A personalized sentence on why this fits the user's need)",
      "score": 9
    }
  ]
}

Rules:
* Products array must contain the items from the provided list, enriched with your 'confidence', 'summary', 'category', 'specs', and 'score'.
* 'title' MUST EXACTLY match the title from the input context so it can be mapped back to the database.
* 'confidence' is an integer from 1 to 100 representing how well the product matches the user query.
* 'score' is an integer from 1 to 10. Prioritize lower price, higher ratings, better specifications, and exact match with user intent.
* Extract 'specs' as a dynamic dictionary of the most important product specifications. Only include specs that are explicitly mentioned or clearly inferable. Do not invent specs.
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
        this.logger.error(`Failed to parse Gemini JSON output. Raw response: ${responseText}`);
        throw new InternalServerErrorException('AI generated malformed product data.');
      }

      return parsedJson;
    } catch (error: any) {
      this.logger.error(`Failed to generate content from Gemini: ${error.message}`);
      throw new InternalServerErrorException(error.message === 'AI generated malformed product data.' ? error.message : 'Failed to generate AI response.');
    }
  }
}
