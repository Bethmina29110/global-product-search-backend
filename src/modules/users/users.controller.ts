import { Controller, Get, Param, ParseIntPipe, Patch, Body, Post, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { UsersService } from './users.service';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getProfile(@CurrentUser() user: any) {
    return this.usersService.findById(Number(user.sub));
  }

  @Patch('me')
  async updateProfile(@CurrentUser() user: any, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(Number(user.sub), dto);
  }

  @Post('me/change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(@CurrentUser() user: any, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(Number(user.sub), dto);
  }

  @Delete('me/search-history')
  @HttpCode(HttpStatus.OK)
  async clearSearchHistory(@CurrentUser() user: any) {
    return this.usersService.clearSearchHistory(Number(user.sub));
  }

  @Delete('me/favourites')
  @HttpCode(HttpStatus.OK)
  async clearFavourites(@CurrentUser() user: any) {
    return this.usersService.clearAllFavourites(Number(user.sub));
  }

  @Delete('me/saved-searches')
  @HttpCode(HttpStatus.OK)
  async clearSavedSearches(@CurrentUser() user: any) {
    return this.usersService.clearAllSavedSearches(Number(user.sub));
  }

  @Delete('me')
  @HttpCode(HttpStatus.OK)
  async deleteAccount(@CurrentUser() user: any) {
    return this.usersService.deleteAccount(Number(user.sub));
  }

}