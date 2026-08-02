import cors from "cors";
import express, {
  type Application,
  type Request,
  type Response
} from "express";
import helmet from "helmet";
import morgan from "morgan";

import schoolRoutes from "./routes/school.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { notFoundHandler } from "./middleware/notFound.middleware.js";
import productRoutes from "./routes/product.routes.js";
import invoiceRoutes from "./routes/invoice.routes.js";
import orderTrackingRoutes from "./routes/orderTracking.routes.js";
import productionRoutes from "./routes/production.routes.js";
import reportRoutes from "./routes/report.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import studentMeasurementRoutes from "./routes/studentSizeRecord.routes.js";
import campRoutes from
  "./routes/camp.routes.js";

const app: Application = express();

// ✅ CORS - First middleware
app.use(
  cors({
    origin: "http://localhost:5174",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
  })
);

// ✅ Disable caching for development
app.use((_req: Request, res: Response, next) => {
  res.header("Cache-Control", "no-cache, no-store, must-revalidate");
  res.header("Pragma", "no-cache");
  res.header("Expires", "0");
  next();
});

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.get("/", (_request: Request, response: Response) => {
  response.status(200).json({
    success: true,
    message: "Welcome to Schoolay Billing and Production Management API",
    healthCheck: "/api/v1/health",
    schoolsApi: "/api/v1/schools"
  });
});

app.get("/api/v1/health", (_request: Request, response: Response) => {
  response.status(200).json({
    success: true,
    message: "Schoolay Billing API is running",
    timestamp: new Date().toISOString()
  });
});

app.use("/api/v1/schools", schoolRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/invoices", invoiceRoutes);
app.use("/api/v1/order-tracking", orderTrackingRoutes);
app.use("/api/v1/production", productionRoutes);
app.use("/api/v1/reports", reportRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use(
  "/api/v1/student-measurements",
  studentMeasurementRoutes
);
app.use(
  "/api/v1/camps",
  campRoutes
);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;