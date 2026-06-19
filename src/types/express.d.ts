declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        role: 'ADMIN' | 'STUDENT'
        profileMode: 'ADULT' | 'KIDS'
      }
    }
  }
}

export {}
