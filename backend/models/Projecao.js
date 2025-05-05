const { db } = require('../config/database');

class Projecao {
  // Métodos auxiliares para promisificar
  static async query(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static async calcular() {
    try {
      // Obter todos os dados em paralelo para melhor performance
      const [rendas, despesas, metas] = await Promise.all([
        this.getRendas(),
        this.getDespesas(),
        this.getMetas()
      ]);

      const meses = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
      ];

      const projecao = meses.map((mes, mesIndex) => {
        const recebimentosDetalhados = this.filtrarRecebimentos(rendas, mes, mesIndex);
        const recebimentos = this.calcularTotal(recebimentosDetalhados);

        const gastosDetalhados = this.filtrarDespesas(despesas, mes, mesIndex);
        const parcelasMetas = this.calcularParcelasMetas(metas, mesIndex);
        const todosGastos = [...gastosDetalhados, ...parcelasMetas];
        const gastos = this.calcularTotal(todosGastos);

        return {
          mes,
          recebimentos,
          gastos,
          saldo: recebimentos - gastos,
          recebimentosDetalhados: this.formatarDetalhes(recebimentosDetalhados, 'recebimento'),
          gastosDetalhados: this.formatarDetalhes(todosGastos, 'gasto')
        };
      });

      // Calcular saldo acumulado
      let saldoAcumulado = 0;
      projecao.forEach(mes => {
        saldoAcumulado += mes.saldo;
        mes.saldoAcumulado = saldoAcumulado;
      });

      const alertas = this.verificarAlertas(projecao);
      return { projecao, alertas };

    } catch (err) {
      console.error('Erro ao calcular projeção:', err);
      throw new Error('Falha ao calcular projeção financeira');
    }
  }

  // Métodos de acesso ao banco
  static async getRendas() {
    try {
      return await this.query('SELECT * FROM rendas');
    } catch (err) {
      console.error('Erro ao buscar rendas:', err);
      throw new Error('Falha ao buscar rendas para projeção');
    }
  }

  static async getDespesas() {
    try {
      return await this.query('SELECT * FROM despesas');
    } catch (err) {
      console.error('Erro ao buscar despesas:', err);
      throw new Error('Falha ao buscar despesas para projeção');
    }
  }

  static async getMetas() {
    try {
      return await this.query('SELECT * FROM metas');
    } catch (err) {
      console.error('Erro ao buscar metas:', err);
      throw new Error('Falha ao buscar metas para projeção');
    }
  }

  // Métodos auxiliares de cálculo
  static filtrarRecebimentos(rendas, mes, mesIndex) {
    return rendas.filter(renda => {
      const freq = renda.frequencia?.toLowerCase();
      const mesRef = renda.mes_recebimento?.toLowerCase();

      switch (freq) {
        case 'mensal': return true;
        case 'trimestral':
          return mesRef 
            ? (mesIndex - this.getMesIndex(mesRef)) % 3 === 0
            : mesIndex % 3 === 0;
        case 'semestral':
          return mesRef
            ? (mesIndex - this.getMesIndex(mesRef)) % 6 === 0
            : mesIndex % 6 === 0;
        case 'anual': 
        case 'único':
          return mes.toLowerCase() === mesRef;
        default: return false;
      }
    });
  }

  static filtrarDespesas(despesas, mes, mesIndex) {
    return despesas.filter(despesa => {
      const freq = despesa.frequencia?.toLowerCase();
      const mesRef = despesa.mes_pagamento?.toLowerCase();

      if (freq === 'mensal') return true;
      if (freq === 'trimestral') {
        return mesRef
          ? (mesIndex - this.getMesIndex(mesRef)) % 3 === 0
          : mesIndex % 3 === 0;
      }
      if (freq === 'semestral') {
        return mesRef
          ? (mesIndex - this.getMesIndex(mesRef)) % 6 === 0
          : mesIndex % 6 === 0;
      }
      if (freq === 'anual' || freq === 'único') {
        return mes.toLowerCase() === mesRef;
      }
      return false;
    });
  }

  static calcularParcelasMetas(metas, mesIndex) {
    return metas
      .filter(meta => mesIndex < meta.prazo_meses)
      .map(meta => ({
        ...meta,
        descricao: `${meta.descricao} (${meta.tipo})`,
        valor: meta.valor_parcela,
        frequencia: "Mensal",
        isMeta: true
      }));
  }

  static calcularTotal(itens) {
    return itens.reduce((sum, item) => sum + (Number(item.valor) || 0), 0);
  }

  static formatarDetalhes(itens, tipo) {
    return itens.map(item => ({
      descricao: item.descricao,
      valor: item.valor,
      frequencia: item.frequencia,
      [`mes_${tipo}`]: tipo === 'recebimento' ? item.mes_recebimento : item.mes_pagamento,
      ...(item.isMeta && { isMeta: true })
    }));
  }

  static getMesIndex(nomeMes) {
    const meses = ["janeiro", "fevereiro", "março", "abril", "maio", "junho",
      "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
    return meses.indexOf(nomeMes?.toLowerCase());
  }

  static verificarAlertas(projecao) {
    const alertas = [];
    let saldoNegativo = false;

    projecao.forEach((mes, index) => {
      // Alerta para saldo negativo
      if (mes.saldo < 0 && !saldoNegativo) {
        alertas.push({
          tipo: 'saldo_negativo',
          mensagem: `Atenção! Saldo negativo previsto para ${mes.mes}`,
          mes: mes.mes,
          valor: mes.saldo
        });
        saldoNegativo = true;
      }

      // Alerta para saldo acumulado negativo
      if (mes.saldoAcumulado < 0) {
        alertas.push({
          tipo: 'saldo_acumulado_negativo',
          mensagem: `Atenção! Saldo acumulado negativo em ${mes.mes}`,
          mes: mes.mes,
          valor: mes.saldoAcumulado
        });
      }

      // Alerta para variação brusca de receitas/despesas
      if (index > 0) {
        const variacao = Math.abs(mes.recebimentos - projecao[index-1].recebimentos) / 
                         projecao[index-1].recebimentos;
        
        if (variacao > 0.5) { // +50% de variação
          alertas.push({
            tipo: 'variacao_receita',
            mensagem: `Variação significativa nas receitas em ${mes.mes}`,
            mes: mes.mes,
            variacao: `${(variacao * 100).toFixed(0)}%`
          });
        }
      }
    });

    return alertas;
  }
}

module.exports = Projecao;