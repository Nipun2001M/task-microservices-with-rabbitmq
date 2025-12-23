require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const amqp = require("amqplib");

const app = express();
const port = 8001;

app.use(bodyParser.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected To MongoDB Atlas Successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));

const TaskSchema = new mongoose.Schema({
  title: String,
  description: String,
  userId: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Task = mongoose.model("Task", TaskSchema);

let channel, connection;

async function connectRabbitMQWithRetry(retries = 10, delay = 5000) {
  while (retries > 0) {
    try {
      console.log(
        `Attempting to connect to RabbitMQ... (${retries} retries left)`
      );
      connection = await amqp.connect("amqp://rabbitmq");
      channel = await connection.createChannel();
      await channel.assertQueue("task_created");

      console.log("✓ Successfully connected to RabbitMQ");

      connection.on("error", (err) => {
        console.error("RabbitMQ connection error:", err.message);
      });

      connection.on("close", () => {
        console.error("RabbitMQ connection closed. Reconnecting...");
        channel = null;
        connection = null;
        setTimeout(() => connectRabbitMQWithRetry(), delay);
      });

      return;
    } catch (error) {
      console.error("RabbitMQ connection failed:", error.message);
      retries--;
      if (retries > 0) {
        console.log(
          `Retrying in ${delay / 1000} seconds... (${retries} retries left)`
        );
        await new Promise((res) => setTimeout(res, delay));
      }
    }
  }
  console.error("❌ Failed to connect to RabbitMQ after all retries");
}

app.post("/tasks", async (req, res) => {
  const { title, description, userId } = req.body;
  try {
    const task = new Task({ title, description, userId });
    await task.save();

    const message = { taskId: task._id, userId, title };

    if (!channel) {
      console.error("Cannot publish message: RabbitMQ channel not available");
      return res.status(503).json({ error: "RabbitMQ not Connected" });
    }

    channel.sendToQueue("task_created", Buffer.from(JSON.stringify(message)));
    console.log("✓ Message published to RabbitMQ:", message);

    res.status(201).json(task);
  } catch (error) {
    console.error("Error Saving Task:", error);
    res.status(500).json({ error: "Internal server Error" });
  }
});

app.get("/tasks", async (req, res) => {
  try {
    const tasks = await Task.find();
    res.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ error: "Internal server Error" });
  }
});

app.listen(port, () => {
  console.log(`Task Service listening on port ${port}`);
  connectRabbitMQWithRetry().catch((err) => {
    console.error("Fatal: Could not connect to RabbitMQ:", err);
  });
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down gracefully...");
  if (channel) await channel.close();
  if (connection) await connection.close();
  await mongoose.connection.close();
  process.exit(0);
});
