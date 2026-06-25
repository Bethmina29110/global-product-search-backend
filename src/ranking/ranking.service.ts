import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

@Injectable()
export class RankingService implements OnModuleInit {
  private readonly logger = new Logger(RankingService.name);
  private pipeline: any = null;
  private pipelineLoading: Promise<void> | null = null;

  async onModuleInit() {
    // Pre-warm the model on server startup so first user request is instant
    this.logger.log('Pre-warming Semantic Ranking model (all-MiniLM-L6-v2)...');
    await this.loadPipeline();
    this.logger.log('Semantic Ranking model ready.');
  }

  private async loadPipeline(): Promise<void> {
    if (this.pipeline) return;

    // Only start loading once, even if multiple requests come in simultaneously
    if (!this.pipelineLoading) {
      this.pipelineLoading = (async () => {
        // Dynamic import to avoid CommonJS/ESM conflicts at startup
        const { pipeline } = await import('@xenova/transformers');
        this.pipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
      })();
    }

    await this.pipelineLoading;
  }

  /**
   * Computes the cosine similarity between two vectors.
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dot += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dot / denom;
  }

  /**
   * Converts a Tensor output from @xenova/transformers into a plain number[].
   * Mean-pools across the token dimension.
   */
  private tensorToVector(output: any): number[] {
    // output.data is a flat Float32Array of shape [1, seq_len, hidden_size]
    const data: Float32Array = output.data;
    const dims: number[] = output.dims; // e.g. [1, seq_len, 384]
    const seqLen = dims[1];
    const hiddenSize = dims[2];

    // Mean pooling across sequence dimension
    const vector = new Array(hiddenSize).fill(0);
    for (let t = 0; t < seqLen; t++) {
      for (let h = 0; h < hiddenSize; h++) {
        vector[h] += data[t * hiddenSize + h];
      }
    }
    for (let h = 0; h < hiddenSize; h++) {
      vector[h] /= seqLen;
    }
    return vector;
  }

  /**
   * Ranks products by semantic similarity to the query using all-MiniLM-L6-v2.
   * Returns the top N most relevant products.
   */
  async rankProducts(query: string, products: any[], topN = 15): Promise<any[]> {
    if (!products || products.length === 0) return [];

    await this.loadPipeline();

    this.logger.log(`Ranking ${products.length} products for query: "${query}"`);

    // Build text representations for each product
    const productTexts = products.map((p: any) =>
      [p.title, p.store, p.price].filter(Boolean).join(' ')
    );

    // Generate all embeddings in one batch
    const allTexts = [query, ...productTexts];
    const outputs = await this.pipeline(allTexts, { pooling: 'mean', normalize: true });

    // Extract query vector (first item)
    const queryVec = Array.from(outputs[0].data) as number[];

    // Score each product
    const scored = products.map((product: any, i: number) => {
      const productVec = Array.from(outputs[i + 1].data) as number[];
      const similarity = this.cosineSimilarity(queryVec, productVec);
      return { ...product, _similarityScore: similarity };
    });

    // Sort descending by similarity
    scored.sort((a, b) => b._similarityScore - a._similarityScore);

    const top = scored.slice(0, topN);
    const rest = scored.slice(topN);

    this.logger.log(
      `Top ${topN} selected. Highest similarity: ${top[0]?._similarityScore.toFixed(4)} | Lowest: ${top[top.length - 1]?._similarityScore.toFixed(4)}`
    );

    // Return top and rest separately so RAG can merge them
    return { top, rest } as any;
  }
}
