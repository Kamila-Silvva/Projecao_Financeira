const db = require('../config/database');

class Renda {
  static criar(renda) {
    return new Promise((resolve, reject) => {
      try {
        // Validação dos dados de entrada
        if (!renda.descricao || !renda.valor || !renda.frequencia) {
          throw new Error('Dados incompletos para criação de renda');
        }

        console.log('Dados recebidos para inserção:', renda);

        // Normaliza a frequência para minúsculas
        const frequencia = renda.frequencia.toLowerCase();
        const frequenciasValidas = ['mensal', 'trimestral', 'semestral', 'anual', 'único', 'unico'];
        
        if (!frequenciasValidas.includes(frequencia)) {
          throw new Error('Frequência inválida');
        }

        // Determina se deve armazenar o mês de recebimento
        const deveArmazenarMes = ['trimestral', 'semestral', 'anual', 'único', 'unico'].includes(frequencia);
        const mesRecebimento = deveArmazenarMes ? renda.mesRecebimento : null;

        db.run(
          `INSERT INTO rendas (descricao, valor, frequencia, mes_recebimento) 
           VALUES (?, ?, ?, ?)`,
          [
            renda.descricao, 
            parseFloat(renda.valor), 
            renda.frequencia, 
            mesRecebimento
          ],
          function(err) {
            if (err) {
              console.error('Erro na query:', err);
              return reject(new Error('Falha ao criar renda no banco de dados'));
            }
            resolve({ 
              id: this.lastID, 
              descricao: renda.descricao,
              valor: renda.valor,
              frequencia: renda.frequencia,
              mesRecebimento: mesRecebimento
            });
          }
        );
      } catch (error) {
        console.error('Erro ao processar criação de renda:', error);
        reject(error);
      }
    });
  }

  static listar() {
    return new Promise((resolve, reject) => {
      db.all(
        "SELECT id, descricao, valor, frequencia, mes_recebimento as mesRecebimento FROM rendas",
        (err, rows) => {
          if (err) {
            console.error('Erro ao listar rendas:', err);
            return reject(new Error('Falha ao buscar rendas'));
          }
          resolve(rows);
        }
      );
    });
  }

  static buscarPorId(id) {
    return new Promise((resolve, reject) => {
      db.get(
        "SELECT id, descricao, valor, frequencia, mes_recebimento as mesRecebimento FROM rendas WHERE id = ?",
        [id],
        (err, row) => {
          if (err) {
            console.error(`Erro ao buscar renda ID ${id}:`, err);
            return reject(new Error('Falha ao buscar renda'));
          }
          resolve(row || null);
        }
      );
    });
  }

  static atualizar(id, renda) {
    return new Promise((resolve, reject) => {
      try {
        // Validação dos dados de entrada
        if (!renda.descricao || !renda.valor || !renda.frequencia) {
          throw new Error('Dados incompletos para atualização');
        }

        const frequencia = renda.frequencia.toLowerCase();
        const frequenciasValidas = ['mensal', 'trimestral', 'semestral', 'anual', 'único', 'unico'];
        
        if (!frequenciasValidas.includes(frequencia)) {
          throw new Error('Frequência inválida');
        }

        const deveArmazenarMes = ['trimestral', 'semestral', 'anual', 'único', 'unico'].includes(frequencia);
        const mesRecebimento = deveArmazenarMes ? renda.mesRecebimento : null;

        db.run(
          `UPDATE rendas SET 
            descricao = ?,
            valor = ?,
            frequencia = ?,
            mes_recebimento = ?
           WHERE id = ?`,
          [
            renda.descricao,
            parseFloat(renda.valor),
            renda.frequencia,
            mesRecebimento,
            id
          ],
          function(err) {
            if (err) {
              console.error(`Erro ao atualizar renda ID ${id}:`, err);
              return reject(new Error('Falha ao atualizar renda'));
            }
            if (this.changes === 0) {
              return resolve(null); // Nenhum registro foi atualizado
            }
            resolve({ 
              id, 
              ...renda,
              mesRecebimento
            });
          }
        );
      } catch (error) {
        console.error(`Erro ao processar atualização da renda ID ${id}:`, error);
        reject(error);
      }
    });
  }

  static remover(id) {
    return new Promise((resolve, reject) => {
      db.run(
        'DELETE FROM rendas WHERE id = ?',
        [id],
        function(err) {
          if (err) {
            console.error(`Erro ao remover renda ID ${id}:`, err);
            return reject(new Error('Falha ao remover renda'));
          }
          resolve(this.changes > 0);
        }
      );
    });
  }
}

module.exports = Renda;