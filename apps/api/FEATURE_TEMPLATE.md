# Example feature module scaffold
# Copy this structure when creating new features.
#
# src/
# └── <feature>/
#     ├── dto/
#     │   ├── create-<feature>.dto.ts
#     │   └── update-<feature>.dto.ts
#     ├── entities/
#     │   └── <feature>.entity.ts         (add when DB is connected)
#     ├── <feature>.repository.ts          (repo pattern)
#     ├── <feature>.service.ts
#     ├── <feature>.controller.ts
#     └── <feature>.module.ts
#
# DTO example (create-<feature>.dto.ts):
# ─────────────────────────────────────
# import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
# import { ApiProperty } from '@nestjs/swagger';
#
# export class Create<Feature>Dto {
#   @ApiProperty({ example: 'value' })
#   @IsString()
#   @IsNotEmpty()
#   @MaxLength(255)
#   name: string;
# }
#
# Service example:
# ────────────────
# @Injectable()
# export class <Feature>Service {
#   constructor(private readonly repo: <Feature>Repository) {}
#
#   async findAll(query: PaginationQueryDto) {
#     const [data, total] = await this.repo.findAndCount(query);
#     return new PaginatedResultDto(data, total, query.page, query.limit);
#   }
# }
#
# Module example:
# ───────────────
# @Module({
#   imports: [],
#   controllers: [<Feature>Controller],
#   providers: [<Feature>Service, <Feature>Repository],
#   exports: [<Feature>Service],   // only if other modules need it
# })
# export class <Feature>Module {}
