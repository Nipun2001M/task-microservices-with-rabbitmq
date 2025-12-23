# Task Microservices with RabbitMQ

A simple microservices project using **Task Service**, **User Service**, and **Notification Service** connected via **RabbitMQ**. Each service runs in its own Docker container and communicates asynchronously using RabbitMQ queues.

---

## Services

- **User Service** – manages users.  
- **Task Service** – manages tasks and publishes events to RabbitMQ.  
- **Notification Service** – listens for task events and logs notifications.

---

## Environment Variables

Create a `.env` file in each service folder based on `.env.example`:

```env
# User Service
MONGO_URI=mongodb://mongo:27017/usersdatabase

# Task Service
MONGO_URI=mongodb://mongo:27017/tasksdatabase

# RabbitMQ (for Task & Notification Services)
RABBITMQ_URL=amqp://rabbitmq
