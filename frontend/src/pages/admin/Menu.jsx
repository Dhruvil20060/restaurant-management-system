import { useContext, useState } from "react";
import { OrderContext } from "../../App";

function Menu() {
  const { orders, setOrders, menuItems, setMenuItems } = useContext(OrderContext);
  const [editingId, setEditingId] = useState(null);
const [editedItem, setEditedItem] = useState({
  name: "",
  description: "",
  category: "",
  image: "",
  isAvailable: true,
  price: "",
});

const startEdit = (item) => {
  setEditingId(item.id);
  setEditedItem({
    name: item.name || "",
    description: item.description || "",
    category: item.category || "",
    image: item.image || "",
    isAvailable: item.isAvailable !== undefined ? item.isAvailable : true,
    price: item.price || "",
  });
};
const saveEdit = (id) => {
  const updatedMenu = menuItems.map((item) =>
    item.id === id ? { ...item, ...editedItem } : item
  );

  setMenuItems(updatedMenu);
  setEditingId(null);
};


  const [newItem, setNewItem] = useState({
    name: "",
    description: "",
    category: "",
    image: "",
    isAvailable: true,
    price: "",
  });

  const addItem = () => {
    if (!newItem.name || !newItem.description || !newItem.category || !newItem.price) return;

    const newMenuItem = {
      id: Date.now(),
      name: newItem.name,
      description: newItem.description,
      category: newItem.category,
      image: newItem.image,
      isAvailable: newItem.isAvailable,
      price: Number(newItem.price),
    };

    setMenuItems([...menuItems, newMenuItem]);

    setNewItem({
      name: "",
      description: "",
      category: "",
      image: "",
      isAvailable: true,
      price: "",
    });
  };

const deleteItem = (id) => {
  const confirmDelete = window.confirm("Are you sure?");
  if (!confirmDelete) return;

  const updatedMenu = menuItems.filter((item) => item.id !== id);
  setMenuItems(updatedMenu);
};


  return (
    <div>
      <h1>Menu Management</h1>

<div
  style={{
    background: "white",
    padding: "20px",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    marginTop: "20px",
    marginBottom: "20px",
    display: "flex",
    gap: "15px",
    alignItems: "center",
  }}
>
  <input
    type="text"
    placeholder="Item Name"
    value={newItem.name}
    onChange={(e) =>
      setNewItem({ ...newItem, name: e.target.value })
    }
    style={inputStyle}
  />

  <input
    type="text"
    placeholder="Description"
    value={newItem.description}
    onChange={(e) =>
      setNewItem({ ...newItem, description: e.target.value })
    }
    style={inputStyle}
  />

  <input
    type="text"
    placeholder="Category"
    value={newItem.category}
    onChange={(e) =>
      setNewItem({ ...newItem, category: e.target.value })
    }
    style={inputStyle}
  />

  <input
    type="text"
    placeholder="Image URL (optional)"
    value={newItem.image}
    onChange={(e) =>
      setNewItem({ ...newItem, image: e.target.value })
    }
    style={inputStyle}
  />

  <input
    type="number"
    placeholder="Price"
    value={newItem.price}
    onChange={(e) =>
      setNewItem({ ...newItem, price: e.target.value })
    }
    style={inputStyle}
  />

  <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
    <input
      type="checkbox"
      checked={newItem.isAvailable}
      onChange={(e) =>
        setNewItem({ ...newItem, isAvailable: e.target.checked })
      }
    />
    Available
  </label>

  <button onClick={addItem} style={buttonStyle}>
    + Add Item
  </button>
</div>


      <table
        style={{
          width: "100%",
          marginTop: "20px",
          borderCollapse: "collapse",
        }}
      >
        <thead>
          <tr style={{ background: "#f0f0f0" }}>
            <th style={cellStyle}>ID</th>
            <th style={cellStyle}>Name</th>
            <th style={cellStyle}>Description</th>
            <th style={cellStyle}>Category</th>
            <th style={cellStyle}>Available</th>
            <th style={cellStyle}>Price (₹)</th>
            <th style={cellStyle}>Action</th>
          </tr>
        </thead>

        <tbody>
          {menuItems.map((item) => (
  <tr key={item.id}>
    <td style={cellStyle}>{item.id}</td>

    <td style={cellStyle}>
      {editingId === item.id ? (
        <input
          value={editedItem.name}
          onChange={(e) =>
            setEditedItem({ ...editedItem, name: e.target.value })
          }
        />
      ) : (
        item.name
      )}
    </td>

    <td style={cellStyle}>
      {editingId === item.id ? (
        <input
          value={editedItem.description}
          onChange={(e) =>
            setEditedItem({ ...editedItem, description: e.target.value })
          }
        />
      ) : (
        item.description || "-"
      )}
    </td>

    <td style={cellStyle}>
      {editingId === item.id ? (
        <input
          value={editedItem.category}
          onChange={(e) =>
            setEditedItem({ ...editedItem, category: e.target.value })
          }
        />
      ) : (
        item.category || "-"
      )}
    </td>

    <td style={cellStyle}>
      {editingId === item.id ? (
        <input
          type="checkbox"
          checked={editedItem.isAvailable}
          onChange={(e) =>
            setEditedItem({ ...editedItem, isAvailable: e.target.checked })
          }
        />
      ) : item.isAvailable ? (
        "Yes"
      ) : (
        "No"
      )}
    </td>

    <td style={cellStyle}>
      {editingId === item.id ? (
        <input
          type="number"
          value={editedItem.price}
          onChange={(e) =>
            setEditedItem({ ...editedItem, price: e.target.value })
          }
        />
      ) : (
        item.price
      )}
    </td>

    <td style={cellStyle}>
      {editingId === item.id ? (
        <button onClick={() => saveEdit(item.id)}>Save</button>
      ) : (
        <>
<button onClick={() => startEdit(item)} style={editBtn}>
  Edit
</button>

<button
  onClick={() => deleteItem(item.id)}
  style={deleteBtn}
>
  Delete
</button>

        </>
      )}
    </td>
  </tr>
))}

        </tbody>
      </table>
    </div>
  );
}

const editBtn = {
  padding: "6px 10px",
  background: "#007bff",
  color: "white",
  border: "none",
  borderRadius: "4px",
  marginRight: "8px",
  cursor: "pointer",
};

const deleteBtn = {
  padding: "6px 10px",
  background: "#dc3545",
  color: "white",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
};


const cellStyle = {
  border: "1px solid #ddd",
  padding: "10px",
  textAlign: "center",
};

const inputStyle = {
  padding: "8px 12px",
  borderRadius: "4px",
  border: "1px solid #ccc",
  outline: "none",
};

const buttonStyle = {
  padding: "8px 15px",
  borderRadius: "4px",
  border: "none",
  background: "#4CAF50",
  color: "white",
  cursor: "pointer",
};


export default Menu;
