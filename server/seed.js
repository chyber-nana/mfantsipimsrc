const db = require("./config/db");

console.log("Resetting votes and total money...");

db.serialize(() => {

  db.run(`
    UPDATE nominees
    SET votes = 0,
        amount_made = 0
  `, (err) => {

    if (err) {
      console.error("Error resetting nominees:", err.message);
      process.exit(1);
    }

    console.log("Nominee votes and amounts reset.");

  });

  db.run(`DELETE FROM votes`, (err) => {

    if (err) {
      console.error("Error deleting votes:", err.message);
      process.exit(1);
    }

    console.log("Votes table cleared.");

    console.log("Database reset complete.");
    process.exit(0);

  });

});


// const db = require("./config/db");

// // Use db.serialize to ensure commands run in order
// db.serialize(() => {
//   // 1. Drop the table
//   db.run("DROP TABLE IF EXISTS payments");

//   // 2. Create the table
//   db.run(`
//     CREATE TABLE payments (
//       id INTEGER PRIMARY KEY AUTOINCREMENT,
//       reference TEXT UNIQUE NOT NULL,
//       votes_count INTEGER NOT NULL,
//       amount_paid REAL NOT NULL,
//       voter_name TEXT,
//       voter_class TEXT,
//       status TEXT NOT NULL DEFAULT 'pending',
//       metadata TEXT,
//       created_at DATETIME DEFAULT CURRENT_TIMESTAMP
//     )
//   `, (err) => {
//     if (err) {
//       console.error("Error creating table:", err.message);
//     } else {
//       console.log("Payments table recreated successfully with metadata support!");
//     }
//     process.exit();
//   });
// });

// Add to your migrate.js
// db.run(`
//   CREATE TABLE IF NOT EXISTS votes (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     nominee_id INTEGER NOT NULL,
//     voter_name TEXT,
//     voter_class TEXT,
//     votes_count INTEGER,
//     amount_paid REAL
//   )
// `);

// const sqlite3 = require('sqlite3').verbose();
// const db = new sqlite3.Database('./voting.db');

// db.run("ALTER TABLE votes ADD COLUMN status TEXT DEFAULT 'pending'", (err) => {
//     if (err) console.log("Error (column might already exist):", err.message);
//     else console.log("Successfully added 'status' column!");
// });

// const sqlite3 = require('sqlite3').verbose();
// const db = new sqlite3.Database('./voting.db');

// db.serialize(() => {
//     console.log("🛠️ Synchronizing database schema...");

//     const columnsToAdd = [
//         "ALTER TABLE votes ADD COLUMN voter_phone TEXT",
//         "ALTER TABLE votes ADD COLUMN nominee_name TEXT",
//         "ALTER TABLE votes ADD COLUMN momo_trans_id TEXT"
//     ];

//     columnsToAdd.forEach(query => {
//         db.run(query, (err) => {
//             if (err) console.log(`⚠️ Note: ${err.message.split(':').pop().trim()}`);
//             else console.log(`✅ Column added successfully.`);
//         });
//     });

//     console.log("🚀 Sync complete. Restart your server now.");
// });

// const bcrypt = require('bcrypt');
// bcrypt.hash("{@b0tw3SRC}", 10).then(console.log)