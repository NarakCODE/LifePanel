import { ApiProperty } from '@nestjs/swagger';
import { DashboardSummaryResponseDto } from './dashboard-summary-response.dto';
import { DashboardActivityResponseDto } from './dashboard-activity-response.dto';
import { DashboardMetricsResponseDto } from './dashboard-metrics-response.dto';

export class DashboardOverviewResponseDto {
  @ApiProperty({ type: DashboardSummaryResponseDto })
  summary!: DashboardSummaryResponseDto;

  @ApiProperty({ type: DashboardActivityResponseDto })
  activity!: DashboardActivityResponseDto;

  @ApiProperty({ type: DashboardMetricsResponseDto })
  metrics!: DashboardMetricsResponseDto;

  constructor(partial: Partial<DashboardOverviewResponseDto>) {
    this.summary = new DashboardSummaryResponseDto(partial.summary ?? {});
    this.activity = new DashboardActivityResponseDto(partial.activity ?? {});
    this.metrics = new DashboardMetricsResponseDto(partial.metrics ?? {});
  }
}
