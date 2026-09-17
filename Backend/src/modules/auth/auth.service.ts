import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import ms from 'ms';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { ITokenPayload } from './interface/token-payload.interface';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { Role } from '../user/enums/role.enum';

@Injectable()
export class AuthService {
    constructor(
        private readonly configService: ConfigService,
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
    ) { }

    async signup(createUserDto: CreateUserDto, response: Response) {
        const user = await this.userService.create(createUserDto);
        this.setAuthCookie(user as unknown as User, response);
        if (user) {
            delete (user as any).password;
        }
        return user;
    }

    login(user: User, response: Response): void {
        this.setAuthCookie(user, response);
    }

    private setAuthCookie(user: User, response: Response): void {
        const tokenPayload: ITokenPayload = {
            _id: String((user as any)._id || user.id),
            role: (user.role as Role) || Role.USER,
        };

        const { token, expires } = this.createToken(tokenPayload);

        response.cookie('Authentication', token, {
            httpOnly: true,
            secure: this.configService.get('NODE_ENV') === 'production',
            sameSite: 'strict',
            expires,
        });
    }

    private createToken(payload: ITokenPayload): { token: string; expires: Date } {
        const jwtExpire = this.configService.get('JWT_EXPIRE') || '7d';
        const expiresInMs = ms(jwtExpire);
        const expires = new Date(Date.now() + expiresInMs);

        const token = this.jwtService.sign(payload, {
            expiresIn: jwtExpire,
        });

        return { token, expires };
    }
}