const { db } = require('../config/database');

class Meta {
  // Métodos auxiliares para promisificar
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
  static async criar(meta) {
    try {
      // Calculate installment value
      const valorParcela = meta.valorTotal / meta.prazoMeses;
      
      const result = await this.run(
        `INSERT INTO metas 
         (descricao, valor_total, tipo, prazo_meses, valor_parcela) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          meta.descricao,
          meta.valorTotal,
          meta.tipo,
          meta.prazoMeses,
          valorParcela
        ]
      );
      
      return await this.buscarPorId(result.lastID);
    } catch (err) {
      console.error('Erro ao criar meta:', err);
      throw new Error('Falha ao criar meta no banco de dados');
    }
  }

  static async listar() {
    try {
      return await this.query(
        `SELECT 
          id,
          descricao, 
          valor_total as valorTotal, 
          tipo, 
          prazo_meses as prazoMeses, 
          valor_parcela as valorParcela 
         FROM metas
         ORDER BY prazo_meses ASC, valor_parcela DESC`
      );
    } catch (err) {
      console.error('Erro ao listar metas:', err);
      throw new Error('Falha ao buscar metas no banco de dados');
    }
  }

  static async buscarPorId(id) {
    try {
      return await this.get(
        `SELECT 
          id,
          descricao, 
          valor_total as valorTotal, 
          tipo, 
          prazo_meses as prazoMeses, 
          valor_parcela as valorParcela 
         FROM metas 
         WHERE id = ?`,
        [id]
      );
    } catch (err) {
      console.error(`Erro ao buscar meta ID ${id}:`, err);
      throw new Error(`Falha ao buscar meta com ID ${id}`);
    }
  }

  static async atualizar(id, campos) {
    try {
      const updateFields = [];
      const values = [];
      
      // Dynamic field updates
      if (campos.descricao !== undefined) {
        updateFields.push('descricao = ?');
        values.push(campos.descricao);
      }
      if (campos.valorTotal !== undefined) {
        updateFields.push('valor_total = ?');
        values.push(campos.valorTotal);
      }
      if (campos.tipo !== undefined) {
        updateFields.push('tipo = ?');
        values.push(campos.tipo);
      }
      if (campos.prazoMeses !== undefined) {
        updateFields.push('prazo_meses = ?');
        values.push(campos.prazoMeses);
      }
      
      // Recalculate installment if amount or term changes
      if (campos.valorTotal !== undefined || campos.prazoMeses !== undefined) {
        const current = campos.valorTotal !== undefined ? campos.valorTotal : 
          (await this.buscarPorId(id))?.valorTotal;
        const term = campos.prazoMeses !== undefined ? campos.prazoMeses : 
          (await this.buscarPorId(id))?.prazoMeses;
        
        if (current && term) {
          updateFields.push('valor_parcela = ?');
          values.push(current / term);
        }
      }

      if (updateFields.length === 0) {
        throw new Error('Nenhum campo válido fornecido para atualização');
      }

      values.push(id);
      
      await this.run(
        `UPDATE metas SET 
         ${updateFields.join(', ')} 
         WHERE id = ?`,
        values
      );
      
      return await this.buscarPorId(id);
    } catch (err) {
      console.error(`Erro ao atualizar meta ID ${id}:`, err);
      throw new Error(`Falha ao atualizar meta com ID ${id}`);
    }
  }

  static async remover(id) {
    try {
      const result = await this.run(
        'DELETE FROM metas WHERE id = ?',
        [id]
      );
      return result.changes > 0;
    } catch (err) {
      console.error(`Erro ao remover meta ID ${id}:`, err);
      throw new Error(`Falha ao remover meta com ID ${id}`);
    }
  }

  // Métodos adicionais
  static async metasPorTipo() {
    try {
      return await this.query(
        `SELECT 
          tipo,
          COUNT(*) as quantidade,
          SUM(valor_total) as total,
          AVG(prazo_meses) as prazo_medio
         FROM metas
         GROUP BY tipo`
      );
    } catch (err) {
      console.error('Erro ao buscar metas por tipo:', err);
      throw new Error('Falha ao agrupar metas por tipo');
    }
  }

  static async progressoMetas() {
    try {
      return await this.query(
        `SELECT 
          id,
          descricao,
          valor_total as valorTotal,
          valor_parcela as valorParcela,
          (SELECT COUNT(*) FROM transacoes WHERE meta_id = metas.id) as parcelas_pagas,
          (valor_total - COALESCE((SELECT SUM(valor) FROM transacoes WHERE meta_id = metas.id), 0)) as saldo_restante
         FROM metas`
      );
    } catch (err) {
      console.error('Erro ao calcular progresso das metas:', err);
      throw new Error('Falha ao calcular progresso das metas');
    }
  }
}

module.exports = Meta;