// database.js (versão final)
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.resolve(__dirname, '../database.db');
const db = new sqlite3.Database(dbPath);

// Promisify db methods para usar async/await
db.allAsync = function (sql, params) {
  return new Promise((resolve, reject) => {
    this.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

db.runAsync = function (sql, params) {
  return new Promise((resolve, reject) => {
    this.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

const inicializarDB = async () => {
  try {
    await new Promise((resolve, reject) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS rendas (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          descricao TEXT NOT NULL,
          valor REAL NOT NULL,
          frequencia TEXT NOT NULL,
          mes_recebimento TEXT
        )`, (err) => {
        if (err) return reject(err);
        console.log("Tabela 'rendas' criada/verificada com sucesso!");
        resolve();
      });
    });

    await new Promise((resolve, reject) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS despesas (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          descricao TEXT NOT NULL,
          valor REAL NOT NULL,
          frequencia TEXT NOT NULL,
          mes_pagamento INTEGER
        )`, (err) => {
        if (err) return reject(err);
        console.log("Tabela 'despesas' criada/verificada com sucesso!");
        resolve();
      });
    });

    await new Promise((resolve, reject) => {
      db.run(`
        CREATE TABLE IF NOT EXISTS metas (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          descricao TEXT NOT NULL,
          valor_total REAL NOT NULL,
          tipo TEXT NOT NULL,
          prazo_meses INTEGER NOT NULL,
          valor_parcela REAL NOT NULL
        )`, (err) => {
        if (err) return reject(err);
        console.log("Tabela 'metas' criada/verificada com sucesso!");
        resolve();
      });
    });

    console.log("✅ Banco de dados inicializado com sucesso!");
  } catch (err) {
    console.error("❌ Erro ao inicializar o banco de dados:", err);
    throw err; // Propaga o erro para quem chamar
  }
};

// Remove a segunda criação de tabelas e exportação duplicada

module.exports = {
  db,
  inicializarDB
};