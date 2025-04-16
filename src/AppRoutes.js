// src/AppRoutes.js
import { Routes, Route } from 'react-router-dom';
import Renda from './componets/Renda/renda';
import GastosFixos from './componets/Gastos/gastos';
import MetasInvestimentos from './componets/Metas/metas';
import Projecao from './componets/Projecao/projecao';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Renda />} />
      <Route path="/renda" element={<Renda />} />
      <Route path="/gastos-fixos" element={<GastosFixos />} />
      <Route path="/metas-investimentos" element={<MetasInvestimentos />} />
      <Route path="/projecao" element={<Projecao />} />
    </Routes>
  );
}

export default AppRoutes;