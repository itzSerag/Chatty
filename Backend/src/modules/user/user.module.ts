import { Module } from "@nestjs/common";
import { UserService } from "./user.service";
import { UserController } from "./user.controller";
import { CloudinaryModule } from "../../core/cloudinary";
import { GuardsModule } from "../../core/guards/guards.module";

@Module({
    // GuardsModule provides + exports JwtAuthGuard (used on UserController).
    imports: [CloudinaryModule, GuardsModule],
    controllers: [UserController],
    providers: [UserService],
    exports: [UserService],
})
export class UserModule { }