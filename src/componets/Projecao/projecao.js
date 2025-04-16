import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ProgressoContext } from "../Renda/ProgressoContext";
import "../styles/Global.css";

const formatarMoeda = (valor) => {
  return (valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
};

const Projecao = () => {
  const { etapas, etapaAtual } = useContext(ProgressoContext);
  const navigate = useNavigate();

  const [rendas, setRendas] = useState([]);
  const [gastosFixos, setGastosFixos] = useState([]);
  const [metasInvestimentos, setMetasInvestimentos] = useState([]);
  const [projecao, setProjecao] = useState([]);
  const [mesExpandido, setMesExpandido] = useState(null);
  const [alertas, setAlertas] = useState([]);
  const [mostrarPopupAjuste, setMostrarPopupAjuste] = useState(false);
  const [itemParaAjuste, setItemParaAjuste] = useState(null);

  useEffect(() => {
    const carregarDados = () => {
      try {
        const garantirIds = (itens) =>
          (itens || []).map((item) =>
            item.id ? item : { ...item, id: Date.now() + Math.random() }
          );

        const rendasData = JSON.parse(
          localStorage.getItem("itensRenda") || "[]"
        );
        const gastosData = JSON.parse(
          localStorage.getItem("itensGastos") || "[]"
        );
        const metasData = JSON.parse(
          localStorage.getItem("itensMetas") || "[]"
        );

        setRendas(garantirIds(rendasData));
        setGastosFixos(garantirIds(gastosData));
        setMetasInvestimentos(garantirIds(metasData));
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      }
    };

    carregarDados();
  }, []);

  const calcularProjecao = () => {
    const meses = [
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro",
    ];

    const novaProjecao = meses.map((mes, mesIndex) => {
      const recebimentosDetalhados = (rendas || []).filter((item) => {
        if (!item) return false;

        const freq = item.frequencia?.toLowerCase();
        const mesRef = item.mesRecebimento?.toLowerCase();

        switch (freq) {
          case "mensal":
            return true;
          case "trimestral":
            return (
              (mesIndex - meses.findIndex((m) => m.toLowerCase() === mesRef)) %
                3 ===
              0
            );
          case "semestral":
            return (
              (mesIndex - meses.findIndex((m) => m.toLowerCase() === mesRef)) %
                6 ===
              0
            );
          case "anual":
            return mes.toLowerCase() === mesRef;
          case "único":
            return mes.toLowerCase() === mesRef;
          default:
            return false;
        }
      });

      const recebimentos = recebimentosDetalhados.reduce(
        (sum, item) => sum + (Number(item?.valor) || 0),
        0
      );

      const gastosDetalhados = (gastosFixos || []).filter((item) => {
        if (!item) return false;

        if (item.frequencia === "Mensal") return true;

        if (item.frequencia === "Trimestral") {
          if (item.mesPagamento && typeof item.mesPagamento === "string") {
            const mesRefIndex = meses.findIndex(
              (m) => m.toLowerCase() === item.mesPagamento.toLowerCase()
            );
            return (
              (mesIndex - mesRefIndex) % 3 === 0 && mesIndex >= mesRefIndex
            );
          }
          return mesIndex % 3 === 0;
        }

        if (item.frequencia === "Semestral") {
          if (item.mesPagamento && typeof item.mesPagamento === "string") {
            const mesRefIndex = meses.findIndex(
              (m) => m.toLowerCase() === item.mesPagamento.toLowerCase()
            );
            return (
              (mesIndex - mesRefIndex) % 6 === 0 && mesIndex >= mesRefIndex
            );
          }
          return mesIndex % 6 === 0;
        }

        if (item.frequencia === "Anual") {
          if (item.mesPagamento && typeof item.mesPagamento === "string") {
            return item.mesPagamento.toLowerCase() === mes.toLowerCase();
          }
          return mesIndex === 0;
        }

        if (item.frequencia === "Único" && item.mesPagamento === mes)
          return true;

        return false;
      });

      const parcelasMetas = (metasInvestimentos || [])
        .filter((meta) => {
          const mesesAtivos =
            meta.mesesAtivos ||
            Array.from({ length: meta.prazoMeses || 1 }, (_, i) => i);
          return mesesAtivos.includes(mesIndex);
        })
        .map((meta) => ({
          ...meta,
          descricao: `${meta.descricao} (${meta.tipo})`,
          valor: meta.valorParcela || 0,
          frequencia: "Mensal",
          isMeta: true,
        }));

      const todosGastos = [...gastosDetalhados, ...parcelasMetas];
      const gastos = todosGastos.reduce(
        (sum, item) => sum + (Number(item?.valor) || 0),
        0
      );

      return {
        mes,
        recebimentos,
        gastos,
        saldo: recebimentos - gastos,
        recebimentosDetalhados,
        gastosDetalhados: todosGastos,
      };
    });

    setProjecao(novaProjecao);
    verificarAlertas(novaProjecao);
  };

  useEffect(() => {
    calcularProjecao();
  }, [rendas, gastosFixos, metasInvestimentos]);

  const verificarAlertas = (projecao) => {
    const novosAlertas = [];
    let mesesNegativo = [];
    let mesesAltoComprometimento = [];
    let totalNegativo = 0;

    projecao.forEach((mes) => {
      if (mes.saldo < 0) {
        mesesNegativo.push(mes.mes);
        totalNegativo += mes.saldo;
      }

      // Novo: Cálculo de faixas de comprometimento
      if (mes.recebimentos > 0) {
        const percentualComprometido = (mes.gastos / mes.recebimentos) * 100;

        if (percentualComprometido > 70) {
          mesesAltoComprometimento.push({
            nome: mes.mes,
            porcentagem: percentualComprometido.toFixed(0),
            nivel:
              percentualComprometido > 90
                ? "🔴 Crítico"
                : percentualComprometido > 70
                ? "🟡 Atenção"
                : "🟢 Saudável",
          });
        }
      }
    });

    // Alertas de saldo negativo (mantido igual)
    if (mesesNegativo.length > 0) {
      novosAlertas.push({
        tipo: "saldo-negativo",
        mensagem: `Você terá saldo negativo em ${
          mesesNegativo.length
        } meses com déficit total de ${formatarMoeda(
          Math.abs(totalNegativo)
        )}.`,
      });
    }

    // Novo: Alertas de comprometimento por faixa
    if (mesesAltoComprometimento.length > 0) {
      const mesesCriticos = mesesAltoComprometimento.filter(
        (m) => m.nivel === "🔴 Crítico"
      );
      const mesesAtencao = mesesAltoComprometimento.filter(
        (m) => m.nivel === "🟡 Atenção"
      );

      if (mesesCriticos.length > 0) {
        novosAlertas.push({
          tipo: "comprometimento-critico",
          mensagem: `⚠️ **Alerta crítico**: ${mesesCriticos.length} meses comprometem mais de 90% da renda.`,
          detalhes: `Recomendado: gastos fixos ≤50% + metas ≤20% + lazer ≤30%.`,
          meses: mesesCriticos,
        });
      }

      if (mesesAtencao.length > 0) {
        novosAlertas.push({
          tipo: "comprometimento-atencao",
          mensagem: `⚠️ **Atenção**: ${mesesAtencao.length} meses comprometem 70%-90% da renda.`,
          detalhes: `Considere reduzir despesas ou revisar metas para manter folga.`,
          meses: mesesAtencao,
        });
      }
    }

    setAlertas(novosAlertas);
  };

  const sugerirAjustes = (item) => {
    const isRecorrente = ["Mensal", "Trimestral", "Semestral"].includes(
      item.frequencia
    );

    if (!item.isMeta && isRecorrente) {
      const confirmar = window.confirm(
        `Deseja ajustar "${item.descricao}" em TODOS os meses?`
      );
      if (confirmar) {
        setItemParaAjuste(item);
        setMostrarPopupAjuste(true);
      }
    } else {
      // Metas ou gastos únicos/anuais: ajuste individual sem confirmação
      setItemParaAjuste(item);
      setMostrarPopupAjuste(true);
    }
  };

  const aplicarAjusteMeta = (valorTotal, novoPrazo) => {
    const valorParcela = Math.round((valorTotal / novoPrazo) * 100) / 100; // Arredonda para 2 decimais
    const valorTotalAjustado = valorParcela * novoPrazo; // Garante que o total seja exato

    const metasAtualizadas = metasInvestimentos.map((meta) => {
      if (meta.id === itemParaAjuste.id) {
        return {
          ...meta,
          valor: valorTotalAjustado, // Usa o valor ajustado
          valorTotal: valorTotalAjustado,
          prazoMeses: novoPrazo,
          valorParcela: valorParcela,
          mesesAtivos: Array.from({ length: novoPrazo }, (_, i) => i),
        };
      }
      return meta;
    });

    setMetasInvestimentos(metasAtualizadas);
    localStorage.setItem("itensMetas", JSON.stringify(metasAtualizadas));
    setMostrarPopupAjuste(false);
    calcularProjecao();
  };

  const aplicarAjusteGasto = (novoValor) => {
    const valorNum = Number(novoValor) || 0;

    const gastosAtualizados = (gastosFixos || []).map((gasto) => {
      // Ajuste global apenas para frequências recorrentes
      if (["Mensal", "Trimestral", "Semestral"].includes(gasto.frequencia)) {
        if (
          gasto.descricao === itemParaAjuste.descricao &&
          gasto.frequencia === itemParaAjuste.frequencia
        ) {
          return { ...gasto, valor: valorNum };
        }
      }
      // Ajuste individual para únicos/anuais
      else if (gasto.id === itemParaAjuste.id) {
        return { ...gasto, valor: valorNum };
      }
      return gasto;
    });

    setGastosFixos(gastosAtualizados);
    localStorage.setItem("itensGastos", JSON.stringify(gastosAtualizados));
    setMostrarPopupAjuste(false);
    calcularProjecao();
  };

  useEffect(() => {
    calcularProjecao();
  }, [rendas, gastosFixos, metasInvestimentos]);

  const toggleExpandirMes = (index) => {
    setMesExpandido(mesExpandido === index ? null : index);
  };

  const voltarEtapa = () => {
    navigate("/metas-investimentos");
  };

  const PopupAjuste = () => {
    const isMeta = itemParaAjuste?.isMeta || false;

    const valorTotalMeta = isMeta
      ? itemParaAjuste?.valorTotal ||
        itemParaAjuste?.valor * itemParaAjuste?.prazoMeses ||
        0
      : 0;
    const valorGasto = !isMeta ? itemParaAjuste?.valor || 0 : 0;
    const prazoOriginal = itemParaAjuste?.prazoMeses || 1;
    const descricaoOriginal = itemParaAjuste?.descricao || "";

    const [valorTotal, setValorTotal] = useState(valorTotalMeta);
    const [valorGastoEdit, setValorGastoEdit] = useState(valorGasto);
    const [novoPrazo, setNovoPrazo] = useState(prazoOriginal);
    const [erro, setErro] = useState("");

    const valorParcela = parseFloat((valorTotal / novoPrazo).toFixed(2));
    const valorTotalAjustado = parseFloat(
      (valorParcela * novoPrazo).toFixed(2)
    );
    const parcelaOriginal = valorTotalMeta / prazoOriginal;

    const formatCurrency = (value) => {
      return parseFloat(value || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });
    };

    const handleAjustePrazo = (e) => {
      const prazo = Math.max(1, Number(e.target.value));
      setNovoPrazo(prazo);

      if (prazo > 12) {
        setErro(
          "O prazo máximo é 12 meses. Considere reduzir o valor total para manter parcelas acessíveis."
        );
      } else {
        setErro("");
      }
    };

    const handleAplicar = () => {
      if (isMeta && novoPrazo > 12) {
        setErro("Por favor, ajuste para no máximo 12 meses.");
        return;
      }
      if (isMeta) {
        aplicarAjusteMeta(valorTotalAjustado, novoPrazo);
      } else {
        aplicarAjusteGasto(valorGastoEdit);
      }
    };

    return (
      <div className="modal-overlay">
        <div className="modal-container">
          <h3>{isMeta ? "Ajuste de Meta" : "Editar Gasto Fixo"}</h3>

          {/* Aviso de ajuste global para gastos fixos */}
          {!isMeta &&
            ["Mensal", "Trimestral", "Semestral"].includes(
              itemParaAjuste?.frequencia
            ) && (
              <div className="alerta global">
                <p>
                  🌍 Este ajuste afetará TODAS as ocorrências deste gasto
                  recorrente
                </p>
              </div>
            )}

          <div className="campo-formulario">
            <p className="rotulo">Descrição:</p>
            <p>{descricaoOriginal}</p>
          </div>

          {isMeta ? (
            <>
              <div className="campo-formulario">
                <label className="rotulo">
                  Valor Total da Meta:
                  <input
                    type="number"
                    value={valorTotal}
                    onChange={(e) =>
                      setValorTotal(Math.max(0, Number(e.target.value)))
                    }
                    className="campo-input"
                    min="0.01"
                    step="0.01"
                  />
                </label>
              </div>

              <div className="campo-formulario">
                <label className="rotulo">
                  Prazo (meses):
                  <input
                    type="number"
                    value={novoPrazo}
                    onChange={handleAjustePrazo}
                    className="campo-input"
                    style={{ borderColor: novoPrazo > 12 ? "#ff6b6b" : "" }}
                    min="1"
                    max="12"
                  />
                </label>
                {prazoOriginal >= 12 && (
                  <p
                    style={{
                      color: "#ff6b6b",
                      fontSize: "0.8rem",
                      marginTop: "5px",
                    }}
                  >
                    ⚠️ Prazo já está no máximo anual (12 meses)
                  </p>
                )}
              </div>

              {erro && (
                <div className="alerta saldo-negativo">
                  <p>⚠️ {erro}</p>
                </div>
              )}

              <div className="campo-formulario">
                <p className="rotulo">Parcela Atual:</p>
                <p>
                  {formatCurrency(parcelaOriginal)}/mês ({prazoOriginal} meses)
                </p>
              </div>

              <div className="campo-formulario">
                <p className="rotulo">Nova Parcela:</p>
                <p style={{ color: novoPrazo > 12 ? "#ff6b6b" : "#4CAF50" }}>
                  {formatCurrency(valorParcela)}/mês ({novoPrazo} meses)
                </p>
              </div>
            </>
          ) : (
            <div className="campo-formulario">
              <label className="rotulo">
                Valor do Gasto:
                <input
                  type="number"
                  value={valorGastoEdit}
                  onChange={(e) =>
                    setValorGastoEdit(Math.max(0, Number(e.target.value)))
                  }
                  className="campo-input"
                  min="0.01"
                  step="0.01"
                />
              </label>
            </div>
          )}

          <div className="botoes-modal">
            <button
              className="botao-voltar"
              onClick={() => setMostrarPopupAjuste(false)}
            >
              Cancelar
            </button>
            <button
              className={`botao ${isMeta && novoPrazo > 12 ? "disabled" : ""}`}
              onClick={handleAplicar}
              disabled={isMeta && novoPrazo > 12}
            >
              {isMeta ? "Aplicar Ajuste" : "Salvar Valor"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container-principal">
      <div className="cabecalho">
        <h1 className="titulo-app">
          Controla<span className="destaque-titulo">+</span>
        </h1>
        <h2 className="subtitulo">Projeção</h2>
        <p className="texto-descritivo">
          Veja como ficará sua situação financeira nos próximos 12 meses.
        </p>
      </div>

      <div className="barra-progresso">
        {etapas.map((etapa, index) => (
          <div key={index} className="etapa-container">
            <div
              className={`marcador-etapa ${
                index === etapaAtual ? "etapa-ativa" : "etapa-inativa"
              }`}
            >
              {index + 1}
            </div>
            <span
              className={`rotulo-etapa ${
                index === etapaAtual ? "rotulo-ativo" : "rotulo-inativo"
              }`}
            >
              {etapa}
            </span>
          </div>
        ))}
      </div>

      {alertas.length > 0 && (
        <div className="alertas-container">
          <h3 className="alertas-title">Atenção!</h3>
          {alertas.map((alerta, index) => (
            <div key={index} className={`alerta ${alerta.tipo}`}>
              <p className="alerta-text">
                {alerta.tipo.includes("comprometimento") && (
                  <span style={{ marginRight: "8px" }}>
                    {alerta.tipo === "comprometimento-critico" ? "🔴" : "🟡"}
                  </span>
                )}
                {alerta.mensagem}
              </p>

              {alerta.detalhes && (
                <p className="alerta-detalhes">{alerta.detalhes}</p>
              )}

              {alerta.meses && (
                <>
                  <p className="alerta-subtitle">Meses afetados:</p>
                  <ul className="alerta-list">
                    {alerta.meses.slice(0, 3).map((mes, i) => (
                      <li key={i} className="alerta-list-item">
                        {mes.nome}: {mes.porcentagem}% ({mes.nivel})
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="projecao-container">
        <h2 className="projecao-header">Projeção Financeira Anual</h2>

        <div className="resumo-grid">
          <div className="resumo-card">
            <h3 className="resumo-card-title">Renda Mensal</h3>
            <p className="resumo-card-value">
              {formatarMoeda(
                projecao.reduce(
                  (sum, item) => sum + (item?.recebimentos || 0),
                  0
                ) / 12
              )}
            </p>
          </div>
          <div className="resumo-card">
            <h3 className="resumo-card-title">Despesas Mensais</h3>
            <p className="resumo-card-value">
              {formatarMoeda(
                projecao.reduce((sum, item) => sum + (item?.gastos || 0), 0) /
                  12
              )}
            </p>
          </div>
          <div className="resumo-card">
            <h3 className="resumo-card-title">Saldo Mensal</h3>
            <p
              className={`resumo-card-value ${
                projecao.reduce((sum, item) => sum + (item?.saldo || 0), 0) >= 0
                  ? "positivo"
                  : "negativo"
              }`}
            >
              {formatarMoeda(
                projecao.reduce((sum, item) => sum + (item?.saldo || 0), 0) / 12
              )}
            </p>
          </div>
        </div>

        <div className="tabela-container">
          <table className="projecao-table">
            <thead>
              <tr className="table-header-row">
                <th className="table-header">Mês</th>
                <th className="table-header">Recebimentos</th>
                <th className="table-header">Gastos</th>
                <th className="table-header">Saldo</th>
                <th className="table-header">Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {projecao.map((item, index) => (
                <React.Fragment key={index}>
                  <tr
                    className={`table-row ${
                      item.saldo < 0
                        ? "saldo-negativo"
                        : item.recebimentos > 0 &&
                          item.gastos / item.recebimentos > 0.9
                        ? "comprometimento-critico"
                        : item.recebimentos > 0 &&
                          item.gastos / item.recebimentos > 0.7
                        ? "comprometimento-atencao"
                        : ""
                    }`}
                  >
                    <td className="table-cell">{item.mes}</td>
                    <td className="table-cell">
                      {formatarMoeda(item.recebimentos)}
                    </td>
                    <td className="table-cell">{formatarMoeda(item.gastos)}</td>
                    <td
                      className={`table-cell ${
                        item.saldo >= 0 ? "positivo" : "negativo"
                      }`}
                    >
                      {formatarMoeda(item.saldo)}
                    </td>
                    <td className="table-cell">
                      <button
                        className="details-button"
                        onClick={() => toggleExpandirMes(index)}
                      >
                        {mesExpandido === index ? "▲" : "▼"}
                      </button>
                    </td>
                  </tr>
                  {mesExpandido === index && (
                    <tr>
                      <td colSpan="5" className="expanded-cell">
                        <div className="details-container">
                          <div className="details-section">
                            <h4 className="details-title">Gastos:</h4>
                            <ul className="details-list">
                              {item.gastosDetalhados.map((gasto, i) => (
                                <li key={i} className="details-list-item">
                                  <span className="detail-description">
                                    {gasto.descricao}
                                  </span>
                                  <span className="detail-value">
                                    {formatarMoeda(gasto.valor)}
                                  </span>
                                  <span className="detail-frequency">
                                    ({gasto.frequencia}
                                    {gasto.mesPagamento &&
                                      ` | Mês Ref.: ${gasto.mesPagamento}`}
                                    )
                                  </span>
                                  {(item.saldo < 0 ||
                                    (item.recebimentos > 0 &&
                                      item.gastos / item.recebimentos >=
                                        0.7)) && (
                                    <button
                                      className={`suggestion-button ${
                                        !gasto.isMeta &&
                                        [
                                          "Mensal",
                                          "Trimestral",
                                          "Semestral",
                                        ].includes(gasto.frequencia)
                                          ? "global-adjust"
                                          : ""
                                      }`}
                                      onClick={() => sugerirAjustes(gasto)}
                                      title={
                                        !gasto.isMeta &&
                                        [
                                          "Mensal",
                                          "Trimestral",
                                          "Semestral",
                                        ].includes(gasto.frequencia)
                                          ? "Este ajuste modificará TODAS as ocorrências deste gasto fixo"
                                          : "Ajuste individual para este registro"
                                      }
                                    >
                                      {(() => {
                                        if (gasto.isMeta)
                                          return "Ajustar Parcela";
                                        if (gasto.frequencia === "Único")
                                          return "Ajustar";
                                        if (gasto.frequencia === "Anual")
                                          return "Ajustar";
                                        return "Ajustar";
                                      })()}
                                    </button>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="details-section">
                            <h4 className="details-title">Recebimentos:</h4>
                            <ul className="details-list">
                              {item.recebimentosDetalhados.map(
                                (recebimento, i) => (
                                  <li key={i} className="details-list-item">
                                    <span className="detail-description">
                                      {recebimento.descricao}
                                    </span>
                                    <span className="detail-value">
                                      {formatarMoeda(recebimento.valor)}
                                    </span>
                                    <span className="detail-frequency">
                                      ({recebimento.frequencia}
                                      {recebimento.mesRecebimento !==
                                        undefined &&
                                      recebimento.mesRecebimento !== null
                                        ? ` | Mês Ref.: ${recebimento.mesRecebimento}`
                                        : ""}
                                      )
                                    </span>
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        <div className="controle-navegacao">
          <button className="botao-voltar" onClick={voltarEtapa}>
            Voltar
          </button>
          <button
            className="botao-avancar"
            onClick={() => alert("Projeção concluída!")}
          >
            Concluir
          </button>
        </div>
      </div>

      {mostrarPopupAjuste && <PopupAjuste />}
    </div>
  );
};

export default Projecao;
