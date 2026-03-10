import { Request, Response, NextFunction } from 'express'

export function requireRole(...roles: ('ADMIN' | 'STUDENT')[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Acesso negado' })
      return
    }
    next()
  }
}
