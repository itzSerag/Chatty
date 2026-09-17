import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import * as bcrypt from 'bcrypt';
import { PrismaService } from "../../core/database/prisma.service";
import { CloudinaryService } from "../../core/cloudinary/cloudinary.service";

@Injectable()
export class UserService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly cloudinaryService: CloudinaryService,
    ) { }

    private formatUser<T extends { id: string }>(user: T | null): (T & { _id: string; imgUrl?: string | null }) | null {
        if (!user) return null;
        return {
            ...user,
            _id: user.id,
            imgUrl: (user as any).profileImg ?? (user as any).imgUrl ?? null,
        };
    }

    // VALIDATE
    async validateUser(email: string, password: string) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) {
            throw new NotFoundException("Email or Password is not found");
        }

        const comparePasswords = await bcrypt.compare(password, user.password);
        if (!comparePasswords) {
            throw new NotFoundException("Email or Password is not found");
        }

        return this.formatUser(user);
    }

    // CRUD
    async create(createUserDto: CreateUserDto) {
        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
        const user = await this.prisma.user.create({
            data: {
                username: createUserDto.username,
                email: createUserDto.email,
                password: hashedPassword,
                phoneNumber: createUserDto.phoneNumber,
            },
        });
        return this.formatUser(user);
    }

    async findAll() {
        const users = await this.prisma.user.findMany({
            select: {
                id: true,
                username: true,
                email: true,
                phoneNumber: true,
                role: true,
                profileImg: true,
                bio: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        return users.map((u) => this.formatUser(u));
    }

    async findOneById(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
        });
        return this.formatUser(user);
    }

    async findOne(email: string) {
        const user = await this.prisma.user.findUnique({
            where: { email },
        });
        return this.formatUser(user);
    }

    async update(id: string, updateUserDto: UpdateUserDto) {
        const data: any = { ...updateUserDto };
        if (data.password) {
            data.password = await bcrypt.hash(data.password, 10);
        }
        const user = await this.prisma.user.update({
            where: { id },
            data,
        });
        return this.formatUser(user);
    }

    async remove(id: string) {
        const user = await this.prisma.user.delete({
            where: { id },
        });
        return this.formatUser(user);
    }

    async findAllExcept(id: string) {
        const users = await this.prisma.user.findMany({
            where: { id: { not: id } },
            select: {
                id: true,
                username: true,
                email: true,
                phoneNumber: true,
                role: true,
                profileImg: true,
                bio: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        return users.map((u) => this.formatUser(u));
    }

    // Search users by username or email for starting new chats
    async searchUsers(query: string, currentUserId: string) {
        if (!query || query.trim().length === 0) {
            return [];
        }
        const cleanQuery = query.trim();
        const users = await this.prisma.user.findMany({
            where: {
                AND: [
                    { id: { not: currentUserId } },
                    {
                        OR: [
                            { username: { contains: cleanQuery, mode: 'insensitive' } },
                            { email: { startsWith: cleanQuery, mode: 'insensitive' } },
                        ],
                    },
                ],
            },
            select: {
                id: true,
                username: true,
                email: true,
                profileImg: true,
                bio: true,
            },
            take: 20,
        });
        return users.map((u) => this.formatUser(u));
    }

    // UPDATE PROFILE IMAGE
    async updateProfileImg(user: { id: string }, base64Img: string) {
        const secure_url = await this.cloudinaryService.uploadProfileImg(String(user.id), base64Img);
        const updatedUser = await this.prisma.user.update({
            where: { id: user.id },
            data: { profileImg: secure_url },
        });
        return this.formatUser(updatedUser);
    }
}
