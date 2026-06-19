import { Injectable } from '@nestjs/common';

@Injectable()
export class AiService {
  async generateAnswer(
    query: string,
    products: any[],
  ): Promise<{ topRecommendation: any; products: any[] }> {
    const enhancedProducts = products.map((p, index) => ({
      title: p.title,
      price: p.price,
      aiSummary: `The ${p.title} is an excellent option for "${query}" offering great value for money.`,
      score: 10 - index, // Simple mock score
    }));

    return {
      topRecommendation: enhancedProducts[0] || null,
      products: enhancedProducts,
    };
  }
}
