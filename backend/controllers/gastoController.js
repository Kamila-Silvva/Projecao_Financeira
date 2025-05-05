const Gasto = require('../models/Gasto');

exports.criarGasto = async (req, res) => {
  try {
    const { descricao, valor, frequencia, mesPagamento } = req.body;
    
    if (!descricao || !valor || !frequencia) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }

    const novoGasto = await Gasto.criar({
      descricao,
      valor: parseFloat(valor),
      frequencia,
      mesPagamento: frequencia === 'Mensal' ? null : mesPagamento
    });
    
    res.status(201).json(novoGasto);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.listarGastos = async (req, res) => {
  try {
    const gastos = await Gasto.listar();
    res.json(gastos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.atualizarGasto = async (req, res) => {
  try {
    const { id } = req.params;
    const { descricao, valor, frequencia, mesPagamento } = req.body;
    
    const gastoAtualizado = await Gasto.atualizar(id, {
      descricao,
      valor: parseFloat(valor),
      frequencia,
      mesPagamento: frequencia === 'Mensal' ? null : mesPagamento
    });
    
    if (gastoAtualizado) {
      res.json(gastoAtualizado);
    } else {
      res.status(404).json({ error: 'Gasto não encontrado' });
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.removerGasto = async (req, res) => {
  try {
    const { id } = req.params;
    const sucesso = await Gasto.remover(id);
    
    if (sucesso) {
      res.status(204).send();
    } else {
      res.status(404).json({ error: 'Gasto não encontrado' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};