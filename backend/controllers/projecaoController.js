const Projecao = require('../models/Projecao');

exports.calcularProjecao = async (req, res) => {
  try {
    const resultado = await Projecao.calcular();
    
    res.json({
      success: true,
      data: resultado.projecao,
      alertas: resultado.alertas,
      resumo: {
        totalRendas: resultado.projecao.reduce((sum, mes) => sum + mes.recebimentos, 0),
        totalGastos: resultado.projecao.reduce((sum, mes) => sum + mes.gastos, 0),
        saldoFinal: resultado.projecao[resultado.projecao.length - 1]?.saldo || 0
      },
      message: 'Projeção calculada com sucesso'
    });
    
  } catch (err) {
    console.error('Erro ao calcular projeção:', err);
    
    res.status(500).json({ 
      error: 'Erro ao calcular projeção financeira',
      detalhes: process.env.NODE_ENV === 'development' ? {
        mensagem: err.message,
        stack: err.stack
      } : null,
      sugestao: 'Verifique se existem rendas e despesas cadastradas'
    });
  }
};