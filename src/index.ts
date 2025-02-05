import { serve } from "@hono/node-server";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { queue, worker } from "./queue.js";

const app = new Hono();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

// app.get("/create-farmer", async (c) => {
//   await farmer_db.insert(farmersTable).values({
//     name: "John Doe Farmer",
//     age: 25,
//     email: "johndoe@exmaple.com",
//   });
//   return c.json({ message: "Farmer Created" });
// });

app.get(
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

serve({
  fetch: app.fetch,
  port,
});
