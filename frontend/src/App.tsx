import {
  createBrowserRouter,
  RouterProvider
} from "react-router-dom";

import AppLayout from "./components/layout/AppLayout";
import DashboardPage from "./pages/dashboard/DashboardPage";
import SchoolsPage from "./pages/schools/SchoolsPage";
import ProductsPage from "./pages/products/ProductsPage";
import InvoicesPage from "./pages/invoices/InvoicesPage";
import OrderTrackingPage from "./pages/OderTracking/OrderTrackingPage";
import ProductionPage from "./pages/production/ProductionPage";
import ReportsPage from "./pages/reports/ReportsPage";
import StudentMeasurementsPage from "./pages/studentMeasurements/StudentMeasurementsPage";
import CampsPage from "./pages/camps/CampsPage";
import PublicCampOrderPage from "./pages/publicCamp/PublicCampOrderPage";
import StoreReportsPage from "./pages/storeReports/StoreReportsPage";

import ERPStartupProvider from "./components/common/ERPStartupProvider";

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <DashboardPage />
      },
      {
        path: "schools",
        element: <SchoolsPage />
      },
      {
        path: "products",
        element: <ProductsPage />
      },
      {
        path: "invoices",
        element: <InvoicesPage />
      },
      {
        path: "order-tracking",
        element: <OrderTrackingPage />
      },
      {
        path: "reports",
        element: <ReportsPage />
      },
      {
        path: "production",
        element: <ProductionPage />
      },
      {
        path: "student-measurements",
        element: <StudentMeasurementsPage />
      },
      {
        path: "camps",
        element: <CampsPage />
      },
      {
        path: "/camp/:token",
        element: <PublicCampOrderPage />
      },
      {
        path: "store-reports",
        element: <StoreReportsPage />
      }
    ]
  }
]);

export default function App() {
  return (
    <ERPStartupProvider>
      <RouterProvider router={router} />
    </ERPStartupProvider>
  );
}