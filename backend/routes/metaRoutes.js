const express = require('express');
const router = express.Router();
const metaController = require('../controllers/metaController');
const { validarMeta } = require('../middlewares/validacao');

// Rota para criar meta com validação
router.post('/', 
  validarMeta,
  async (req, res, next) => {
    try {
      await metaController.criarMeta(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// Rota para listar metas
router.get('/', 
  async (req, res, next) => {
    try {
      await metaController.listarMetas(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// Rota para atualizar meta com validação
router.put('/:id',
  validarMeta,
  async (req, res, next) => {
    try {
      await metaController.atualizarMeta(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// Rota para remover meta
router.delete('/:id', 
  async (req, res, next) => {
    try {
      await metaController.removerMeta(req, res);
    } catch (error) {
      next(error);
    }
  }
);

// Middleware para tratamento centralizado de erros
router.use((err, req, res, next) => {
  console.error('Erro na rota de metas:', err);
  res.status(500).json({ 
    error: 'Erro interno no servidor',
    detalhes: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

module.exports = router;