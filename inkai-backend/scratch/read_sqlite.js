const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('d:/website/inkai/inkai-backend/prisma/dev.db');

db.serialize(() => {
  db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
    if (err) {
      console.error('Error listing tables:', err.message);
      return;
    }
    console.log('Tables in dev.db:', tables.map(t => t.name).join(', '));
    
    if (tables.some(t => t.name === 'Dojo')) {
      db.all("SELECT count(*) as count FROM Dojo", (err, rows) => {
        console.log('Dojos in SQLite:', rows[0].count);
      });
      db.all("SELECT name FROM Dojo LIMIT 5", (err, rows) => {
        console.log('Sample Dojos in SQLite:', rows.map(r => r.name));
      });
    }

    if (tables.some(t => t.name === 'Branch')) {
        db.all("SELECT count(*) as count FROM Branch", (err, rows) => {
          console.log('Branches in SQLite:', rows[0].count);
        });
        db.all("SELECT name FROM Branch", (err, rows) => {
          console.log('Branches in SQLite:', rows.map(r => r.name));
        });
      }
  });
});
