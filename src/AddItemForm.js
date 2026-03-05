import { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "./firebase";

function AddItemForm() {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [requestedBy, setRequestedBy] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await addDoc(collection(db, "items"), {
        name: name,
        quantity: Number(quantity),
        status: "want",
        requestedBy: requestedBy,
        receivedBy: "",
        dateRequested: new Date(),
        dateOrdered: null,
        dateReceived: null,
        notes: ""
      });

      alert("Item added!");

      // Clear form
      setName("");
      setQuantity("");
      setRequestedBy("");

    } catch (error) {
      console.error("Error adding item:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        placeholder="Item name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        type="number"
        placeholder="Quantity"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
      />

      <input
        placeholder="Requested by"
        value={requestedBy}
        onChange={(e) => setRequestedBy(e.target.value)}
      />

      <button type="submit">Add Item</button>
    </form>
  );
}

export default AddItemForm;