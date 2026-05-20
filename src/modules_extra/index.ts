import { Router } from 'express'
import casamentoConfirmacaoRoutes from './casamento-confirmacao/casamento-confirmacao.routes'

const router = Router()

router.use('/casamento-confirmacao', casamentoConfirmacaoRoutes)

export default router
