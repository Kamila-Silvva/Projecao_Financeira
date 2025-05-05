const Meta = require('../models/Meta');

exports.criarMeta = async (req, res) => {
  try {
    const { descricao, valorTotal, tipo, prazoMeses } = req.body;
    
    if (!descricao || !valorTotal || !tipo || !prazoMeses) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }

    const valorParcela = valorTotal / prazoMeses;
    const novaMeta = await Meta.criar({
      descricao,
      valorTotal: parseFloat(valorTotal),
      tipo,
      prazoMeses: parseInt(prazoMeses),
      valorParcela
    });
    
    res.status(201).json(novaMeta);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.listarMetas = async (req, res) => {
  try {
    const metas = await Meta.listar();
    res.json(metas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.atualizarMeta = async (req, res) => {
  try {
    const { id } = req.params;
    const { descricao, valorTotal, tipo, prazoMeses } = req.body;
    
    const valorParcela = valorTotal / prazoMeses;
    const metaAtualizada = await Meta.atualizar(id, {
      descricao,
      valorTotal: parseFloat(valorTotal),
      tipo,
      prazoMeses: parseInt(prazoMeses),
      valorParcela
    });
    
    if (metaAtualizada) {
      res.json(metaAtualizada);
    } else {
      res.status(404).json({ error: 'Meta não encontrada' });
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.removerMeta = async (req, res) => {
  try {
    const { id } = req.params;
    const sucesso = await Meta.remover(id);
    
    if (sucesso) {
      res.status(204).send();
    } else {
      res.status(404).json({ error: 'Meta não encontrada' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};