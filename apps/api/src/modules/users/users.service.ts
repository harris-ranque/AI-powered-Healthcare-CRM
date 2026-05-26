import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export type UserProfile = Pick<
  User,
  'id' | 'email' | 'name' | 'role' | 'createdAt' | 'updatedAt'
>;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<User[]> {
    return await this.prisma.client.user.findMany();
  }

  async findById(id: string): Promise<UserProfile> {
    const user = await this.prisma.client.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
