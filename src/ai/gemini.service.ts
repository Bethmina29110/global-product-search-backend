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

      // Pass the JSON-stringified structured products from SerpApi directly to the prompt
      const context = JSON.stringify(structuredProducts, null, 2);

      const prompt = `
User Query: "${query}"

You are an expert shopping assistant. I am providing you with a list of actual products retrieved from Google Shopping.
Your task is to evaluate these products based on the user's query, rank them, and return a strict JSON response.

Return ONLY valid JSON. Do not use markdown backticks.

Schema:
{
  "topRecommendation": {
    "title": "string",
    "reason": "string (Why is this the best choice?)",
    "score": 10
  },
  "products": [
    {
      "title": "string (Must match input)",
      "imageUrl": "string (Must match input)",
      "price": "string or number (Must match input)",
      "rating": 4.5,
      "store": "string (Must match input)",
      "productUrl": "string (Must match input)",
      "confidence": 95,
      "summary": "string (A personalized sentence on why this fits the user's need)",
      "score": 9
    }
  ]
}

Rules:
* Products array must contain the items from the provided list, enriched with your 'confidence', 'summary', and 'score'.
* 'confidence' is an integer from 1 to 100 representing how well the product matches the user query.
* 'score' is an integer from 1 to 10 representing overall product quality/relevance.
* Retain the exact 'imageUrl', 'price', 'store', and 'productUrl' provided in the input context.
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
