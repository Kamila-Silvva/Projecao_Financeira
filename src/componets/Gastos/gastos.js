import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProgressoContext } from '../Renda/ProgressoContext';
import '../styles/Global.css'

// Componentes UI
const Input = ({ ...props }) => (
  <input className="campo-input" {...props} />
);

const Button = ({ children, ...props }) => (
  <button
    className={`botao ${props.variant === 'destructive' ? 'botao-perigo' : 'botao-principal'} ${props.className || ''}`}
    {...props}
  >
    {children}
  </button>
);

const Label = ({ children, ...props }) => (
  <label className="rotulo" {...props}>
    {children}
  </label>
);

const Select = ({ children, ...props }) => (
  <select className="campo-select" {...props}>
    {children}
  </select>
);

const ModalEdicao = ({ item, onSave, onClose }) => {
  const [dadosEditados, setDadosEditados] = useState(item);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDadosEditados(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <h3>Editar Item</h3>
        
        <div className="campo-formulario">
          <Label>Descrição</Label>
          <Input 
            name="descricao"
            value={dadosEditados.descricao}
            onChange={handleChange}
          />
        </div>
        
        <div className="campo-formulario">
          <Label>Valor</Label>
          <Input 
            type="number"
            name="valor"
            value={dadosEditados.valor}
            onChange={handleChange}
            step="0.01"
            min="0"
          />
        </div>
        
        <div className="campo-formulario">
          <Label>Frequência</Label>
          <Select 
            name="frequencia"
            value={dadosEditados.frequencia}
            onChange={handleChange}
          >
            <option value="Mensal">Mensal</option>
            <option value="Trimestral">Trimestral</option>
            <option value="Semestral">Semestral</option>
            <option value="Anual">Anual</option>
            <option value="Único">Pagamento Único</option>
          </Select>
        </div>

        {dadosEditados.frequencia !== "Mensal" && (
          <div className="campo-formulario">
            <Label>Mês do Pagamento</Label>
            <Select
              name="mesPagamento"
              value={dadosEditados.mesPagamento}
              onChange={handleChange}
            >
              <option value="">Selecione</option>
              {[
                "Janeiro", "Fevereiro", "Março", "Abril", 
                "Maio", "Junho", "Julho", "Agosto",
                "Setembro", "Outubro", "Novembro", "Dezembro"
              ].map((mes, i) => (
                <option key={i} value={mes}>{mes}</option>
              ))}
            </Select>
          </div>
        )}

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

const GastosFixos = () => {
  const navigate = useNavigate();
  const { etapas, etapaAtual } = useContext(ProgressoContext);
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [frequencia, setFrequencia] = useState("Mensal");
  const [mesPagamento, setMesPagamento] = useState("");
  const [itens, setItens] = useState(() => {
    // Carrega os itens do localStorage ao inicializar
    const itensSalvos = localStorage.getItem('itensGastos');
    return itensSalvos ? JSON.parse(itensSalvos) : [];
  });
  const [itemEditando, setItemEditando] = useState(null);
  const [indiceEditando, setIndiceEditando] = useState(null);

  // Atualiza o localStorage sempre que os itens mudam
  useEffect(() => {
    localStorage.setItem('itensGastos', JSON.stringify(itens));
  }, [itens]);

  const adicionarItem = () => {
    if (!descricao.trim()) {
      alert("Por favor, insira uma descrição");
      return;
    }
    
    if (!valor || isNaN(valor)) {
      alert("Por favor, insira um valor válido");
      return;
    }
    
    if (frequencia !== "Mensal" && !mesPagamento) {
      alert("Por favor, selecione o mês de pagamento");
      return;
    }

    const novoItem = { 
      descricao, 
      valor: parseFloat(valor),
      frequencia,
      ...(frequencia !== "Mensal" && { mesPagamento })
    };
    
    setItens([...itens, novoItem]);
    setDescricao("");
    setValor("");
    setFrequencia("Mensal");
    setMesPagamento("");
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
    const novosItens = [...itens];
    novosItens[indiceEditando] = dadosEditados;
    setItens(novosItens);
    setItemEditando(null);
    setIndiceEditando(null);
  };

  const avancarEtapa = () => {
    if (itens.length === 0) {
      alert("Adicione pelo menos um gasto fixo antes de avançar");
      return;
    }
    navigate('/metas-investimentos');
  };

  const voltarEtapa = () => {
    navigate('/renda');
  };

  return (
    <div className="container-principal">
      {/* Cabeçalho */}
      <div className="cabecalho">
        <h1 className="titulo-app">Controla<span className="destaque-titulo">+</span></h1>
        <h2 className="subtitulo">Projeção</h2>
        <p className="texto-descritivo">
          Respire fundo. Organizar suas finanças é o primeiro passo para aliviar a compulsão.
        </p>
      </div>

      {/* Etapas */}
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

      {/* Formulário */}
      <div className="formulario-container">
        <h3 className="titulo-secao">Gastos Fixos</h3>
        
        <div className="grupo-campos">
          <div className="campo-formulario">
            <Label>Descrição</Label>
            <Input 
              value={descricao} 
              onChange={(e) => setDescricao(e.target.value)} 
              placeholder="Ex: Aluguel" 
            />
          </div>
          
          <div className="campo-formulario">
            <Label>Valor (R$)</Label>
            <Input 
              type="number" 
              value={valor} 
              onChange={(e) => setValor(e.target.value)} 
              placeholder="1000,00"
              step="0.01"
              min="0"
            />
          </div>
          
          <div className="campo-formulario">
            <Label>Frequência</Label>
            <Select 
              value={frequencia} 
              onChange={(e) => setFrequencia(e.target.value)}
            >
              <option value="Mensal">Mensal</option>
              <option value="Trimestral">Trimestral</option>
              <option value="Semestral">Semestral</option>
              <option value="Anual">Anual</option>
              <option value="Único">Pagamento Único</option>
            </Select>
          </div>

          {frequencia !== "Mensal" && (
            <div className="campo-formulario">
              <Label>Mês do Pagamento</Label>
              <Select
                value={mesPagamento}
                onChange={(e) => setMesPagamento(e.target.value)}
              >
                <option value="">Selecione</option>
                {[
                  "Janeiro", "Fevereiro", "Março", "Abril", 
                  "Maio", "Junho", "Julho", "Agosto",
                  "Setembro", "Outubro", "Novembro", "Dezembro"
                ].map((mes, i) => (
                  <option key={i} value={mes}>{mes}</option>
                ))}
              </Select>
            </div>
          )}

          <Button onClick={adicionarItem} className="botao-adicionar">
            Adicionar
          </Button>
        </div>

        {/* Lista de itens */}
        {itens.length > 0 && (
          <div className="lista-container">
            <h4 className="titulo-lista">Lista de Gastos Fixos</h4>
            <div className="itens-lista">
              {itens.map((item, index) => (
                <div key={index} className="item-lista">
                  <div>
                    <p className="descricao-item">{item.descricao}</p>
                    <p className="detalhes-item">
                      {new Intl.NumberFormat('pt-BR', { 
                        style: 'currency', 
                        currency: 'BRL' 
                      }).format(item.valor)} • {item.frequencia}
                      {item.mesPagamento && ` • ${item.mesPagamento}`}
                    </p>
                  </div>
                  <div className="botoes-acao">
                    <Button 
                      onClick={() => editarItem(index)}
                      className="botao-editar"
                    >
                      Editar
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={() => removerItem(index)}
                      className="botao-remover"
                    >
                      Remover
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Controles de navegação */}
        <div className="controle-navegacao">
          <Button 
            onClick={voltarEtapa}
            className="botao-voltar"
          >
            Voltar
          </Button>
          <Button 
            onClick={avancarEtapa}
            className="botao"
            disabled={itens.length === 0}
          >
            Avançar
          </Button>
        </div>
      </div>

      {/* Modal de Edição */}
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



export default GastosFixos;