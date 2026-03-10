import { Request, Response, NextFunction } from 'express'

export function requireRole(...roles: ('ADMIN' | 'STUDENT')[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    console.log("req.user", req.user)
    if (!req.user || !roles.includes(req.user.role)) {
      console.log("AAA", (req.user.role))
      console.log("roles", roles)
      res.status(403).json({ error: 'Acesso negado' })
      return
    }
    next()
  }
}
