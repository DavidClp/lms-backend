import { Router } from 'express'
import { casamentoConfirmacaoController } from './casamento-confirmacao.controller'

const router = Router()

router.post('/', casamentoConfirmacaoController.create)
router.get('/', casamentoConfirmacaoController.list)

export default router
