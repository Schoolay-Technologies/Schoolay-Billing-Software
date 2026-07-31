import { NavLink, Outlet } from "react-router-dom";

const navigationItems = [
  {
    name: "Dashboard",
    path: "/"
  },
  {
    name: "Schools",
    path: "/schools"
  },
  {
    name: "Products",
    path: "/products"
  },
  {
    name: "Invoices",
    path: "/invoices"
  },
  {
    name: "Production",
    path: "/production"
  },
  {
    name: "Reports",
    path: "/reports"
  },
  {
  name: "Tracking of Order",
  path: "/order-tracking"
},

{
  
  name: "Student Measurements",
  path: "/student-measurements"

}

];

export default function AppLayout() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-section">
          <div className="brand-logo">S</div>

          <div>
            <h1>Schoolay</h1>
            <p>Billing Software</p>
          </div>
        </div>

        <nav className="sidebar-navigation">
          {navigationItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                isActive
                  ? "navigation-link navigation-link-active"
                  : "navigation-link"
              }
            >
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <p>Schoolay Technologies</p>
          <span>Version 1.0.0</span>
        </div>
      </aside>

      <div className="main-area">
        <header className="top-header">
          <div>
            <h2>Billing and Production Management</h2>
            <p>Manage schools, products, invoices and production</p>
          </div>

          <div className="user-profile">
            <div className="user-avatar">A</div>

            <div>
              <strong>Administrator</strong>
              <span>Admin</span>
            </div>
          </div>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}