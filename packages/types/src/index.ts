export enum UserRole {
  LEARNER = "LEARNER",
  CREATOR = "CREATOR",
  STAFF = "STAFF",
  ADMIN = "ADMIN",
}

export interface User {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  profilePicture?: string;
  bio?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface Video {
  id: string;
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  creatorId: string;
  creator: Partial<User>;
  likesCount: number;
  commentsCount: number;
}
