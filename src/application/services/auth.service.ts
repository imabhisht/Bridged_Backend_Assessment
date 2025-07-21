import { Injectable, Inject, UnauthorizedException, ConflictException } from '@nestjs/common';
import { UserRepository } from '../../domain/interfaces/user-repository.interface';
import { User } from '../../domain/entities/user.entity';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  constructor(@Inject('UserRepository') private readonly userRepository: UserRepository) {}

  async register(username: string, password: string): Promise<User> {
    const existing = await this.userRepository.findByUsername(username);
    if (existing) throw new ConflictException('Username already exists');
    const hashed = await bcrypt.hash(password, 10);
    const user = new User('', username, hashed);
    return this.userRepository.create(user);
  }

  async validateUser(username: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findByUsername(username);
    if (!user) return null;
    const valid = await bcrypt.compare(password, user.password);
    return valid ? user : null;
  }

  async login(username: string, password: string): Promise<{ access_token: string }> {
    const user = await this.validateUser(username, password);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const payload = { username: user.username, sub: user.id };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'default_jwt_secret', { expiresIn: '1d' });
    return { access_token: token };
  }
}
