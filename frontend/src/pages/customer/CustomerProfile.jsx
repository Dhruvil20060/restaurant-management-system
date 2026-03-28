import { useContext, useEffect, useMemo, useState } from "react";
import { OrderContext } from "../../App";
import api from "../../services/api";

function CustomerProfile() {
  const { orders } = useContext(OrderContext);

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await api.getCurrentUser();
        const currentUser = response.user;
        const resolvedName = [currentUser.firstName, currentUser.lastName]
          .filter(Boolean)
          .join(" ")
          .trim() || currentUser.username || "Customer";

        setUser(currentUser);
        setFullName(resolvedName);
        setEmail(currentUser.email || "");
        setPhone(currentUser.phone || "");
        setAddress(currentUser.address || "");
      } catch (error) {
        console.error("Failed to load customer profile:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const username = user?.username || localStorage.getItem("username") || "Customer";
  const currentUserId = user?._id || localStorage.getItem("userId");

  const myOrders = useMemo(
    () =>
      orders.filter((order) => {
        if (order.customer === username) return true;
        if (order.customerId?.username === username) return true;
        if (order.customerId?._id === currentUserId) return true;
        if (order.customerId === currentUserId) return true;
        return false;
      }),
    [orders, username, currentUserId]
  );

  const totalSpent = myOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
  const completedOrders = myOrders.filter(
    (order) => order.status === "Completed" || order.status === "Delivered"
  ).length;
  const pendingOrders = myOrders.filter(
    (order) => order.status === "Pending" || order.status === "Preparing"
  ).length;

  const handleSave = (e) => {
    e.preventDefault();

    const nameParts = fullName.trim().split(/\s+/).filter(Boolean);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ");

    (async () => {
      try {
        const response = await api.updateUser(currentUserId, {
          firstName,
          lastName,
          email: email.trim(),
          phone: phone.trim(),
          address: address.trim(),
        });

        setUser(response.user || user);
        setSaved(true);
        setTimeout(() => setSaved(false), 1800);
      } catch (error) {
        alert(error.message || "Failed to save profile");
      }
    })();
  };

  if (loading) {
    return (
      <div className="card-shadow p-6">
        <p className="text-gray-600">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-600 mt-1">Manage your account details and view your order summary.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:col-span-1">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-linear-to-r from-orange-500 to-red-500 text-white flex items-center justify-center text-2xl font-bold">
              {fullName?.charAt(0).toUpperCase() || "C"}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{fullName || "Customer"}</h2>
              <p className="text-sm text-gray-600">@{username}</p>
            </div>
          </div>

          <div className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Email</span>
              <span className="text-gray-900 font-medium">{email || "Not set"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Phone</span>
              <span className="text-gray-900 font-medium">{phone || "Not set"}</span>
            </div>
            <div className="flex justify-between items-start gap-4">
              <span className="text-gray-500">Address</span>
              <span className="text-gray-900 font-medium text-right">{address || "Not set"}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Profile</h3>
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Enter your name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="name@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="9876543210"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Street, City"
              />
            </div>

            <div className="md:col-span-2 flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                Save Profile
              </button>
              {saved && <p className="text-sm text-green-600 font-medium">Profile saved successfully</p>}
            </div>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <p className="text-sm text-gray-600">Total Orders</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{myOrders.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <p className="text-sm text-gray-600">Completed Orders</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{completedOrders}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <p className="text-sm text-gray-600">Pending Orders</p>
          <p className="text-3xl font-bold text-yellow-600 mt-1">{pendingOrders}</p>
          <p className="text-sm text-gray-500 mt-2">Total spent: ${totalSpent.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}

export default CustomerProfile;
