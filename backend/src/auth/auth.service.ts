import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const existingUser = await this.usersService.findByEmail(registerDto.email);

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const passwordHash = await bcrypt.hash(registerDto.password, 10);

    const user = await this.prisma.$transaction(async (tx) => {
      const createdUser = await tx.users.create({
        data: {
          name: registerDto.name,
          email: registerDto.email,
          password_hash: passwordHash,
          role: 'USER',
        },
      });

      await tx.user_credits.create({
        data: {
          user_id: createdUser.id,
          balance: 0,
        },
      });

      return createdUser;
    });

    return this.buildAuthResponse(user);
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password_hash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.buildAuthResponse(user);
  }

  async me(userId: string) {
    const user = await this.usersService.findById(BigInt(userId));

    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }

    return this.toSafeUser(user);
  }

  private buildAuthResponse(user: {
    id: bigint;
    name: string;
    email: string;
    role: string;
    created_at: Date | null;
    updated_at: Date | null;
  }): AuthResponseDto {
    const payload = {
      sub: user.id.toString(),
      email: user.email,
      role: user.role,
    };

    return {
      user: this.toSafeUser(user),
      accessToken: this.jwtService.sign(payload),
    };
  }

  private toSafeUser(user: {
    id: bigint;
    name: string;
    email: string;
    role: string;
    created_at: Date | null;
    updated_at: Date | null;
  }) {
    return {
      id: user.id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.created_at ? user.created_at.toISOString() : null,
      updatedAt: user.updated_at ? user.updated_at.toISOString() : null,
    };
  }
}
