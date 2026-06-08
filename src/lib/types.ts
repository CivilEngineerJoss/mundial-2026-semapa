export type PredictionStatus = "BORRADOR" | "CONFIRMADO" | "BLOQUEADO_POR_FECHA";

export type UserProfile = {
  id: string;
  full_name: string;
  email: string;
  role: "user" | "admin";
  created_at: string;
  max_predictions?: number;
};

export type Match = {
  id: number;
  match_number: number;
  phase: string;
  group_name: string | null;
  team_a: string;
  team_b: string;
  match_date: string | null;
  venue: string | null;
  status: "scheduled" | "played";
  sort_order: number;
};

export type PredictionDetail = {
  id?: string;
  prediction_id?: string;
  match_id: number;
  predicted_goals_a: number | null;
  predicted_goals_b: number | null;
  points?: number;
};

export type Prediction = {
  id: string;
  user_id: string;
  status: PredictionStatus;
  confirmed_at: string | null;
  confirmation_code: string | null;
  ip_address: string | null;
  user_agent: string | null;
  validation_hash: string | null;
  payment_status?: "PENDIENTE" | "APROBADO";
  payment_approved_at?: string | null;
  payment_approved_by?: string | null;
  prediction_slot?: number;
  created_at?: string;
};

export type Result = {
  match_id: number;
  goals_a: number;
  goals_b: number;
  registered_at: string;
};

export type RankingRow = {
  prediction_id?: string;
  user_id: string;
  full_name: string;
  prediction_slot?: number;
  total_points: number;
  exact_scores: number;
  winner_hits: number;
  matches_hit: number;
  position: number;
  updated_at: string;
};

export type Setting = {
  key: string;
  value: string;
};
