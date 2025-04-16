const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'Hadasia.silva',
  password: '',
  database: 'Controla+'
});

db.connect((err) => {
  if (err) {
    console.error('Erro ao conectar no banco:', err);
    return;
  }
  console.log('Conectado ao banco de dados MySQL!');
});

module.exports = db;
