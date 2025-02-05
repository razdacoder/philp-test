import { serve } from "@hono/node-server";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { queue, worker } from "./queue.js";
import type { Job } from "bullmq";
import { farmer_db } from "./db/index.js";
import { farmersTable } from "./db/schema.js";

const app = new Hono();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});


app.get("/farmers", async (c) => {
  const farmers = await farmer_db.select().from(farmersTable)
  return c.json(farmers)
})

app.post(
  "/data/upload",
  zValidator(
    "json",
    z.object({
      name: z.string(),
      age: z.coerce.number(),
      email: z.string().email(),
    })
  ),
  async (c) => {
    const { name, age, email } = c.req.valid("json");
    await queue.add("farmers-queue", { name, age, email }, { delay: 3000 });
    return c.json({ message: "Handle Data Upload" });
  }
);

const port = 3000;
console.log(`Server is running on http://localhost:${port}`);

worker.on("ready", () => {
  // eslint-disable-next-line no-console
  console.log("Worker is ready and listening for jobs!");
});
worker.on("completed", (job: Job) => {
  console.log(`Job ${job.id} completed, task name: ${job.name}`);
});

worker.on("failed", (job: Job | undefined, error: Error) => {
  if (job) {
    console.log(
      `Job ${job.id} failed, task name: ${job.name}, error: ${error.message}`,
    );
  }
  else {
    console.log(`Job failed, error: ${error.message}`);
  }
});

worker.on("error", (err) => {
  console.log(err);
});

serve({
  fetch: app.fetch,
  port,
});
