import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProgressoContext } from '../Renda/ProgressoContext';
import '../styles/Global.css'

const formatarMoeda = (valor) => {
  return (valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
};

// Componente Modal de Edição
const Button = ({ children, onClick, className, disabled }) => (
  <button 
    onClick={onClick} 
    className={`botao ${className || ''}`}
    disabled={disabled}
  >
    {children}
  </button>
);

const ModalEdicao = ({ item, onSave, onClose }) => {
  const [dadosEditados, setDadosEditados] = useState({
    ...item,
    valor: item.valorTotal // Mostra o valor TOTAL no campo de edição
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDadosEditados(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <h3>Editar Meta/Investimento</h3>
        
        <div className="campo-formulario">
          <label className="rotulo">Descrição</label>
          <input 
            className="campo-input"
            name="descricao"
            value={dadosEditados.descricao}
            onChange={handleChange}
          />
        </div>
        
        <div className="campo-formulario">
          <label className="rotulo">Valor Total (R$)</label>
          <input 
            className="campo-input"
            type="number"
            name="valor"
            value={dadosEditados.valor}
            onChange={handleChange}
            step="0.01"
            min="0"
          />
        </div>
        
        <div className="campo-formulario">
          <label className="rotulo">Tipo</label>
          <select 
            className="campo-select"
            name="tipo"
            value={dadosEditados.tipo}
            onChange={handleChange}
          >
            <option value="Meta">Meta</option>
            <option value="Investimento">Investimento</option>
          </select>
        </div>

        <div className="campo-formulario">
          <label className="rotulo">Prazo (meses)</label>
          <input 
            className="campo-input"
            type="number"
            name="prazoMeses"
            value={dadosEditados.prazoMeses}
            onChange={handleChange}
            min="1"
          />
        </div>

        <div className="botoes-modal">
          <Button onClick={onClose} className="botao-secundario">
            Cancelar
          </Button>
          <Button onClick={() => onSave(dadosEditados)}>
            Salvar Alterações
          </Button>
        </div>
      </div>
    </div>
  );
};

// Componente Principal
const MetasInvestimentos = () => {
  const navigate = useNavigate();
  const { etapas, etapaAtual } = useContext(ProgressoContext);
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [tipo, setTipo] = useState("Meta");
  const [prazoMeses, setPrazoMeses] = useState(1);
  const [itens, setItens] = useState(() => {
    // Carrega os itens do localStorage ao inicializar
    const itensSalvos = localStorage.getItem('itensMetas');
    return itensSalvos ? JSON.parse(itensSalvos) : [];
  });
  const [itemEditando, setItemEditando] = useState(null);
  const [indiceEditando, setIndiceEditando] = useState(null);

  // Atualiza o localStorage sempre que os itens mudam
  useEffect(() => {
    localStorage.setItem('itensMetas', JSON.stringify(itens));
  }, [itens]);

  const adicionarItem = () => {
    if (!descricao.trim()) {
      alert("Por favor, insira uma descrição");
      return;
    }
    
    const valorTotal = parseFloat(valor);
    if (isNaN(valorTotal) || valorTotal <= 0) {
      alert("Por favor, insira um valor válido maior que zero");
      return;
    }
    
    const prazoNumerico = parseInt(prazoMeses);
    if (isNaN(prazoNumerico) || prazoNumerico <= 0) {
      alert("Por favor, insira um prazo válido em meses");
      return;
    }

    const novoItem = { 
      id: Date.now(), // Adiciona um ID único
      descricao, 
      valorTotal, // Agora armazenamos o valor TOTAL
      tipo,
      prazoMeses: prazoNumerico,
      valorParcela: valorTotal / prazoNumerico, // Calcula a parcela
      isMeta: tipo === "Meta"
    };
    
    setItens([...itens, novoItem]);
    setDescricao("");
    setValor("");
    setTipo("Meta");
    setPrazoMeses(1);
  };


  const removerItem = (index) => {
    if (window.confirm("Tem certeza que deseja remover este item?")) {
      const novosItens = [...itens];
      novosItens.splice(index, 1);
      setItens(novosItens);
    }
  };

  const editarItem = (index) => {
    setItemEditando(itens[index]);
    setIndiceEditando(index);
  };

  const salvarEdicao = (dadosEditados) => {
    const valorTotal = parseFloat(dadosEditados.valor);
    const prazoNumerico = parseInt(dadosEditados.prazoMeses);

    const novosItens = [...itens].map((item, index) => {
      if (index === indiceEditando) {
        return {
          ...item, // Mantém todas as propriedades originais
          descricao: dadosEditados.descricao,
          valorTotal: valorTotal, // Atualiza o valor TOTAL
          tipo: dadosEditados.tipo,
          prazoMeses: prazoNumerico,
          valorParcela: valorTotal / prazoNumerico // Recalcula a parcela
        };
      }
      return item;
    });
    
    setItens(novosItens);
    setItemEditando(null);
    setIndiceEditando(null);
  };

  const avancarEtapa = () => {
    if (itens.length === 0) {
      alert("Adicione pelo menos uma meta ou investimento antes de avançar");
      return;
    }
    navigate('/projecao');
  };

  const voltarEtapa = () => {
    navigate('/gastos-fixos');
  };

  return (
    <div className="container-principal">
      <div className="cabecalho">
        <h1 className="titulo-app">Controla<span className="destaque-titulo">+</span></h1>
        <h2 className="subtitulo">Projeção</h2>
        <p className="texto-descritivo">
          Defina suas metas e investimentos para alcançar seus objetivos financeiros.
        </p>
      </div>

      <div className="barra-progresso">
        {etapas.map((etapa, index) => (
          <div key={index} className="etapa-container">
            <div 
              className={`marcador-etapa ${index === etapaAtual ? 'etapa-ativa' : 'etapa-inativa'}`}
            >
              {index + 1}
            </div>
            <span className={`rotulo-etapa ${index === etapaAtual ? 'rotulo-ativo' : 'rotulo-inativo'}`}>
              {etapa}
            </span>
          </div>
        ))}
      </div>

      <div className="formulario-container-metas">
        <h3 className="titulo-secao">Metas e Investimentos</h3>
        
        <div className="grupo-campos">
          <div className="campo-formulario">
            <label className="rotulo">Descrição</label>
            <input 
              className="campo-input"
              value={descricao} 
              onChange={(e) => setDescricao(e.target.value)} 
              placeholder="Ex: Viagem para Europa" 
            />
          </div>
          
          <div className="campo-formulario">
            <label className="rotulo">Valor Total (R$)</label>
            <input 
              className="campo-input"
              type="number" 
              value={valor} 
              onChange={(e) => setValor(e.target.value)} 
              placeholder="10000,00"
              step="0.01"
              min="0"
            />
          </div>
          
          <div className="campo-formulario">
            <label className="rotulo">Tipo</label>
            <select 
              className="campo-select"
              value={tipo} 
              onChange={(e) => setTipo(e.target.value)}
            >
              <option value="Meta">Meta</option>
              <option value="Investimento">Investimento</option>
            </select>
          </div>

          <div className="campo-formulario">
            <label className="rotulo">Prazo (meses)</label>
            <input 
              className="campo-input"
              type="number"
              value={prazoMeses}
              onChange={(e) => setPrazoMeses(e.target.value)}
              min="1"
            />
          </div>

          <button className="botao-adicionar" onClick={adicionarItem}>
            Adicionar
          </button>
        </div>

        {itens.length > 0 && (
          <div className="lista-container">
            <h4 className="titulo-lista">Lista de Metas e Investimentos</h4>
            <div className="itens-lista">
            {itens.map((item, index) => (
            <div key={index} className="item-lista">
              <div key={item.id || index} className="item-lista"> 
              <div>
                <p className="descricao-item">
                  {item.descricao} <span className={`badge-${item.tipo.toLowerCase()}`}>{item.tipo}</span>
                </p>
                <p className="detalhes-item">
                  <strong>Total:</strong> {formatarMoeda(item.valorTotal)}
                </p>
                <p className="detalhes-item">
                  <strong>Parcela mensal:</strong> {formatarMoeda(item.valorParcela)} • {item.prazoMeses} meses
                </p>
                </div>
              </div>
    <div className="botoes-acao">
      <button 
        className="botao-editar"
        onClick={() => editarItem(index)}
      >
        Editar
      </button>
      <button 
        className="botao-remover"
        onClick={() => removerItem(index)}
      >
        Remover
      </button>
    </div>
  </div>
))}
            </div>
          </div>
        )}

        <div className="controle-navegacao">
          <button 
            className="botao-voltar"
            onClick={voltarEtapa}
          >
            Voltar
          </button>
          <button 
            className="botao"
            onClick={avancarEtapa}
            disabled={itens.length === 0}
          >
            Avançar
          </button>
        </div>
      </div>

      {itemEditando && (
        <ModalEdicao
          item={itemEditando}
          onSave={salvarEdicao}
          onClose={() => {
            setItemEditando(null);
            setIndiceEditando(null);
          }}
        />
      )}
    </div>
  );
};

export default MetasInvestimentos;