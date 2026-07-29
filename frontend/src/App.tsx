import {
  createBrowserRouter,
  RouterProvider
} from "react-router-dom";

import AppLayout from "./components/layout/AppLayout";
import DashboardPage from "./pages/dashboard/DashboardPage";
import SchoolsPage from "./pages/schools/SchoolsPage";
import ProductsPage from "./pages/products/ProductsPage";
import InvoicesPage from
  "./pages/invoices/InvoicesPage";

import OrderTrackingPage from
  "./pages/OderTracking/OrderTrackingPage";

  import ProductionPage from
  "./pages/production/ProductionPage";

  import ReportsPage from
  "./pages/reports/ReportsPage";

  import StudentSizeRecordsPage from
  "./pages/studentSizeRecords/StudentSizeRecordsPage";
  
function ComingSoonPage({ title }: { title: string }) {
  return (
    <section>
      <div className="page-heading">
        <div>
          <h1>{title}</h1>
          <p>This module will be developed in the next phase.</p>
        </div>
      </div>

      <div className="content-card">
        <div className="empty-state">
          <h3>{title} module</h3>
          <p>Development will begin after School Management.</p>
        </div>
      </div>
    </section>
  );
}

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
  path: "student-size-records",
  element: <StudentSizeRecordsPage />
},
      {
        path: "reports",
        element: <ComingSoonPage title="Reports" />
      }
    ]
  }
]);

export default function App() {
  return <RouterProvider router={router} />;
}