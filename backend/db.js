const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'seu_usuario_mysql',
  password: 'sua_senha_mysql',
  database: 'nome_do_seu_banco'
});

db.connect((err) => {
  if (err) {
    console.error('Erro ao conectar no banco:', err);
    return;
  }
  console.log('Conectado ao banco de dados MySQL!');
});

module.exports = db;
