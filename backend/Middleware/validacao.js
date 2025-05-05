const { body, param, query, validationResult } = require('express-validator');
const { isValid } = require('date-fns');

// Validações compartilhadas
const validarId = [
  param('id')
    .isInt({ gt: 0 })
    .withMessage('ID deve ser um número inteiro positivo')
    .toInt()
];

// Validação para Rendas
const validarRenda = [
  body('descricao')
    .trim()
    .notEmpty()
    .withMessage('Descrição é obrigatória')
    .isLength({ max: 100 })
    .withMessage('Descrição deve ter no máximo 100 caracteres'),
    
  body('valor')
    .isFloat({ gt: 0 })
    .withMessage('Valor deve ser um número positivo')
    .toFloat(),
    
  body('frequencia')
    .isIn(['Mensal', 'Trimestral', 'Semestral', 'Anual', 'Único', 'Unico'])
    .withMessage('Frequência inválida. Use: Mensal, Trimestral, Semestral, Anual ou Único'),
    
  body('mesRecebimento')
    .optional()
    .custom((value, { req }) => {
      if (['Trimestral', 'Semestral', 'Anual', 'Único', 'Unico'].includes(req.body.frequencia)) {
        if (!value) throw new Error('Mês de recebimento é obrigatório para esta frequência');
        const mesesValidos = [
          'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
          'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Deezembro'
        ];
        if (!mesesValidos.includes(value)) {
          throw new Error('Mês inválido. Use o nome completo do mês');
        }
      }
      return true;
    })
];

// Validação para Gastos
const validarGasto = [
  body('descricao')
    .trim()
    .notEmpty()
    .withMessage('Descrição é obrigatória')
    .isLength({ max: 100 })
    .withMessage('Descrição deve ter no máximo 100 caracteres'),
    
  body('valor')
    .isFloat({ gt: 0 })
    .withMessage('Valor deve ser um número positivo')
    .toFloat(),
    
  body('frequencia')
    .isIn(['Mensal', 'Trimestral', 'Semestral', 'Anual', 'Único', 'Unico'])
    .withMessage('Frequência inválida. Use: Mensal, Trimestral, Semestral, Anual ou Único'),
    
  body('mesPagamento')
    .optional()
    .custom((value, { req }) => {
      if (['Trimestral', 'Semestral', 'Anual', 'Único', 'Unico'].includes(req.body.frequencia)) {
        if (!value) throw new Error('Mês de pagamento é obrigatório para esta frequência');
        const mesesValidos = [
          'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
          'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Deezembro'
        ];
        if (!mesesValidos.includes(value)) {
          throw new Error('Mês inválido. Use o nome completo do mês');
        }
      }
      return true;
    })
];

// Validação para Metas
const validarMeta = [
  body('descricao')
    .trim()
    .notEmpty()
    .withMessage('Descrição é obrigatória')
    .isLength({ max: 100 })
    .withMessage('Descrição deve ter no máximo 100 caracteres'),
    
  body('valorTotal')
    .isFloat({ gt: 0 })
    .withMessage('Valor total deve ser um número positivo')
    .toFloat(),
    
  body('tipo')
    .isIn(['Viagem', 'Compras', 'Investimento', 'Educação', 'Outros'])
    .withMessage('Tipo inválido'),
    
  body('prazoMeses')
    .isInt({ min: 1, max: 120 })
    .withMessage('Prazo deve ser entre 1 e 120 meses')
    .toInt(),
    
  body('valorParcela')
    .optional()
    .isFloat({ gt: 0 })
    .withMessage('Valor da parcela deve ser positivo')
    .toFloat()
];

// Validação para Projeção
const validarProjecao = [
  query('meses')
    .optional()
    .isInt({ min: 1, max: 24 })
    .withMessage('O período deve ser entre 1 e 24 meses')
    .toInt(),
    
  query('dataInicio')
    .optional()
    .custom(value => {
      if (!isValid(new Date(value))) {
        throw new Error('Data inválida. Use o formato YYYY-MM-DD');
      }
      return true;
    })
];

// Middleware de tratamento de erros
const validar = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      errors: errors.array().map(err => ({
        param: err.param,
        message: err.msg,
        location: err.location
      }))
    });
  }
  next();
};

// Middleware de cache
const cacheMiddleware = (seconds) => {
  return (req, res, next) => {
    res.set('Cache-Control', `public, max-age=${seconds}`);
    next();
  };
};

// Middleware de erro global
const errorHandler = (err, req, res, next) => {
  console.error('Erro:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Erro interno no servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};

module.exports = {
  validarId,
  validarRenda,
  validarGasto,
  validarMeta,
  validarProjecao,
  validar,
  cacheMiddleware,
  errorHandler
};