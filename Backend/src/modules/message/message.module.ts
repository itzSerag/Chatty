import { Module } from '@nestjs/common';
import { MessageService } from './message.service';
import { MessageController } from './message.controller';
import { UserModule } from 'src/modules/user/user.module';
import { GuardsModule } from 'src/core/guards/guards.module';
import { JwtModule } from '@nestjs/jwt';
import { CloudinaryModule } from 'src/core/cloudinary/cloudinary.module';
import { SocketModule } from 'src/socket/socket.module';

@Module({
  imports: [UserModule, GuardsModule, CloudinaryModule, JwtModule, SocketModule],
  controllers: [MessageController],
  providers: [MessageService],
  exports: [MessageService],
})
export class MessageModule { }
