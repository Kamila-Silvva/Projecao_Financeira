const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { db, inicializarDB } = require('./config/database');
const { errorHandler } = require('./middlewares/validacao'); // Importe o errorHandler

// Importe as rotas
const gastoRoutes = require('./routes/gastoRoutes');
const rendaRoutes = require('./routes/rendaRoutes');
const metaRoutes = require('./routes/metaRoutes');
const projecaoRoutes = require('./routes/projecaoRoutes');

const app = express();

// Configuração básica de segurança
app.disable('x-powered-by');

// Middlewares
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*', // Configurável por variável de ambiente
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json({ limit: '10kb' })); // Limite de tamanho do payload

// Rota de saúde melhorada
app.get('/health', (req, res) => {
  const dbStatus = db.open ? 'connected' : 'disconnected';
  res.status(200).json({ 
    status: 'healthy',
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

// Inicialização assíncrona do servidor
async function initializeApp() {
  try {
    // Limpar e recriar as tabelas (apenas para desenvolvimento/testes)
    if (process.env.NODE_ENV !== 'production') {
      try {
        await db.run('DROP TABLE IF EXISTS rendas');
        await db.run('DROP TABLE IF EXISTS despesas');
        await db.run('DROP TABLE IF EXISTS metas');
        console.log('⚠️  Tabelas antigas removidas (modo não-produção)');
      } catch (dropError) {
        console.warn('Aviso: Erro ao limpar tabelas', dropError.message);
      }
    }

    // Inicializar o banco de dados
    await inicializarDB();
    console.log('✅ Banco de dados inicializado com sucesso');

    // Configurar rotas (após o banco estar pronto)
    app.use('/gastos', gastoRoutes);
    app.use('/rendas', rendaRoutes);
    app.use('/metas', metaRoutes);
    app.use('/projecao', projecaoRoutes);

    // Rota raiz com informações úteis
    app.get('/', (req, res) => {
      res.send(`
        <h1>API Financeira</h1>
        <p>Versão: 1.0.0</p>
        <p>Ambiente: ${process.env.NODE_ENV || 'development'}</p>
        <p>Rotas disponíveis:</p>
        <ul>
          <li><a href="/rendas">/rendas</a> (GET/POST/PUT/DELETE)</li>
          <li><a href="/gastos">/gastos</a> (GET/POST/PUT/DELETE)</li>
          <li><a href="/metas">/metas</a> (GET/POST/PUT/DELETE)</li>
          <li><a href="/projecao">/projecao</a> (GET)</li>
          <li><a href="/health">/health</a> (GET - Health Check)</li>
        </ul>
        <p>Documentação: <a href="/api-docs">/api-docs</a></p>
      `);
    });

    // Middleware para rotas não encontradas
    app.use((req, res, next) => {
      res.status(404).json({
        success: false,
        message: 'Rota não encontrada'
      });
    });

    // Middleware de erro global
    app.use(errorHandler);

    // Inicia o servidor
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
      console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
    });

  } catch (error) {
    console.error('❌ Falha crítica ao inicializar a aplicação:', error);
    process.exit(1);
  }
}

// Tratamento de sinais do sistema
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully');
  db.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully');
  db.close();
  process.exit(0);
});

// Inicializa a aplicação
initializeApp();