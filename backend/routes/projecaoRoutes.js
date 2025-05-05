const express = require('express');
const router = express.Router();
const projecaoController = require('../controllers/projecaoController');
const { cacheMiddleware } = require('../middlewares/cache'); // Middleware de cache opcional

/**
 * @swagger
 * /projecao:
 *   get:
 *     summary: Calcula a projeção financeira
 *     description: Retorna a projeção de receitas, despesas e saldos para os próximos meses
 *     responses:
 *       200:
 *         description: Projeção calculada com sucesso
 *       500:
 *         description: Erro ao calcular projeção
 */
router.get('/', 
  cacheMiddleware(3600), // Cache de 1 hora (opcional)
  async (req, res, next) => {
    try {
      await projecaoController.calcularProjecao(req, res);
    } catch (error) {
      console.error('Erro na rota de projeção:', error);
      next(error);
    }
  }
);

// Middleware de erro específico para esta rota
router.use((err, req, res, next) => {
  res.status(500).json({ 
    success: false,
    message: 'Erro ao calcular projeção financeira',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

module.exports = router;