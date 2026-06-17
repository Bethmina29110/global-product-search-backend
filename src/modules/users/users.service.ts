import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, createdAt: true },
    });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    return user;
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: { id: true, name: true, email: true, createdAt: true },
    });
  }
}