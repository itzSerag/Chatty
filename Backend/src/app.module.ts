import { Module } from "@nestjs/common";
import { ConfigModule } from "./core/config/config.module";
import { LoggerModule } from "./core/logger/logger.module";
import { DrizzleModule } from "./core/database/drizzle.module";
import { UserModule } from "./modules/user/user.module";
import { AuthModule } from "./modules/auth/auth.module";
import { JwtModule } from "@nestjs/jwt";
import { MessageModule } from "./modules/message/message.module";
import { CloudinaryModule } from "./core/cloudinary/cloudinary.module";
import { SocketModule } from "./socket/socket.module";

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    DrizzleModule,
    UserModule,
    AuthModule,
    JwtModule,
    MessageModule,
    CloudinaryModule,
    SocketModule,
  ],
  controllers: [],
})
export class AppModule { }
