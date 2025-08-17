export interface User {
  sub?: string; // Represents userId
  name?: string; // Represents userName
  email?: string; // Represents userEmail
  role?: string; // Represents userRole
  image?: string; // Represents userImage
  username?: string; // Represents username
  provider?: string; // Represents provider (e.g., 'google')
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}
