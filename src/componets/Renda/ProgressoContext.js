import { createContext, useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

export const ProgressoContext = createContext();

export const ProgressoProvider = ({ children }) => {
  const etapas = ['Renda', 'Gastos Fixos', 'Metas e Investimentos', 'Projeção'];
  const location = useLocation();
  
  // Usando useCallback para memoizar a função
  const getEtapaAtual = useCallback(() => {
    switch(location.pathname) {
      case '/':
      case '/renda':
        return 0;
      case '/gastos-fixos':
        return 1;
      case '/metas-investimentos':
        return 2;
      case '/projecao':
        return 3;
      default:
        return 0;
    }
  }, [location.pathname]); // Dependência da função

  const [etapaAtual, setEtapaAtual] = useState(getEtapaAtual());

  useEffect(() => {
    setEtapaAtual(getEtapaAtual());
  }, [getEtapaAtual]); // Agora incluímos getEtapaAtual como dependência

  return (
    <ProgressoContext.Provider value={{ etapas, etapaAtual }}>
      {children}
    </ProgressoContext.Provider>
  );
};