export interface TriviaScore {
  category: string;
  high_score: number;
  played_at: string;
}

export interface PassengerExperience {
  linked_driver_id?: string;
  trivia_scores: TriviaScore[];
  saved_places: string[];
}

export interface TipHandles {
  cashapp?: string;
  venmo?: string;
  paypal?: string;
}

export interface Account {
  id: string;
  type: "Driver" | "Passenger";
  username: string;
  email?: string;
  display_name: string;
  city: string;
  profile_pic_url?: string;
  bio?: string; // max 40 chars
  custom_url: string;
  tips: TipHandles;
  qr_code_url: string;
  passenger_experience?: PassengerExperience | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}
