
export interface User {
  id: string;
  email: string;
  fullName?: string;
  department?: string;
  isRegistered: boolean;
  assignedGroup?: number;
  isScratched: boolean;
}

export interface AppConfig {
  totalParticipants: number;
  numberOfGroups: number;
  participantsPerGroup: number;
}

export interface Stats {
  totalUsers: number;
  groupCounts: Record<number, number>;
  users: User[];
}
