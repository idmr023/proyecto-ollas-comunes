export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
}

export interface JWTPayload {
  unique_name: string;
  nameid: string;
  email: string;
  upn: string;
  nbf: number;
  exp: number;
  iat: number;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  message?: string;
  user?: User;
}
