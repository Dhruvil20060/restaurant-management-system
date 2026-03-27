import { useContext } from "react";
import { OrderContext } from "../../App";

function StaffOrders() {
const { orders, setOrders, menuItems, setMenuItems } = useContext(OrderContext);

  const pageStyle = {
    minHeight: "100vh",
    padding: "28px 18px",
    background:
      "radial-gradient(circle at top right, #d8f3dc 0%, #f7fff9 45%, #ffffff 100%)",
  };

  const headerStyle = {
    maxWidth: "980px",
    margin: "0 auto 20px",
    background: "linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)",
    color: "#ffffff",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 12px 30px rgba(27, 67, 50, 0.25)",
  };

  const listStyle = {
    maxWidth: "980px",
    margin: "0 auto",
    display: "grid",
    gap: "14px",
  };

  const cardStyle = {
    background: "#ffffff",
    borderRadius: "14px",
    padding: "16px",
    border: "1px solid #d8f3dc",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.06)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
  };

  const getStatusStyle = (status) => {
    if (status === "Pending") {
      return {
        background: "#fff3cd",
        color: "#8a6d1d",
        border: "1px solid #ffe69c",
      };
    }
    if (status === "Preparing") {
      return {
        background: "#d1ecf1",
        color: "#0c5460",
        border: "1px solid #b8daff",
      };
    }
    return {
      background: "#d4edda",
      color: "#155724",
      border: "1px solid #c3e6cb",
    };
  };

  const updateStatus = (id) => {
    const updatedOrders = orders.map((order) => {
      if (order.id === id) {
        if (order.status === "Pending")
          return { ...order, status: "Preparing" };
        if (order.status === "Preparing")
          return { ...order, status: "Completed" };
      }
      return order;
    });

    setOrders(updatedOrders);
  };

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <h1 style={{ margin: 0, fontSize: "1.8rem", fontWeight: 700 }}>
          Staff Orders Panel
        </h1>
        <p style={{ margin: "8px 0 0", opacity: 0.9 }}>
          Track live orders and update preparation progress quickly.
        </p>
      </div>

      <div style={listStyle}>
        {orders.length === 0 && (
          <div style={cardStyle}>
            <p style={{ margin: 0, color: "#555" }}>No orders available right now.</p>
          </div>
        )}

        {orders.map((order) => (
          <div key={order.id} style={cardStyle}>
            <div>
              <h3 style={{ margin: "0 0 8px", color: "#1b4332" }}>
                Order #{order.id}
              </h3>
              <p style={{ margin: 0, color: "#4f4f4f" }}>
                Customer: <strong>{order.customer}</strong>
              </p>
              <p style={{ margin: "8px 0 4px", color: "#1f1f1f", fontWeight: 600 }}>
                Items:
              </p>
              <ul style={{ margin: "0 0 0 18px", padding: 0, color: "#4f4f4f" }}>
                {order.items?.length ? (
                  order.items.map((item, index) => (
                    <li key={index} style={{ marginBottom: "4px" }}>
                      {item.name || item.itemName || "Item"}
                      {item.quantity ? ` x${item.quantity}` : ""}
                    </li>
                  ))
                ) : (
                  <li>No item details</li>
                )}
              </ul>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span
                style={{
                  ...getStatusStyle(order.status),
                  padding: "6px 12px",
                  borderRadius: "999px",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                }}
              >
                {order.status}
              </span>

              {order.status !== "Completed" && (
                <button
                  onClick={() => updateStatus(order.id)}
                  style={{
                    border: "none",
                    background: "#2d6a4f",
                    color: "#fff",
                    padding: "8px 14px",
                    borderRadius: "8px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Update Status
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default StaffOrders;
