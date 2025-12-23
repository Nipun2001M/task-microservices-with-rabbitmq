require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const amqp = require("amqplib");

const app = express();

app.use(bodyParser.json());


let channel, connection;

async function start() {
  try {
    console.log(
      `Attempting to connect to RabbitMQ... (${retries} retries left)`
    );
    connection = await amqp.connect("amqp://rabbitmq");
    channel = await connection.createChannel();
    await channel.assertQueue("task_created");
    console.log("Notification Service is Listning to mesages");
    channel.consume("task_created", (msg) => {
      const taskData = JSON.parse(msg.content.toString());
      console.log("Notification : NEW Task : ", taskData.title);
      console.log("Notification : NEW Task : ", taskData);
      channel.ack(msg)
    });

    return;
  } catch (error) {
    console.error("RabbitMQ connection failed:", error.message);
   
  }
}

start()
