import {
  Controller,
  Get,
  Param,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
} from '@nestjs/swagger';
import { Types } from 'mongoose';
import { UsersService } from './users.service';
import { UserPublicDto } from './dto/user-public.dto';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';

@ApiTags('users')
@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get user details by ID',
    description:
      'Retrieve public profile information for a user by their ID. ' +
      'Requires authentication. Sensitive fields (passwordHash, refreshTokenHash) are excluded.',
  })
  @ApiOkResponse({
    type: UserPublicDto,
    description: 'User public profile information',
  })
  async getUserById(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
  ): Promise<UserPublicDto> {
    const user = await this.usersService.findById(id);
    return new UserPublicDto({
      id: user._id.toString(),
      email: user.email,
      displayName: user.displayName,
      roles: user.roles,
      isEmailVerified: user.isEmailVerified,
      status: user.status,
      avatarUrl: user.avatarUrl,
      profileMetadata: user.profileMetadata,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }
}
