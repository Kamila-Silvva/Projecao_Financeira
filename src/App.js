import { BrowserRouter as Router } from 'react-router-dom';
import { ProgressoProvider } from './componets/Renda/ProgressoContext';
import AppRoutes from './AppRoutes';

function App() {
  return (
    <Router>
      <ProgressoProvider>
        <AppRoutes />
      </ProgressoProvider>
    </Router>
  );
}

export default App;