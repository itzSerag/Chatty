import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { CloudinaryService } from '../../core/cloudinary/cloudinary.service';
import { DRIZZLE, DrizzleDB } from '../../core/database/drizzle.provider';
import { users } from '../../core/database/schema';
import { eq, ne, and, or, ilike } from 'drizzle-orm';

@Injectable()
export class UserService {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: DrizzleDB,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  private formatUser<T extends { id: string }>(
    user: T | null | undefined,
  ): (T & { _id: string; imgUrl?: string | null }) | null {
    if (!user) return null;
    return {
      ...user,
      _id: user.id,
      imgUrl: (user as any).profileImg ?? (user as any).imgUrl ?? null,
    };
  }

  // VALIDATE
  async validateUser(email: string, password: string) {
    const user = await this.db.query.users.findFirst({
      where: eq(users.email, email),
    });
    if (!user) {
      throw new NotFoundException('Email or Password is not found');
    }

    const comparePasswords = await bcrypt.compare(password, user.password);
    if (!comparePasswords) {
      throw new NotFoundException('Email or Password is not found');
    }

    return this.formatUser(user);
  }

  // CRUD
  async create(createUserDto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const [user] = await this.db
      .insert(users)
      .values({
        username: createUserDto.username,
        email: createUserDto.email,
        password: hashedPassword,
        phoneNumber: createUserDto.phoneNumber,
      })
      .returning();

    return this.formatUser(user);
  }

  async findAll() {
    const allUsers = await this.db.query.users.findMany({
      columns: {
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
    return allUsers.map((u) => this.formatUser(u));
  }

  async findOneById(id: string) {
    const user = await this.db.query.users.findFirst({
      where: eq(users.id, id),
    });
    return this.formatUser(user);
  }

  async findOne(email: string) {
    const user = await this.db.query.users.findFirst({
      where: eq(users.email, email),
    });
    return this.formatUser(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const data: any = { ...updateUserDto };
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    const [user] = await this.db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();

    return this.formatUser(user);
  }

  async remove(id: string) {
    const [user] = await this.db
      .delete(users)
      .where(eq(users.id, id))
      .returning();

    return this.formatUser(user);
  }

  async findAllExcept(id: string) {
    const allUsers = await this.db.query.users.findMany({
      where: ne(users.id, id),
      columns: {
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
    return allUsers.map((u) => this.formatUser(u));
  }

  // Search users by username or email for starting new chats
  async searchUsers(query: string, currentUserId: string) {
    if (!query || query.trim().length === 0) {
      return [];
    }
    const cleanQuery = query.trim();
    const foundUsers = await this.db.query.users.findMany({
      where: and(
        ne(users.id, currentUserId),
        or(
          ilike(users.username, `%${cleanQuery}%`),
          ilike(users.email, `${cleanQuery}%`),
        ),
      ),
      columns: {
        id: true,
        username: true,
        email: true,
        profileImg: true,
        bio: true,
      },
      limit: 20,
    });
    return foundUsers.map((u) => this.formatUser(u));
  }

  // UPDATE PROFILE IMAGE
  async updateProfileImg(user: { id: string }, base64Img: string) {
    const secure_url = await this.cloudinaryService.uploadProfileImg(String(user.id), base64Img);
    const [updatedUser] = await this.db
      .update(users)
      .set({ profileImg: secure_url })
      .where(eq(users.id, user.id))
      .returning();

    return this.formatUser(updatedUser);
  }
}
