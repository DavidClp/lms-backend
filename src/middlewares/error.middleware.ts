import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'

export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number = 400,
  ) {
    console.log("ERROR", message)
    super(message)
    this.name = 'AppError'
  }
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const isDev = process.env.NODE_ENV !== 'production'

  // AppError: erros de negócio lançados intencionalmente
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message })
    return
  }

  // ZodError: falha de validação de schema
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Dados inválidos',
      details: err.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
    })
    return
  }

  // Prisma: violação de unique constraint (ex: email duplicado)
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const fields = (err.meta?.target as string[])?.join(', ') ?? 'campo'
      res.status(409).json({ error: `Valor duplicado no campo: ${fields}` })
      return
    }
    if (err.code === 'P2025') {
      res.status(404).json({ error: 'Registro não encontrado' })
      return
    }
    res.status(400).json({ error: `Erro de banco de dados [${err.code}]` })
    return
  }

  // Prisma: erro de validação interna
  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({ error: 'Dados inválidos para o banco de dados' })
    return
  }

  // Erro genérico
  const message = err instanceof Error ? err.message : 'Erro interno do servidor'
  console.error(`[${req.method}] ${req.path} →`, err)

  res.status(500).json({
    error: isDev ? message : 'Erro interno do servidor',
    ...(isDev && err instanceof Error ? { stack: err.stack } : {}),
  })
}
