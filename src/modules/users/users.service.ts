import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma.service';
import * as bcrypt from 'bcrypt';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

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



  async updateProfile(userId: number, dto: UpdateProfileDto) {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException('No fields provided to update');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: { id: true, name: true, email: true, createdAt: true },
    });
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException('Incorrect current password');
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(dto.newPassword, salt);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Password changed successfully' };
  }

  async clearSearchHistory(userId: number) {
    const result = await this.prisma.searchLog.deleteMany({ where: { userId } });
    return { message: `Cleared ${result.count} search logs` };
  }

  async clearAllFavourites(userId: number) {
    const result = await this.prisma.favourite.deleteMany({ where: { userId } });
    return { message: `Cleared ${result.count} favorites` };
  }

  async clearAllSavedSearches(userId: number) {
    const result = await this.prisma.savedSearch.deleteMany({ where: { userId } });
    return { message: `Cleared ${result.count} saved searches` };
  }

  async deleteAccount(userId: number) {
    await this.prisma.user.delete({ where: { id: userId } });
    return { message: 'Account successfully deleted' };
  }
}