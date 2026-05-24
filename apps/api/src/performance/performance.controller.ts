import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PerformanceService } from './performance.service';
import { PerformanceQueryDto } from './dto/performance-query.dto';
import { PerformanceDashboardResponse } from './types/performance.types';

@ApiTags('Performance')
@Controller('performance')
export class PerformanceController {
  constructor(private readonly performanceService: PerformanceService) {}

  @Get()
  @ApiOperation({
    summary: 'Get performance dashboard data',
    description:
      'Returns KPIs, charts, and project health data for the performance dashboard',
  })
  @ApiResponse({
    status: 200,
    description: 'Performance dashboard data retrieved successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid query parameters',
  })
  async getDashboard(
    @Query() query: PerformanceQueryDto,
  ): Promise<PerformanceDashboardResponse> {
    return this.performanceService.getDashboardData(query);
  }
}
