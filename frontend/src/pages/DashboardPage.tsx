const dashboardCards = [
  {
    title: "Total Schools",
    value: "0"
  },
  {
    title: "Total Products",
    value: "0"
  },
  {
    title: "Today's Invoices",
    value: "0"
  },
  {
    title: "Today's Sales",
    value: "₹0.00"
  }
];

export default function DashboardPage() {
  return (
    <section>
      <div className="page-heading">
        <div>
          <h1>Dashboard</h1>
          <p>Overview of your billing and production activity</p>
        </div>
      </div>

      <div className="dashboard-grid">
        {dashboardCards.map((card) => (
          <article className="dashboard-card" key={card.title}>
            <p>{card.title}</p>
            <strong>{card.value}</strong>
          </article>
        ))}
      </div>

      <div className="empty-dashboard-section">
        <h2>Recent Invoices</h2>

        <div className="empty-state">
          <p>No invoices have been generated yet.</p>
        </div>
      </div>
    </section>
  );
}