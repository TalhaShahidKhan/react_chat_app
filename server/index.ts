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
const initDb = async () => {
  try {
    const schemaPath = path.join(__dirname, "src", "db", "schema.sql");
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, "utf8");
      await query(schemaSql);
      console.log("Database schema initialized.");
    } else {
      console.error("Schema file not found at:", schemaPath);
    }
  } catch (err) {
    console.error("Failed to initialize database schema:", err);
    process.exit(1);
  }
};

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("Chat Server is running");
});

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("join_room", (room) => {
    socket.join(room);
    console.log(`User ${socket.id} joined room ${room}`);
  });

  socket.on("send_message", async (data) => {
    // data: { senderId, receiverId, content }
    const { senderId, receiverId, content } = data;
    try {
      const savedMessage = await createMessage(senderId, receiverId, content);

      // Emit to both sender and receiver rooms directly or a shared room
      // For this simple app, we can emit to a room ID that is specific to the pair
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

initDb().then(() => {
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});

export default app;
