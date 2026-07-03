import express from "express";
import cors from "cors";
import "dotenv/config";
import fs from "fs";
import path from "path";
import { clerkMiddleware } from "@clerk/express";

// Modüller, Veritabanı ve Cron
import User from "./models/User.js";
import { connectDB } from "./lib/db.js";
import job from "./lib/cron.js";

// Rotalar ve Webhook
import clerckWebhook from "./webhooks/clerk.webhook.js";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";

// Socket.io ve Express App entegrasyonu
import { app, server } from "./lib/socket.js";

const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL;
const publicDir = path.resolve(process.cwd(), "../frontend/dist");

// Webhook rotası clerkMiddleware'den ÖNCE gelmeli (Ham veri/raw body ihtiyacı için)
app.use("/api/webhooks/clerk", express.raw({ type: "application/json" }), clerckWebhook);

// Temel Middleware'ler
app.use(express.json());
app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(clerkMiddleware());

// Health Check
app.get("/health", (req, res) => {
  res.status(200).json({ message: "Server is healthy" });
});

// API Rotaları
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

// Catch-all rotası (Bilinmeyen tüm istekleri React index.html'e yönlendirir)
app.get(/(.*)/, (req, res, next) => {
  res.sendFile(path.join(publicDir, "index.html"), (err) => next(err));
});

// app.listen yerine server.listen kullanıyoruz!
server.listen(PORT, () => {
  connectDB();
  console.log("Server is up and running on port:", PORT);

  if (process.env.NODE_ENV === "production") {
    job.start();
  }
});