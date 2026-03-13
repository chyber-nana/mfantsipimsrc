const db = require("../config/db");

const getCategories = (req, res) => {
  db.all("SELECT * FROM categories ORDER BY id ASC", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
};

const createCategory = (req, res) => {
  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Category name is required" });
  }

  db.run(
    "INSERT INTO categories (name) VALUES (?)",
    [name.trim()],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.status(201).json({
        id: this.lastID,
        name: name.trim()
      });
    }
  );
};

const updateCategory = (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  db.run(
    "UPDATE categories SET name = ? WHERE id = ?",
    [name.trim(), id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json({ message: "Category updated successfully" });
    }
  );
};

const deleteCategory = (req, res) => {
  const { id } = req.params;

  db.run("DELETE FROM categories WHERE id = ?", [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.json({ message: "Category deleted successfully" });
  });
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
};