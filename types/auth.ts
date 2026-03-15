// ─── Supabase Auth Types ─────────────────────────────────

export interface SignUpInput {
  email: string;
  password: string;
  nickname: string;
  phone?: string;
}

export interface SignInInput {
  email: string;
  password: string;
}
