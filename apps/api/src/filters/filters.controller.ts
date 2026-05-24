import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FiltersService } from './filters.service';
import { PerformanceFiltersResponse } from './types/filters.types';

@ApiTags('Filters')
@Controller('filters')
export class FiltersController {
  constructor(private readonly filtersService: FiltersService) {}

  @Get('performance')
  @ApiOperation({
    summary: 'Get filter options for performance dashboard',
    description: 'Returns available projects and members for filtering',
  })
  @ApiResponse({
    status: 200,
    description: 'Filter options retrieved successfully',
  })
  async getPerformanceFilters(): Promise<PerformanceFiltersResponse> {
    return this.filtersService.getPerformanceFilters();
  }
}
