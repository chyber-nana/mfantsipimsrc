const db = require('../config/db');

// Fetch all pending
const getQueue = (req, res) => {
  const query = `
    SELECT v.*, n.name AS nominee_name
    FROM votes v
    LEFT JOIN nominees n ON v.nominee_id = n.id
    WHERE v.status = 'pending'
    ORDER BY v.id DESC
  `;

  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
};

// Fetch admin stats
const getStats = (req, res) => {
  const pendingQuery = `
    SELECT COUNT(*) AS pendingCount
    FROM votes
    WHERE status = 'pending'
  `;

  const revenueQuery = `
    SELECT COALESCE(SUM(amount_paid), 0) AS revenue
    FROM votes
    WHERE status = 'approved'
  `;

  db.get(pendingQuery, [], (err, pendingRow) => {
    if (err) return res.status(500).json({ error: err.message });

    db.get(revenueQuery, [], (err, revenueRow) => {
      if (err) return res.status(500).json({ error: err.message });

      res.json({
        pendingCount: pendingRow.pendingCount,
        revenue: revenueRow.revenue
      });
    });
  });
};

// Verify action
const verifyVote = (req, res) => {
  const { id, status } = req.body;

  if (status === "rejected") {
    db.run("UPDATE votes SET status = 'rejected' WHERE id = ?", [id], function (err) {
      if (err) return res.status(500).send("Database error");
      res.json({ success: true, message: "Vote rejected" });
    });
  } else {
    db.get(
      "SELECT nominee_id, votes_count, amount_paid FROM votes WHERE id = ?",
      [id],
      (err, row) => {
        if (err) return res.status(500).send("Database error");
        if (!row) return res.status(404).send("Record not found");

        db.run("UPDATE votes SET status = 'approved' WHERE id = ?", [id], function (err) {
          if (err) return res.status(500).send("Database error");

          db.run(
            "UPDATE nominees SET votes = votes + ?, amount_made = amount_made + ? WHERE id = ?",
            [row.votes_count, row.amount_paid, row.nominee_id],
            function (err) {
              if (err) return res.status(500).send("Database error");
              res.json({ success: true, message: "Vote approved and added!" });
            }
          );
        });
      }
    );
  }
};

module.exports = { getQueue, getStats, verifyVote };