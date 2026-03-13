const db = require("../config/db");

const getDashboardStats = (req, res) => {
  const response = {
    categories: [],
    totalMoney: 0
  };

  db.all("SELECT * FROM categories ORDER BY id ASC", [], (err, categories) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!categories.length) {
      return res.json(response);
    }

    let remaining = categories.length;
    response.categories = new Array(categories.length);

    categories.forEach((category, index) => {
      db.all(
        `SELECT id, name, votes, amount_made
         FROM nominees
         WHERE category_id = ?
         ORDER BY id ASC`,
        [category.id],
        (err2, nominees) => {
          if (err2) {
            return res.status(500).json({ error: err2.message });
          }

          const formattedNominees = nominees.map((n) => ({
            id: n.id,
            name: n.name,
            votes: n.votes,
            amount: `GH₵ ${Number(n.amount_made).toFixed(2)}`
          }));

          response.categories[index] = {
            id: category.id,
            name: category.name,
            nominees: formattedNominees
          };

          remaining--;

          if (remaining === 0) {
            db.get(
              `SELECT IFNULL(SUM(amount_paid), 0) as total
               FROM votes`,
              [],
              (err3, row) => {
                if (err3) {
                  return res.status(500).json({ error: err3.message });
                }

                response.totalMoney = row.total;
                res.json(response);
              }
            );
          }
        }
      );
    });
  });
};

module.exports = { getDashboardStats };