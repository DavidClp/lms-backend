import { NextFunction, Request, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../../config/prisma'

const createSchema = z.object({
  nome: z.string().trim().min(1, 'Nome é obrigatório'),
  quantidade_pessoas: z.coerce.number().int().min(1, 'Informe ao menos 1 pessoa'),
  observacao: z.string().trim().optional(),
})

export const casamentoConfirmacaoController = {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = createSchema.parse(req.body)
      const confirmacao = await prisma.casamento_confirmacao.create({
        data: {
          nome: data.nome,
          quantidade_pessoas: data.quantidade_pessoas,
          observacao: data.observacao ?? null,
        },
      })
      res.status(201).json(confirmacao)
    } catch (e) {
      next(e)
    }
  },

  async list(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const confirmacoes = await prisma.casamento_confirmacao.findMany({
        orderBy: { createdAt: 'desc' },
      })
      res.json(confirmacoes)
    } catch (e) {
      next(e)
    }
  },
}
