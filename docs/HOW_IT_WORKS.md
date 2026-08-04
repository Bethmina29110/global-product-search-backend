# Global Product Search Backend - How It Works

## 1. Overview
The Global Product Search Backend is a robust, modular API built using **NestJS**. It is designed to perform advanced product searches across multiple platforms (like Google Shopping) and enrich the results using AI (RAG - Retrieval-Augmented Generation) and Semantic Ranking.

## 2. Core Architecture
- **Framework**: NestJS (v11+) using Domain-Driven Design (DDD).
- **Language**: TypeScript.
- **Database**: PostgreSQL (hosted on Supabase) managed with Prisma ORM.
- **Caching & Queues**: Redis and BullMQ are used for high-performance caching and asynchronous background processing (e.g., audit logs, notifications).
- **Authentication**: JWT-based authentication with Role-Based Access Control (RBAC: SUPER_ADMIN, ADMIN, USER).
- **Logging**: Winston for structured JSON logging.

## 3. The Search & RAG Pipeline
The primary feature of this backend is its intelligent product search capability:
1. **Initial Search (`SearchService`)**: Queries external sources (like SerpApi's Google Shopping engine) to fetch a raw list of products across multiple pages.
2. **Semantic Ranking (`RankingService`)**: Uses a local AI model (`all-MiniLM-L6-v2` via `@xenova/transformers`) to convert product titles and queries into vector embeddings. It calculates cosine similarity to rank the most relevant products (typically the top 15).
3. **AI Enrichment (`GeminiService` & `RagService`)**: The top ranked products are passed to an AI (Gemini) for further extraction, summarization, and categorization.
4. **Final Assembly**: The AI-enriched products are combined with the remaining organically ranked products, formatted with proper store links, and returned to the client.

## 4. Key Modules
- **Auth & Users**: Handles registration, login, JWT issuance, and profile management.
- **Search & RAG**: Handles fetching, ranking, and AI-enriching product queries.
- **Audit Logs**: Tracks system events asynchronously.
- **Notifications**: System-wide alerts pushed via queues.
- **Favourites & Saved Search**: Allows users to save specific products or search queries for later retrieval.

## 5. Coding Standards & Best Practices
- **Skinny Controllers / Fat Services**: Controllers only handle HTTP routing and validation; all business logic lives in Services.
- **Data Validation**: Uses `class-validator` and `class-transformer` for strict DTO validation.
- **Error Handling**: Global exception filters (e.g., `AllExceptionsFilter`, `PrismaExceptionFilter`) standardize error responses across the application.
