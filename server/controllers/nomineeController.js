const db = require("../config/db");

const getNomineesByCategory = (req, res) => {
  const { categoryId } = req.params;

  db.all(
    "SELECT * FROM nominees WHERE category_id = ? ORDER BY votes DESC",
    [categoryId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
};

const createNominee = (req, res) => {
  const { name, category_id } = req.body;

  if (!name || !category_id) {
    return res.status(400).json({ error: "Name and category_id are required" });
  }

  db.run(
    "INSERT INTO nominees (name, category_id) VALUES (?, ?)",
    [name.trim(), category_id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.status(201).json({
        id: this.lastID,
        name: name.trim(),
        category_id
      });
    }
  );
};

const updateNominee = (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  db.run(
    "UPDATE nominees SET name = ? WHERE id = ?",
    [name.trim(), id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json({ message: "Nominee updated successfully" });
    }
  );
};

const deleteNominee = (req, res) => {
  const { id } = req.params;

  db.run("DELETE FROM nominees WHERE id = ?", [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json({ message: "Nominee deleted successfully" });
  });
};

module.exports = {
  getNomineesByCategory,
  createNominee,
  updateNominee,
  deleteNominee
};