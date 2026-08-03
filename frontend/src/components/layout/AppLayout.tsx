import {
  useEffect,
  useState
} from "react";

import {
  NavLink,
  Outlet,
  useLocation
} from "react-router-dom";

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
  },
  {
    name: "School Camps",
    path: "/camps"
  }
];

export default function AppLayout() {
  const location = useLocation();

  const [
    isSidebarOpen,
    setIsSidebarOpen
  ] = useState(false);

  useEffect(() => {
    // Close the mobile sidebar whenever the route changes
    setIsSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function handleWindowResize(): void {
      if (window.innerWidth > 900) {
        setIsSidebarOpen(false);
      }
    }

    window.addEventListener(
      "resize",
      handleWindowResize
    );

    return () => {
      window.removeEventListener(
        "resize",
        handleWindowResize
      );
    };
  }, []);

  function toggleSidebar(): void {
    setIsSidebarOpen(
      (currentValue) =>
        !currentValue
    );
  }

  function closeMobileSidebar(): void {
    setIsSidebarOpen(false);
  }

  return (
    <div className="app-shell">
      <button
        type="button"
        className={`sidebar-backdrop ${
          isSidebarOpen
            ? "sidebar-backdrop-visible"
            : ""
        }`}
        aria-label="Close navigation menu"
        onClick={
          closeMobileSidebar
        }
      />

      <aside
        className={`sidebar ${
          isSidebarOpen
            ? "sidebar-mobile-open"
            : ""
        }`}
      >
        <div className="sidebar-top-section">
          <div className="brand-section">
            <div className="brand-logo">
              S
            </div>

            <div className="brand-content">
              <h1>
                Schoolay
              </h1>

              <p>
                Billing Software
              </p>
            </div>
          </div>

          <button
            type="button"
            className="sidebar-close-button"
            onClick={
              closeMobileSidebar
            }
            aria-label="Close navigation menu"
          >
            <span />
            <span />
          </button>
        </div>

        <nav className="sidebar-navigation">
          {navigationItems.map(
            (item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={
                  item.path === "/"
                }
                className={({
                  isActive
                }) =>
                  isActive
                    ? "navigation-link navigation-link-active"
                    : "navigation-link"
                }
              >
                <span className="navigation-link-text">
                  {item.name}
                </span>
              </NavLink>
            )
          )}
        </nav>

        <div className="sidebar-footer">
          <p>
            Schoolay Technologies
          </p>

          <span>
            Version 1.0.0
          </span>
        </div>
      </aside>

      <div className="main-area">
        <header className="top-header">
          <div className="top-header-left">
            <button
              type="button"
              className={`hamburger-button ${
                isSidebarOpen
                  ? "hamburger-button-open"
                  : ""
              }`}
              aria-label={
                isSidebarOpen
                  ? "Close navigation menu"
                  : "Open navigation menu"
              }
              aria-expanded={
                isSidebarOpen
              }
              onClick={
                toggleSidebar
              }
            >
              <span />
              <span />
              <span />
            </button>

            <div>
              <h2>
                Billing and Production Management
              </h2>

              <p>
                Manage schools, products,
                invoices and production
              </p>
            </div>
          </div>

          <div className="user-profile">
            <div className="user-avatar">
              A
            </div>

            <div className="user-profile-content">
              <strong>
                Administrator
              </strong>

              <span>
                Admin
              </span>
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