const { db } = require('../config/database');

class Gasto {
  // Método auxiliar para promisificar operações do banco
  static async query(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static async run(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve(this);
      });
    });
  }

  static async get(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  // Métodos principais
  static async criar(gasto) {
    try {
      const result = await this.run(
        `INSERT INTO despesas 
         (descricao, valor, frequencia, mes_pagamento) 
         VALUES (?, ?, ?, ?)`,
        [gasto.descricao, gasto.valor, gasto.frequencia, gasto.mesPagamento]
      );
      
      return await this.buscarPorId(result.lastID);
    } catch (err) {
      console.error('Erro ao criar gasto:', err);
      throw err;
    }
  }

  static async listar() {
    try {
      return await this.query(
        `SELECT 
          id,
          descricao, 
          valor, 
          frequencia, 
          mes_pagamento as mesPagamento 
         FROM despesas
         ORDER BY id DESC`
      );
    } catch (err) {
      console.error('Erro ao listar gastos:', err);
      throw err;
    }
  }

  static async buscarPorId(id) {
    try {
      return await this.get(
        `SELECT 
          id,
          descricao, 
          valor, 
          frequencia, 
          mes_pagamento as mesPagamento 
         FROM despesas 
         WHERE id = ?`,
        [id]
      );
    } catch (err) {
      console.error(`Erro ao buscar gasto ID ${id}:`, err);
      throw err;
    }
  }

  static async atualizar(id, campos) {
    try {
      const updateFields = [];
      const values = [];
      
      if (campos.descricao !== undefined) {
        updateFields.push('descricao = ?');
        values.push(campos.descricao);
      }
      if (campos.valor !== undefined) {
        updateFields.push('valor = ?');
        values.push(campos.valor);
      }
      if (campos.frequencia !== undefined) {
        updateFields.push('frequencia = ?');
        values.push(campos.frequencia);
      }
      if (campos.mesPagamento !== undefined) {
        updateFields.push('mes_pagamento = ?');
        values.push(campos.mesPagamento);
      }

      if (updateFields.length === 0) {
        throw new Error('Nenhum campo válido fornecido para atualização');
      }

      values.push(id);
      
      await this.run(
        `UPDATE despesas SET 
         ${updateFields.join(', ')} 
         WHERE id = ?`,
        values
      );
      
      return await this.buscarPorId(id);
    } catch (err) {
      console.error(`Erro ao atualizar gasto ID ${id}:`, err);
      throw err;
    }
  }

  static async remover(id) {
    try {
      const result = await this.run(
        'DELETE FROM despesas WHERE id = ?',
        [id]
      );
      return result.changes > 0;
    } catch (err) {
      console.error(`Erro ao remover gasto ID ${id}:`, err);
      throw err;
    }
  }

  static async totalPorMes(mes) {
    try {
      const result = await this.get(
        `SELECT SUM(valor) as total 
         FROM despesas 
         WHERE mes_pagamento = ? OR frequencia = 'Mensal'`,
        [mes]
      );
      return result ? result.total || 0 : 0;
    } catch (err) {
      console.error(`Erro ao calcular total para mês ${mes}:`, err);
      throw err;
    }
  }
}

module.exports = Gasto;