export interface SessionUser {
  id: string
  email: string
  name?: string
}

export interface AuthSession {
  user: SessionUser
  expires: string
}
