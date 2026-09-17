import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { EnvironmentVariables } from './env.validation';

@Injectable()
export class AppConfigService {
  constructor(
    private readonly configService: NestConfigService<EnvironmentVariables, true>,
  ) {}

  get<T = any>(key: keyof EnvironmentVariables): T {
    return this.configService.get(key as any);
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  get isTest(): boolean {
    return this.nodeEnv === 'test';
  }

  get nodeEnv(): string {
    return this.configService.get('NODE_ENV', { infer: true });
  }

  get port(): number {
    return Number(this.configService.get('PORT', { infer: true }));
  }

  get databaseUrl(): string {
    return this.configService.get('DATABASE_URL', { infer: true });
  }

  get jwtSecret(): string {
    return this.configService.get('JWT_SECRET', { infer: true });
  }

  get jwtExpire(): string {
    return this.configService.get('JWT_EXPIRE', { infer: true });
  }

  get cloudinary() {
    return {
      cloudName: this.configService.get('CLOUDINARY_CLOUD_NAME', { infer: true }),
      apiKey: this.configService.get('CLOUDINARY_API_KEY', { infer: true }),
      apiSecret: this.configService.get('CLOUDINARY_API_SECRET', { infer: true }),
    };
  }

  get frontendUrl(): string | undefined {
    return this.configService.get('FRONTEND_URL', { infer: true });
  }
}
