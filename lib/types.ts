export interface PlayerWithAttendance {
  id: string;
  name: string;
  handicap: number;
  overrideTier: string | null;
  attendanceCount: number;
  isCheckedIn: boolean;
}

export interface TeamPlayer {
  id: string;
  name: string;
  handicap: number;
  tier: string;
}

export interface Team {
  id: number;
  players: TeamPlayer[];
  averageHandicap: number;
}

export interface TeamsData {
  teams: Team[];
  generatedAt: string;
}
