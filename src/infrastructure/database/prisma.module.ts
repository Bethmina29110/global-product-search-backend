import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Prisma Database Module.
 * 
 * Provides global Prisma database service for the entire application.
 * This module is marked as @Global() to make PrismaService available
 * to all modules without explicit imports.
 * 
 * **Features:**
 * - Global module (available to all modules)
 * - Prisma ORM integration
 * - Connection lifecycle management
 * - Soft delete extensions for User model
 * 
 * **Usage:**
 * ```typescript
 * // In app.module.ts
 * imports: [PrismaModule]
 * 
 * // In any service (no need to import PrismaModule)
 * constructor(private prisma: PrismaService) {}
 * 
 * // Standard Prisma operations
 * const user = await this.prisma.user.findUnique({ where: { id } });
 * 
 * // Soft delete (uses extended client)
 * await this.prisma.extended.user.delete({ where: { id } });
 * ```
 * 
 * **Lifecycle:**
 * - Automatically connects to database on module initialization
 * - Verifies connection health
 * - Gracefully disconnects on module destruction
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}