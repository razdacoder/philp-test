import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";
import { farmer_db } from "./db/index.js";
import { farmersTable } from "./db/schema.js";

export const queue = new Queue("farmers-queue");

const connection = new IORedis({ maxRetriesPerRequest: null });

export const worker = new Worker(
  "farmers-queue",
  async (job) => {
    const { name, age, email } = job.data;
    await farmer_db.insert(farmersTable).values({
      name,
      age,
      email,
    });
  },
  { connection }
);
