import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import fs from "fs";
import { createServer } from "http";
import path from "path";
import { Server } from "socket.io";
import { query } from "./src/config/db";
import { createMessage } from "./src/models/messageModel";
import authRoutes from "./src/routes/authRoutes";
import messageRoutes from "./src/routes/messageRoutes";
import userRoutes from "./src/routes/userRoutes";

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/messages", messageRoutes);

// Helper to check DB connection and init schema
let isDbInitialized = false;
const initDb = async () => {
  if (isDbInitialized) return;
  try {
    // Vercel might have different pathing for bundled files
    const schemaPath = path.resolve(process.cwd(), "src", "db", "schema.sql");
    console.log("Attempting to load schema from:", schemaPath);

    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, "utf8");
      await query(schemaSql);
      console.log("Database schema initialized.");
      isDbInitialized = true;
    } else {
      console.warn(
        "Schema file not found at:",
        schemaPath,
        ". Skipping initialization (assuming DB is already set up)."
      );
    }
  } catch (err) {
    console.error("Failed to initialize database schema:", err);
    // Don't exit process in serverless!
  }
};

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("Chat Server is running (DostChats)");
});

// Middleware to ensure DB is initialized on first request for serverless
app.use(async (req, res, next) => {
  if (!isDbInitialized && process.env.VERCEL) {
    await initDb();
  }
  next();
});

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("join_room", (room) => {
    socket.join(room);
    console.log(`User ${socket.id} joined room ${room}`);
  });

  socket.on("send_message", async (data) => {
    const { senderId, receiverId, content } = data;
    try {
      const savedMessage = await createMessage(senderId, receiverId, content);
      const room = [senderId, receiverId].sort((a, b) => a - b).join("-");
      io.to(room).emit("receive_message", savedMessage);
    } catch (err) {
      console.error("Error saving message:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Only start the server if we're not running as a Vercel serverless function
if (!process.env.VERCEL) {
  initDb().then(() => {
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  });
}

export default app;
