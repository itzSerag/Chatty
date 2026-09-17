import { Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { JwtAuthGuard } from "../../modules/auth/guards/jwt.guard";

@Module({
  imports: [PassportModule.register({ defaultStrategy: "jwt" })],
  providers: [JwtAuthGuard],
  exports: [JwtAuthGuard, PassportModule],
})
export class GuardsModule {}