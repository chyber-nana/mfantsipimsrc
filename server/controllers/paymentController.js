const axios = require("axios");
const crypto = require("crypto");
const db = require("../config/db");

function generateReference() {
  return `bulk_vote_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
}

// Helper function to handle the database updates for all nominees in a bulk order
const processSuccessfulPayment = (paymentRow) => {
  const votesDetail = JSON.parse(paymentRow.metadata); 

  db.serialize(() => {
    db.run("UPDATE payments SET status = 'paid' WHERE reference = ?", [paymentRow.reference]);

    votesDetail.forEach((vote) => {
      // DEBUG: See what is being sent to the database
      console.log("Processing vote:", vote); 

      // If nominee_id is undefined, this will fail
      const nomineeId = parseInt(vote.nominee_id || vote.id); // Try both keys
      
      if (!nomineeId) {
        console.error("CRITICAL: Nominee ID missing for vote:", vote);
        return; // Skip this one to prevent the crash
      }

      const votesCount = parseInt(vote.nomineeVotes);
      const amountForThisNominee = votesCount * 1;

db.run(
  `INSERT INTO votes (
    nominee_id,
    nominee_name,
    voter_name,
    voter_class,
    votes_count,
    amount_paid,
    momo_trans_id,
    status
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  [
    nomineeId,
    vote.nomineeName || "",
    paymentRow.voter_name || "Anonymous",
    paymentRow.voter_class || "N/A",
    votesCount,
    amountForThisNominee,
    paymentRow.reference,   // use payment reference as transaction id
    "pending"
  ]
);

    });
  });
};

const initializePayment = async (req, res) => {
  const { votes, voter_name, voter_class } = req.body; // 'votes' is now an array

  if (!votes || !Array.isArray(votes) || votes.length === 0) {
    return res.status(400).json({ error: "A list of votes is required" });
  }

  // Calculate total across all selections
  const totalVotesCount = votes.reduce((sum, v) => sum + Number(v.nomineeVotes), 0);
  const totalAmountPaid = totalVotesCount * 1; 
  const amountInPesewas = Math.round(totalAmountPaid * 100);
  const reference = generateReference();
  const votesMetadata = JSON.stringify(votes); // Stringify the array for SQLite

  try {
    // Note: Ensure your 'payments' table has a 'metadata' column (TEXT)
    db.run(
      `INSERT INTO payments (reference, votes_count, amount_paid, voter_name, voter_class, status, metadata)
       VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
      [reference, totalVotesCount, totalAmountPaid, voter_name || "", voter_class || "", votesMetadata],
      async function (err) {
        if (err) return res.status(500).json({ error: err.message });

        try {
          const response = await axios.post(
            "https://api.paystack.co/transaction/initialize",
            {
              email: "votes@yourdomain.com",
              amount: amountInPesewas,
              reference,
              callback_url: process.env.PAYSTACK_CALLBACK_URL,
              metadata: { votes, voter_name, voter_class } // Send to Paystack for backup
            },
            {
              headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                "Content-Type": "application/json"
              }
            }
          );

          return res.json({ authorization_url: response.data.data.authorization_url, reference });
        } catch (apiError) {
          return res.status(500).json({ error: apiError.response?.data || apiError.message });
        }
      }
    );
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const verifyPayment = async (req, res) => {
  const { reference } = req.params;

  try {
    const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
    });

    const tx = response.data.data;
    if (tx.status !== "success") return res.json({ status: tx.status });

    db.get("SELECT * FROM payments WHERE reference = ?", [reference], (err, paymentRow) => {
      if (err || !paymentRow) return res.status(404).json({ error: "Record not found" });
      if (paymentRow.status === "paid") return res.json({ status: "success", message: "Already processed" });

      processSuccessfulPayment(paymentRow);
      return res.json({ status: "success", message: "Bulk votes added!" });
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const paystackWebhook = (req, res) => {
  const hash = crypto.createHmac("sha512", process.env.PAYSTACK_SECRET_KEY).update(req.body).digest("hex");
  if (hash !== req.headers["x-paystack-signature"]) return res.status(401).send("Invalid signature");

  const event = JSON.parse(req.body.toString());
  if (event.event === "charge.success") {
    const reference = event.data.reference;

    db.get("SELECT * FROM payments WHERE reference = ?", [reference], (err, paymentRow) => {
      if (!err && paymentRow && paymentRow.status !== "paid") {
        processSuccessfulPayment(paymentRow);
      }
    });
  }
  return res.sendStatus(200);
};

const getPaymentSummary = (req, res) => {
  const { reference } = req.params;
  db.get("SELECT metadata FROM payments WHERE reference = ?", [reference], (err, row) => {
    if (err || !row) return res.status(404).json({ error: "Not found" });
    res.json({ votes: JSON.parse(row.metadata) });
  });
};
// Add this to module.exports and your router

module.exports = { initializePayment, verifyPayment, paystackWebhook, getPaymentSummary };