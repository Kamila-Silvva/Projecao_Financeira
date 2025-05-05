const express = require('express');
const router = express.Router();
const rendaController = require('../controllers/rendaController');
const { validarRenda } = require('../middlewares/validacao');

/**
 * @swagger
 * /rendas:
 *   post:
 *     summary: Cria uma nova renda
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Renda'
 *     responses:
 *       201:
 *         description: Renda criada com sucesso
 *       400:
 *         description: Dados inválidos
 */
router.post('/', 
  validarRenda,
  async (req, res, next) => {
    try {
      await rendaController.criarRenda(req, res);
    } catch (error) {
      console.error('Erro ao criar renda:', error);
      next(error);
    }
  }
);

/**
 * @swagger
 * /rendas:
 *   get:
 *     summary: Lista todas as rendas
 *     responses:
 *       200:
 *         description: Lista de rendas
 */
router.get('/', 
  async (req, res, next) => {
    try {
      await rendaController.listarRendas(req, res);
    } catch (error) {
      console.error('Erro ao listar rendas:', error);
      next(error);
    }
  }
);

/**
 * @swagger
 * /rendas/{id}:
 *   put:
 *     summary: Atualiza uma renda existente
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Renda'
 *     responses:
 *       200:
 *         description: Renda atualizada
 *       404:
 *         description: Renda não encontrada
 */
router.put('/:id',
  validarRenda,
  async (req, res, next) => {
    try {
      await rendaController.atualizarRenda(req, res);
    } catch (error) {
      console.error(`Erro ao atualizar renda ID ${req.params.id}:`, error);
      next(error);
    }
  }
);

/**
 * @swagger
 * /rendas/{id}:
 *   delete:
 *     summary: Remove uma renda
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Renda removida com sucesso
 *       404:
 *         description: Renda não encontrada
 */
router.delete('/:id', 
  async (req, res, next) => {
    try {
      await rendaController.removerRenda(req, res);
    } catch (error) {
      console.error(`Erro ao remover renda ID ${req.params.id}:`, error);
      next(error);
    }
  }
);

// Middleware de erro específico
router.use((err, req, res, next) => {
  res.status(500).json({ 
    success: false,
    message: 'Erro na rota de rendas',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

module.exports = router;