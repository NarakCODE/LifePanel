import { IsEmail, IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { WorkspaceRole } from '../schemas/workspace.schema';

export class InviteMemberDto {
  @ApiProperty({
    example: 'partner@example.com',
    description: 'Email of the user to invite',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ enum: WorkspaceRole, default: WorkspaceRole.MEMBER })
  @IsEnum(WorkspaceRole)
  @IsNotEmpty()
  role!: WorkspaceRole;
}
