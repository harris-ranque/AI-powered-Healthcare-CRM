import { Module } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth/jwt-auth.guard';
import { AuthModule } from '../auth/auth.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [AuthModule],
  providers: [UsersService, JwtAuthGuard],
  controllers: [UsersController],
})
export class UsersModule {}
