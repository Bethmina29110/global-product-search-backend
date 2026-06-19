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

  async extractProducts(query: string, searchResults: any[]): Promise<any> {
    if (!this.genAI) {
      this.logger.error('GEMINI_API_KEY is missing. Cannot call Gemini API.');
      throw new InternalServerErrorException('AI Service is not configured properly.');
    }

    try {
      // Using gemini-2.5-flash as previously configured
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const context = searchResults
        .map((r, i) => `[Result ${i + 1}] Title: ${r.title}\nContent: ${r.content}`)
        .join('\n\n');

      const prompt = `
User Query: "${query}"

Based on the search results below, identify the best products.

Return ONLY valid JSON.

Schema:
{
  "topRecommendation": {
    "title": "string",
    "reason": "string",
    "score": 1
  },
  "products": [
    {
      "title": "string",
      "summary": "string",
      "score": 1
    }
  ]
}

Rules:
* Return valid JSON only.
* Do not use markdown.
* Do not use code fences.
* Do not add explanations outside JSON.
* Products should be ranked by relevance.
* Score should be from 1-10.

Search Results:
${context}
`;

      const result = await model.generateContent(prompt);
      const responseText = await result.response.text();
      
      let parsedJson;
      try {
        // Strip markdown backticks if Gemini accidentally adds them
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
