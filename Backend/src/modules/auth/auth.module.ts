import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from '../user/user.module';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GuardsModule } from '../../core/guards/guards.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    GuardsModule, // provides + exports JwtAuthGuard (used on AuthController)
    ConfigModule, // Import ConfigModule to make ConfigService available
    UserModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'), // Access JWT_SECRET from environment variables
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRE') as any,
        },
      }),
      inject: [ConfigService]
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  exports: [AuthService, PassportModule],
})
export class AuthModule { }