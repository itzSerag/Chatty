import { Controller, Post, Body, UseGuards, Res, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { CurrentUser } from './decorators/user.decorator';
import { User } from '../../core/database/schema';
import { Response } from 'express';
import { JwtAuthGuard } from './guards/jwt.guard';
import { LocalGuard } from './guards/local.guard';

import { AppConfigService } from '../../core/config/config.service';

@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: AppConfigService,
  ) { }

  @Post('signup')
  async signup(
    @Body() createUserDto: CreateUserDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const user = await this.authService.signup(createUserDto, response);
    return user;
  }

  @UseGuards(LocalGuard)
  @Post('login')
  login(
    @CurrentUser() user: User,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { token } = this.authService.login(user, response);

    return {
      ...user,
      password: '',
      token,
    };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) response: Response) {
    response.cookie('Authentication', '', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      expires: new Date(0),
    });
    return { message: 'Logged out successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('user')
  getUser(@CurrentUser() user: User) {
    return user;
  }
}
