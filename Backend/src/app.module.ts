import { Module } from "@nestjs/common";
import { ConfigModule } from "./core/config/config.module";
import { PrismaModule } from "./core/database/prisma.module";
import { UserModule } from "./modules/user/user.module";
import { AuthModule } from "./modules/auth/auth.module";
import { JwtModule } from "@nestjs/jwt";
import { MessageModule } from "./modules/message/message.module";
import { CloudinaryModule } from "./core/cloudinary/cloudinary.module";
import { SocketModule } from "./socket/socket.module";

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
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
