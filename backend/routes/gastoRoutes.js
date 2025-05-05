const express = require('express');
const router = express.Router();
const gastoController = require('../controllers/gastoController');
const { validarGasto } = require('../middlewares/validacao');

// Rota para criar gasto com validação
router.post('/', 
  validarGasto, 
  async (req, res, next) => {
    try {
      await gastoController.criarGasto(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// Rota para listar gastos
router.get('/', 
  async (req, res, next) => {
    try {
      await gastoController.listarGastos(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// Rota para atualizar gasto com validação
router.put('/:id',
  validarGasto,
  async (req, res, next) => {
    try {
      await gastoController.atualizarGasto(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// Rota para remover gasto
router.delete('/:id', 
  async (req, res, next) => {
    try {
      await gastoController.removerGasto(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// Middleware para tratamento centralizado de erros
router.use((err, req, res, next) => {
  console.error('Erro na rota de gastos:', err);
  res.status(500).json({ 
    error: 'Erro interno no servidor',
    detalhes: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

module.exports = router;