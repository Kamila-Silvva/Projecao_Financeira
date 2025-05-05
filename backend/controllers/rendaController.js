const Renda = require('../models/Renda');

exports.criarRenda = async (req, res) => {
  try {
    const { descricao, valor, frequencia, mesRecebimento } = req.body;
    
    // Validação reforçada
    if (!descricao || !valor || !frequencia) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }

    if (isNaN(parseFloat(valor))) {
      return res.status(400).json({ error: 'Valor inválido' });
    }

    const frequenciasValidas = ['Mensal', 'Trimestral', 'Semestral', 'Anual', 'Único'];
    if (!frequenciasValidas.includes(frequencia)) {
      return res.status(400).json({ error: 'Frequência inválida' });
    }

    const novaRenda = await Renda.criar({
      descricao,
      valor: parseFloat(valor),
      frequencia,
      mesRecebimento: frequencia === 'Mensal' ? null : mesRecebimento
    });
    
    res.status(201).json(novaRenda);
  } catch (err) {
    console.error('Erro detalhado:', err);
    res.status(400).json({ 
      error: 'Erro ao criar renda',
      detalhes: process.env.NODE_ENV === 'development' ? err.message : null
    });
  }
};

exports.listarRendas = async (req, res) => {
  try {
    const rendas = await Renda.listar();
    res.json(rendas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.atualizarRenda = async (req, res) => {
  try {
    const { id } = req.params;
    const { descricao, valor, frequencia, mesRecebimento } = req.body;
    
    const rendaAtualizada = await Renda.atualizar(id, {
      descricao,
      valor: parseFloat(valor),
      frequencia,
      mesRecebimento: frequencia === 'Mensal' ? null : mesRecebimento
    });
    
    if (rendaAtualizada) {
      res.json(rendaAtualizada);
    } else {
      res.status(404).json({ error: 'Renda não encontrada' });
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.removerRenda = async (req, res) => {
  try {
    const { id } = req.params;
    const sucesso = await Renda.remover(id);
    
    if (sucesso) {
      res.status(204).send();
    } else {
      res.status(404).json({ error: 'Renda não encontrada' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};