// Health status types
export type HealthTone =
  | 'positive'
  | 'warning'
  | 'danger'
  | 'neutral'
  | 'muted';
export type HealthLabel =
  | 'On track'
  | 'Ahead'
  | 'At risk'
  | 'Behind'
  | 'Completed'
  | 'Cancelled';
export type ProjectStatus =
  | 'backlog'
  | 'planned'
  | 'active'
  | 'cancelled'
  | 'completed';
export type TaskType = 'bug' | 'improvement' | 'task';
export type TaskStatus = 'todo' | 'in-progress' | 'done';

// KPI Types
export interface KpiData {
  value: string;
  description: string;
  tone: HealthTone;
}

export interface Kpis {
  onTrackProjects: KpiData;
  overdueTasks: KpiData;
  completedInRange: KpiData;
  projectsAtRisk: KpiData;
}

// Throughput Chart
export interface ThroughputPoint {
  label: string;
  count: number;
  height: number;
}

export interface ThroughputData {
  total: number;
  series: ThroughputPoint[];
}

// Work Mix
export interface WorkMixDistribution {
  bug: number;
  improvement: number;
  task: number;
}

export interface WorkMixData {
  total: number;
  distribution: WorkMixDistribution;
  percentages: WorkMixDistribution;
}

// Bug Clearance
export interface BugClearanceData {
  open: number;
  completed: number;
  clearanceRate: number;
  series: ThroughputPoint[];
}

// Delivery Risk
export interface DeliveryRiskProject {
  id: string;
  name: string;
  status: ProjectStatus;
  taskCount: number;
  health: {
    label: HealthLabel;
    tone: HealthTone;
  };
  variance: number;
  daysToDue: number;
}

// Work Mix Trend
export interface WorkMixTrendPoint {
  label: string;
  total: number;
  bug: number;
  improvement: number;
  task: number;
  height: number;
}

export interface WorkMixTrendData {
  total: number;
  series: WorkMixTrendPoint[];
}

// Project Health
export interface ProjectHealthRow {
  id: string;
  name: string;
  status: ProjectStatus;
  progress: number;
  schedule: number;
  variance: number;
  daysToDue: number;
  taskCount: number;
  endDate: string; // ISO date
  health: {
    label: HealthLabel;
    tone: HealthTone;
  };
}

// Main Response
export interface PerformanceDashboardResponse {
  rangeLabel: string;
  filteredProjectCount: number;
  totalTasksInRange: number;
  kpis: Kpis;
  throughput: ThroughputData;
  workMix: WorkMixData;
  bugClearance: BugClearanceData;
  deliveryRisks: DeliveryRiskProject[];
  workMixTrend: WorkMixTrendData;
  projectHealth: ProjectHealthRow[];
}
