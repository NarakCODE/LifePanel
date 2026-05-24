export interface FilterProject {
  id: string;
  name: string;
}

export interface FilterMember {
  id: string;
  name: string;
}

export interface PerformanceFiltersResponse {
  projects: FilterProject[];
  members: FilterMember[];
}
