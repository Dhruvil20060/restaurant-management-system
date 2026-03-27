import { useContext, useEffect, useState } from "react";
import { OrderContext } from "../../App";
import api from "../../services/api";

function Orders() {
  const { orders, setOrders } = useContext(OrderContext);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const response = await api.getOrders();
        setOrders(response.orders || []);
      } catch (error) {
        console.error("Failed to load orders:", error);
      }
    };

    loadOrders();
  }, [setOrders]);

  const updateStatus = async (id, newStatus) => {
    try {
      const response = await api.updateOrderStatus(id, newStatus);
      const updatedOrder = response.order;

      const updatedOrders = orders.map((order) => {
        if ((order._id || order.id) === id) {
          return { ...order, ...updatedOrder };
        }
        return order;
      });

      setOrders(updatedOrders);
    } catch (error) {
      console.error("Failed to update order status:", error);
      alert(error.message || "Failed to update order status");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending": return "bg-red-100 text-red-800";
      case "Confirmed": return "bg-blue-100 text-blue-800";
      case "Preparing": return "bg-yellow-100 text-yellow-800";
      case "Ready": return "bg-purple-100 text-purple-800";
      case "Completed": return "bg-green-100 text-green-800";
      case "Delivered": return "bg-green-100 text-green-800";
      case "Cancelled": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getNextStatus = (currentStatus) => {
    switch (currentStatus) {
      case "Pending": return "Confirmed";
      case "Confirmed": return "Preparing";
      case "Preparing": return "Ready";
      case "Ready": return "Delivered";
      default: return currentStatus;
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesFilter = filter === "all" || order.status.toLowerCase() === filter;
    const customerName = order.customerId?.username || order.customer || "";
    const orderId = order.orderNumber || order._id || order.id || "";
    const matchesSearch = customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         String(orderId).toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const statusCounts = {
    all: orders.length,
    pending: orders.filter(o => o.status === "Pending").length,
    preparing: orders.filter(o => o.status === "Preparing").length,
    completed: orders.filter(o => o.status === "Delivered" || o.status === "Completed").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Orders Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage and track all customer orders
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <p className="text-sm text-gray-500">Total Orders</p>
            <p className="text-lg font-bold text-gray-900">{orders.length}</p>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="card-shadow p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Status Filters */}
          <div className="flex flex-wrap gap-2">
            {[
              { key: "all", label: "All Orders", count: statusCounts.all },
              { key: "pending", label: "Pending", count: statusCounts.pending },
              { key: "preparing", label: "Preparing", count: statusCounts.preparing },
              { key: "completed", label: "Completed", count: statusCounts.completed },
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === key
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10 w-64"
            />
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="card-shadow overflow-hidden">
        {filteredOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Table
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order._id || order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          Order #{order.orderNumber || order._id || order.id}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.createdAt || order.timestamp
                            ? new Date(order.createdAt || order.timestamp).toLocaleDateString()
                            : "-"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 bg-linear-to-r from-blue-400 to-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-white">
                            {(order.customerId?.username || order.customer || "G").charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {order.customerId?.username || order.customer || "Guest"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Table {order.tableNumber || order.table || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ₹{(Number(order.totalAmount) || Number(order.total) || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {!["Completed", "Delivered", "Cancelled"].includes(order.status) && (
                        <button
                          onClick={() => updateStatus(order._id || order.id, getNextStatus(order.status))}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
                        >
                          {order.status === "Pending" && "Confirm Order"}
                          {order.status === "Confirmed" && "Start Preparing"}
                          {order.status === "Preparing" && "Mark Ready"}
                          {order.status === "Ready" && "Mark Delivered"}
                        </button>
                      )}
                      {["Completed", "Delivered"].includes(order.status) && (
                        <span className="text-green-600 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Delivered
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-500">
              {searchTerm || filter !== "all"
                ? "Try adjusting your search or filter criteria"
                : "Orders will appear here once customers start placing them"
              }
            </p>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {orders.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card-shadow p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{statusCounts.pending}</div>
            <div className="text-sm text-gray-500">Pending Orders</div>
          </div>
          <div className="card-shadow p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{statusCounts.preparing}</div>
            <div className="text-sm text-gray-500">In Preparation</div>
          </div>
          <div className="card-shadow p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{statusCounts.completed}</div>
            <div className="text-sm text-gray-500">Completed Today</div>
          </div>
          <div className="card-shadow p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">
              ₹{orders.reduce((sum, order) => sum + (Number(order.totalAmount) || Number(order.total) || 0), 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">Total Revenue</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Orders;
