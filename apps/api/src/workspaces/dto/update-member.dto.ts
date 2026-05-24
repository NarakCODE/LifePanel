import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { WorkspaceRole } from '../schemas/workspace.schema';

export class UpdateMemberRoleDto {
  @ApiProperty({
    description: 'The new role for the member',
    enum: WorkspaceRole,
  })
  @IsEnum(WorkspaceRole)
  @IsNotEmpty()
  role!: WorkspaceRole;
}
