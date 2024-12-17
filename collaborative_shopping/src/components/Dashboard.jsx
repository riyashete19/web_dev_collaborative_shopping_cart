import React, { useState, useEffect } from "react";
import { auth, database } from "../firebase";
import { signOut } from "firebase/auth";
import { ref, push, onValue, remove, update, set } from "firebase/database";

const Dashboard = () => {
  const [shoppingList, setShoppingList] = useState([]);
  const [itemName, setItemName] = useState("");
  const [itemCategory, setItemCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [groupId, setGroupId] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [newMemberEmail, setNewMemberEmail] = useState("");

  // Fetch the user's groupId and role on mount
  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (userId) {
      const userGroupRef = ref(database, `users/${userId}/groupId`);
      onValue(userGroupRef, (snapshot) => {
        const userGroupId = snapshot.val();
        setGroupId(userGroupId || userId);

        // Check admin status
        const groupRef = ref(database, `groups/${userGroupId}/admins/${userId}`);
        onValue(groupRef, (snapshot) => {
          setIsAdmin(snapshot.exists());
        });
      });
    }
  }, []);

  // Fetch group members
  useEffect(() => {
    if (groupId) {
      const membersRef = ref(database, `groups/${groupId}/members`);
      onValue(membersRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const members = Object.keys(data).map((key) => ({
            id: key,
            email: data[key],
          }));
          setGroupMembers(members);
        } else {
          setGroupMembers([]);
        }
      });
    }
  }, [groupId]);

  // Reference the shared or user-specific shopping list
  const shoppingRef = groupId
    ? ref(database, `groups/${groupId}/shopping`)
    : ref(database, `shopping/${auth.currentUser?.uid}`);

  // Fetch shopping list items
  useEffect(() => {
    if (!groupId) return;

    const unsubscribe = onValue(shoppingRef, (snapshot) => {
      setFetching(false);
      const data = snapshot.val();
      if (data) {
        const items = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setShoppingList(items);
      } else {
        setShoppingList([]);
      }
    });

    return () => unsubscribe();
  }, [groupId]);

  // Handle adding an item
  const handleAddItem = async () => {
    if (itemName.trim() && itemCategory.trim()) {
      setLoading(true);
      try {
        await push(shoppingRef, {
          name: itemName.trim(),
          category: itemCategory.trim(),
          purchased: false,
        });
        setItemName("");
        setItemCategory("");
      } catch (error) {
        console.error("Error adding item:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  // Toggle purchase status
  const togglePurchase = async (item) => {
    const itemRef = ref(database, `${shoppingRef.key}/${item.id}`);
    try {
      await update(itemRef, { purchased: !item.purchased });
    } catch (error) {
      console.error("Error updating item:", error);
    }
  };

  // Delete an item
  const deleteItem = async (itemId) => {
    const itemRef = ref(database, `${shoppingRef.key}/${itemId}`);
    try {
      await remove(itemRef);
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  // Add a new group member
  const handleAddMember = async () => {
    if (newMemberEmail.trim()) {
      try {
        const newMemberRef = push(ref(database, `groups/${groupId}/members`));
        await set(newMemberRef, newMemberEmail.trim());
        setNewMemberEmail("");
      } catch (error) {
        console.error("Error adding member:", error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-6 py-8">
      <div className="w-full max-w-4xl bg-white shadow-2xl rounded-2xl p-6 space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-blue-700">
            Collaborative Shopping Dashboard
          </h1>
          <p className="text-gray-500 mt-2">Manage your shopping list collaboratively</p>
        </div>

        {/* Group Details */}
        <div className="p-4 bg-gray-100 rounded-lg space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">Group Details</h2>
          <p>Group ID: {groupId}</p>
          <button
            onClick={() => navigator.clipboard.writeText(groupId)}
            className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600"
          >
            Copy Group ID
          </button>
          <div>
            {isAdmin && (
              <>
                <h3 className="font-bold text-gray-700">Add Member</h3>
                <input
                  placeholder="Enter email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  className="border p-2 rounded-lg mr-2"
                />
                <button
                  onClick={handleAddMember}
                  className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600"
                >
                  Add Member
                </button>
              </>
            )}
            <h3 className="font-bold text-gray-700 mt-4">Group Members:</h3>
            <ul>
              {groupMembers.map((member) => (
                <li key={member.id}>{member.email}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Add Item Form */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <input
            placeholder="Item Name"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg"
          />
          <input
            placeholder="Category"
            value={itemCategory}
            onChange={(e) => setItemCategory(e.target.value)}
            className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg"
          />
          <button
            onClick={handleAddItem}
            className="bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600"
            disabled={loading}
          >
            {loading ? "Adding..." : "Add Item"}
          </button>
        </div>

        {/* Shopping List */}
        {fetching ? (
          <p>Loading shopping list...</p>
        ) : (
          <div className="space-y-4">
            {shoppingList.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 bg-gray-100 rounded-lg"
              >
                <span className={item.purchased ? "line-through" : ""}>
                  {item.name} ({item.category})
                </span>
                <div className="space-x-2">
                  <button
                    onClick={() => togglePurchase(item)}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg"
                  >
                    {item.purchased ? "Unmark" : "Mark"}
                  </button>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Logout Button */}
        <div className="text-center">
          <button
            onClick={() => signOut(auth)}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg"
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
