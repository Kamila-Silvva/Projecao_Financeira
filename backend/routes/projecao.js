const express = require('express');
const router = express.Router();
const db = require('../db'); 

router.get('/projecao/:id_usuario', (req, res) => {
  const idUsuario = req.params.id_usuario;

  const query = `
    SELECT
        ? AS id_usuario,
        (
            SELECT SUM(
                CASE
                    WHEN frequencia = 'mensal' THEN valor * 12
                    WHEN frequencia = 'bimestral' THEN valor * 6
                    WHEN frequencia = 'trimestral' THEN valor * 4
                    WHEN frequencia = 'semestral' THEN valor * 2
                    WHEN frequencia = 'anual' THEN valor * 1
                END
            )
            FROM despesas
            WHERE id_usuario = ?
        ) AS total_despesas_anuais,
        (
            SELECT SUM(valor_mensal * meses_necessarios)
            FROM metas_investimentos
            WHERE id_usuario = ?
        ) AS total_valor_em_metas,
        (
            SELECT
                CASE
                    WHEN
                        (
                            SELECT SUM(
                                CASE
                                    WHEN frequencia = 'mensal' THEN valor * 12
                                    WHEN frequencia = 'bimestral' THEN valor * 6
                                    WHEN frequencia = 'trimestral' THEN valor * 4
                                    WHEN frequencia = 'semestral' THEN valor * 2
                                    WHEN frequencia = 'anual' THEN valor * 1
                                END
                            )
                            FROM despesas
                            WHERE id_usuario = ?
                        )
                        >
                        (
                            SELECT SUM(
                                CASE
                                    WHEN frequencia = 'mensal' THEN valor * 12
                                    WHEN frequencia = 'bimestral' THEN valor * 6
                                    WHEN frequencia = 'trimestral' THEN valor * 4
                                    WHEN frequencia = 'semestral' THEN valor * 2
                                    WHEN frequencia = 'anual' THEN valor * 1
                                END
                            )
                            FROM rendas
                            WHERE id_usuario = ?
                        )
                    THEN TRUE ELSE FALSE
                END
        ) AS ultrapassou_limite;
  `;

  db.query(query, [idUsuario, idUsuario, idUsuario, idUsuario, idUsuario], (err, results) => {
    if (err) {
      console.error('Erro ao buscar projeção:', err);
      return res.status(500).json({ error: 'Erro no servidor' });
    }
    res.json(results[0]);
  });
});

module.exports = router;
