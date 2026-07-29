import "dotenv/config";

import app from "./app.js";
import { connectDatabase } from "./config/database.js";

const port = Number(process.env.PORT) || 5000;

async function startServer(): Promise<void> {
  try {
    await connectDatabase();

    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Unable to start the server:", error);
    process.exit(1);
  }
}

void startServer();