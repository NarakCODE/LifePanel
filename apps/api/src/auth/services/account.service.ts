import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../../users/users.service';
import { AuditService } from '../../common/audit/audit.service';
import { EmailVerificationService } from './email-verification.service';
import { UpdateEmailDto } from '../dto/update-email.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { DeleteAccountDto } from '../dto/delete-account.dto';
import { UserStatus } from '../../users/schemas/user.schema';

const BCRYPT_ROUNDS = 10;

@Injectable()
export class AccountService {
  constructor(
    private readonly usersService: UsersService,
    private readonly auditService: AuditService,
    private readonly emailVerificationService: EmailVerificationService,
  ) {}

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.usersService.findById(userId);

    const matches = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash,
    );
    if (!matches) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException(
        'New password must differ from current password',
      );
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
    await this.usersService.updatePassword(userId, passwordHash);
    await this.usersService.incrementTokenVersion(userId);

    this.auditService.log(userId, 'account.change_password', {
      reason: 'user-requested',
    });
  }

  async updateEmail(userId: string, dto: UpdateEmailDto): Promise<void> {
    const user = await this.usersService.findById(userId);

    if (user.email.toLowerCase() === dto.newEmail.toLowerCase()) {
      throw new BadRequestException('Email is unchanged');
    }

    const existing = await this.usersService.findByEmail(dto.newEmail);
    if (existing && existing._id.toString() !== userId) {
      throw new ConflictException('Email is already taken');
    }

    const matches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!matches) {
      throw new UnauthorizedException('Invalid password');
    }

    await this.usersService.updateEmail(userId, dto.newEmail);
    await this.usersService.incrementTokenVersion(userId);

    const updated = await this.usersService.findById(userId);
    await this.emailVerificationService.sendVerificationEmail(updated);

    this.auditService.log(userId, 'account.update_email', {
      newEmail: dto.newEmail.toLowerCase(),
    });
  }

  async deleteAccount(userId: string, dto: DeleteAccountDto): Promise<void> {
    const user = await this.usersService.findById(userId);

    if (user.status === UserStatus.DELETED) {
      return;
    }

    const matches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!matches) {
      throw new UnauthorizedException('Invalid password');
    }

    await this.usersService.markDeleted(userId);
    await this.usersService.incrementTokenVersion(userId);

    this.auditService.log(userId, 'account.delete', {
      reason: dto.reason ?? 'self-service',
    });
  }
}
