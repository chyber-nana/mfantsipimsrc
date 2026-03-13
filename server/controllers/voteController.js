const db = require("../config/db");

const submitVote = (req, res) => {
  const { votes, transId, voter_phone } = req.body;

  if (!votes || !Array.isArray(votes) || votes.length === 0) {
    return res.status(400).json({ error: "No valid votes provided." });
  }

  for (const v of votes) {
    if (!v.nominee_id) {
      return res.status(400).json({
        error: "nominee_id is required for all votes."
      });
    }
  }

  const stmt = db.prepare(`
    INSERT INTO votes (
      voter_phone,
      nominee_id,
      nominee_name,
      votes_count,
      amount_paid,
      momo_trans_id,
      status
    ) VALUES (?, ?, ?, ?, ?, ?, 'pending')
  `);

  try {
    votes.forEach((vote) => {
      stmt.run(
        voter_phone || "Unknown",
        vote.nominee_id,
        vote.nomineeName,      // fixed
        vote.nomineeVotes,     // fixed
        vote.amount_paid,      // fixed
        transId
      );
    });

    stmt.finalize((err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Database failure" });
      }

      res.json({ success: true });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database failure" });
  }
};

module.exports = { submitVote };