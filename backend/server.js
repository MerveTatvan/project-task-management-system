const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const app = express();
const PORT = 5001;

app.use(cors());
app.use(express.json());

/* =========================
   MEMORY DB
========================= */
let tasks = [];
let users = [];

/* =========================
   JWT SECRET
========================= */
const JWT_SECRET = "super_secret_key";

/* =========================
   AUTH MIDDLEWARE
========================= */
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ message: "Token yok" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Geçersiz token" });
  }
};

/* =========================
   AUTH ROUTES
========================= */

/* REGISTER */
app.post("/api/auth/register", async (req, res) => {
  const { email, password } = req.body;

  const userExists = users.find((u) => u.email === email);
  if (userExists) {
    return res.status(400).json({ message: "User already exists" });
  }

  const hashed = await bcrypt.hash(password, 10);

  const user = {
    id: Date.now(),
    email,
    password: hashed,
  };

  users.push(user);

  res.json({ message: "User created" });
});

/* LOGIN */
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  const user = users.find((u) => u.email === email);

  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  const isValid = await bcrypt.compare(password, user.password);

  if (!isValid) {
    return res.status(400).json({ message: "Wrong password" });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  res.json({ token });
});

/* =========================
   TASK ROUTES (PROTECTED)
========================= */

/* GET TASKS (SADECE USER'A AİT) */
app.get("/api/tasks", authMiddleware, (req, res) => {
  const userTasks = tasks.filter(t => t.userId === req.user.id);
  res.json(userTasks);
});

/* CREATE TASK */
app.post("/api/tasks", authMiddleware, (req, res) => {
  const task = {
    id: Date.now(),
    title: req.body.title,
    dueDate: req.body.dueDate || null,
    team: req.body.team || null,
    status: req.body.status || "todo", // ✅ KANBAN
    userId: req.user.id,
  };

  tasks.push(task);
  res.json(task);
});

/* DELETE TASK */
app.delete("/api/tasks/:id", authMiddleware, (req, res) => {
  const id = Number(req.params.id);

  const exists = tasks.find(t => t.id === id && t.userId === req.user.id);

  if (!exists) {
    return res.status(404).json({ message: "Task bulunamadı" });
  }

  tasks = tasks.filter(t => t.id !== id);

  res.json({ message: "Task silindi", id });
});

/* UPDATE TASK */
app.put("/api/tasks/:id", authMiddleware, (req, res) => {
  const id = Number(req.params.id);

  let updated = null;

  tasks = tasks.map(task => {
    if (task.id === id && task.userId === req.user.id) {
      updated = {
        ...task,
        title: req.body.title,
        dueDate: req.body.dueDate ?? task.dueDate,
        team: req.body.team ?? task.team,
        status: req.body.status ?? task.status, // ✅ KANBAN
      };
      return updated;
    }
    return task;
  });

  if (!updated) {
    return res.status(404).json({ message: "Task bulunamadı" });
  }

  res.json(updated);
});

/* =========================
   SERVER START
========================= */
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});