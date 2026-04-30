const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 5001;

app.use(cors());
app.use(express.json());

/* =========================
   JSON DB PATH
========================= */
const dbPath = path.join(__dirname, "data/db.json");

/* =========================
   DB HELPERS
========================= */
const readDB = () => {
  const data = fs.readFileSync(dbPath, "utf-8");
  return JSON.parse(data);
};

const writeDB = (data) => {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
};

/* =========================
   JWT SECRET
========================= */
const JWT_SECRET = "super_secret_key";

/* =========================
   AUTH MIDDLEWARE
========================= */
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "Token yok" });
  }

  const token = authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : authHeader;

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
  const { name, surname, department, birthDate, email, password } = req.body;

  const db = readDB();

  const userExists = db.users.find((u) => u.email === email);
  if (userExists) {
    return res.status(400).json({ message: "User already exists" });
  }

  const hashed = await bcrypt.hash(password, 10);

  const user = {
    id: Date.now(),
    name: name || null,
    surname: surname || null,
    department: department || null,
    birthDate: birthDate || null,
    email,
    password: hashed,
    extraInfo: "",
  };

  db.users.push(user);
  writeDB(db);

  res.json({ message: "User created" });
});

/* LOGIN */
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  const db = readDB();

  const user = db.users.find((u) => u.email === email);

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
   GET PROFILE (FIXED + SAFE)
========================= */
app.get("/api/auth/me", authMiddleware, (req, res) => {
  const db = readDB();

  const user = db.users.find(
    (u) => String(u.id) === String(req.user.id)
  );

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const { password, ...safeUser } = user;

  res.json(safeUser);
});

/* =========================
   UPDATE PROFILE (FULL FIXED)
========================= */
app.put("/api/auth/me", authMiddleware, (req, res) => {
  const db = readDB();

  const userIndex = db.users.findIndex(
    (u) => String(u.id) === String(req.user.id)
  );

  if (userIndex === -1) {
    return res.status(404).json({ message: "User not found" });
  }

  db.users[userIndex] = {
    ...db.users[userIndex],
    department:
      req.body.department ?? db.users[userIndex].department,
    extraInfo:
      req.body.extraInfo ?? db.users[userIndex].extraInfo,
  };

  writeDB(db);

  // 🔥 CRITICAL FIX: always re-read updated DB state
  const updatedUser = db.users[userIndex];
  const { password, ...safeUser } = updatedUser;

  res.json(safeUser);
});

/* =========================
   TASK ROUTES
========================= */

app.get("/api/tasks", authMiddleware, (req, res) => {
  const db = readDB();

  const userTasks = db.tasks.filter(
    (t) => t.userId === req.user.id
  );

  res.json(userTasks);
});

app.post("/api/tasks", authMiddleware, (req, res) => {
  const db = readDB();

  const task = {
    id: Date.now(),
    title: req.body.title,
    dueDate: req.body.dueDate || null,
    team: req.body.team || null,
    status: req.body.status || "todo",
    userId: req.user.id,
  };

  db.tasks.push(task);
  writeDB(db);

  res.json(task);
});

app.delete("/api/tasks/:id", authMiddleware, (req, res) => {
  const db = readDB();
  const id = Number(req.params.id);

  const exists = db.tasks.find(
    (t) => t.id === id && t.userId === req.user.id
  );

  if (!exists) {
    return res.status(404).json({ message: "Task bulunamadı" });
  }

  db.tasks = db.tasks.filter((t) => t.id !== id);
  writeDB(db);

  res.json({ message: "Task silindi", id });
});

app.put("/api/tasks/:id", authMiddleware, (req, res) => {
  const db = readDB();
  const id = Number(req.params.id);

  let updated = null;

  db.tasks = db.tasks.map((task) => {
    if (task.id === id && task.userId === req.user.id) {
      updated = {
        ...task,
        title: req.body.title,
        dueDate: req.body.dueDate ?? task.dueDate,
        team: req.body.team ?? task.team,
        status: req.body.status ?? task.status,
      };
      return updated;
    }
    return task;
  });

  if (!updated) {
    return res.status(404).json({ message: "Task bulunamadı" });
  }

  writeDB(db);

  res.json(updated);
});

/* =========================
   SERVER START
========================= */
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});