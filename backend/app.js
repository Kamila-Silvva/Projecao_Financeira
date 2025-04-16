const express = require('express');
const app = express();
const projecaoRoutes = require('./routes/projecao'); // importa as rotas que eu criei

app.use(express.json());

app.use('/api', projecaoRoutes);

app.listen(3000, () => {
  console.log('Servidor backend rodando em http://localhost:3000');
});
