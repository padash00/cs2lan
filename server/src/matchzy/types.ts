// MatchZy webhook payload shapes. See:
// https://github.com/shobhit-pathak/MatchZy/wiki

export type MatchZyEventType =
  | 'series_start'
  | 'series_result'
  | 'map_picked'
  | 'side_picked'
  | 'going_live'
  | 'round_end'
  | 'map_result'
  | 'knife_won'
  | 'player_say'
  | string;

export interface MatchZyBaseEvent {
  event: MatchZyEventType;
  matchid: string;
  [k: string]: unknown;
}

export interface RoundEndEvent extends MatchZyBaseEvent {
  event: 'round_end';
  map_number: number;
  round_number: number;
  team1: { score: number; side: 'CT' | 'T' };
  team2: { score: number; side: 'CT' | 'T' };
  winner: { side: 'CT' | 'T'; team: 'team1' | 'team2' };
  reason: number;
}

export interface MapResultEvent extends MatchZyBaseEvent {
  event: 'map_result';
  map_number: number;
  team1: { score: number };
  team2: { score: number };
  winner: { team: 'team1' | 'team2' };
}

export interface SeriesResultEvent extends MatchZyBaseEvent {
  event: 'series_result';
  team1_series_score: number;
  team2_series_score: number;
  winner: { team: 'team1' | 'team2' };
  time_until_restore: number;
}
