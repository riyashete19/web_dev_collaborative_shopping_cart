import React, { useState, useEffect } from "react";
import { auth, database } from "../firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { ref, set, get, update, remove } from "firebase/database";
import { useNavigate } from "react-router-dom";
import { User, Mail, Lock, ArrowRight, CheckCircle, AlertTriangle, Clipboard } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState("");
  const [groupId, setGroupId] = useState("");
  const [isJoiningGroup, setIsJoiningGroup] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [groupDetails, setGroupDetails] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  const saveUserToDatabase = async (user) => {
    try {
      const userRef = ref(database, `users/${user.uid}`);
      const generatedGroupId = uuidv4().slice(0, 8); // Generate a short Group ID
      const assignedGroupId = groupId || generatedGroupId;

      await set(userRef, {
        email: user.email,
        uid: user.uid,
        groupId: assignedGroupId,
      });

      if (!isJoiningGroup) {
        const groupRef = ref(database, `groups/${assignedGroupId}`);
        await set(groupRef, {
          admin: user.uid,
          members: { [user.uid]: true },
        });
        setSuccessMessage(`Group created successfully! Your Group ID is ${assignedGroupId}`);
      } else {
        const groupRef = ref(database, `groups/${groupId}/members/${user.uid}`);
        await set(groupRef, true);
        setSuccessMessage("Successfully joined the group!");
      }
    } catch (error) {
      console.error("Error saving user to database: ", error.message);
      setError("Failed to save user to the database. Please try again.");
    }
  };

  const fetchGroupDetails = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userRef = ref(database, `users/${user.uid}`);
      const userSnapshot = await get(userRef);

      if (userSnapshot.exists()) {
        const userData = userSnapshot.val();
        const groupRef = ref(database, `groups/${userData.groupId}`);
        const groupSnapshot = await get(groupRef);

        if (groupSnapshot.exists()) {
          const groupData = groupSnapshot.val();
          setGroupDetails(groupData);
          setIsAdmin(groupData.admin === user.uid);
        }
      }
    } catch (error) {
      console.error("Error fetching group details: ", error.message);
      setError("Failed to fetch group details.");
    }
  };

  const leaveGroup = async () => {
    try {
      const user = auth.currentUser;
      if (!user || !groupDetails) return;

      const userRef = ref(database, `users/${user.uid}`);
      const groupMemberRef = ref(database, `groups/${groupDetails.groupId}/members/${user.uid}`);

      await remove(groupMemberRef);
      await update(userRef, { groupId: null });

      setSuccessMessage("You have successfully left the group.");
      setGroupDetails(null);
    } catch (error) {
      console.error("Error leaving group: ", error.message);
      setError("Failed to leave the group.");
    }
  };

  const copyGroupIdToClipboard = () => {
    if (groupDetails?.groupId) {
      navigator.clipboard.writeText(groupDetails.groupId);
      setSuccessMessage("Group ID copied to clipboard!");
    }
  };

  useEffect(() => {
    fetchGroupDetails();
  }, []);

  const handleSubmit = async () => {
    setError("");
    setSuccessMessage("");
    try {
      let userCredential;

      if (isSignup) {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      }

      const user = userCredential.user;
      await saveUserToDatabase(user);

      navigate("/dashboard");
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-blue-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white shadow-2xl rounded-2xl overflow-hidden">
          <div className="bg-blue-600 p-6 text-center">
            <h2 className="text-3xl font-bold text-white">
              {isSignup ? "Create Account" : "Welcome Back"}
            </h2>
            <p className="text-white/80 mt-2">
              {isSignup
                ? "Sign up to start your journey"
                : "Log in to continue"}
            </p>
          </div>

          <div className="p-6 space-y-6">
            {error && (
              <div
                className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
                role="alert"
              >
                <span className="block sm:inline">{error}</span>
              </div>
            )}

            {successMessage && (
              <div
                className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative"
                role="alert"
              >
                <span className="block sm:inline">{successMessage}</span>
              </div>
            )}

            <div className="relative">
              <Mail
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {isSignup && (
              <div className="relative">
                <User
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder={
                    isJoiningGroup
                      ? "Enter Group ID to Join"
                      : "Leave blank to create a new group"
                  }
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            )}

            {isSignup && (
              <div className="text-center">
                <p
                  className="text-sm text-gray-600 cursor-pointer hover:text-blue-600 transition-colors"
                  onClick={() => setIsJoiningGroup(!isJoiningGroup)}
                >
                  {isJoiningGroup
                    ? "Want to create your own group?"
                    : "Already have a group? Join here"}
                </p>
              </div>
            )}

            <button
              onClick={handleSubmit}
              className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-all flex items-center justify-center space-x-2 group"
            >
              <span>{isSignup ? "Sign Up" : "Log In"}</span>
              <ArrowRight
                className="group-hover:translate-x-1 transition-transform"
                size={20}
              />
            </button>

            <div className="text-center">
              <p
                className="text-sm text-gray-600 cursor-pointer hover:text-blue-600 transition-colors"
                onClick={() => setIsSignup(!isSignup)}
              >
                {isSignup
                  ? "Already have an account? Log in"
                  : "Don't have an account? Sign up"}
              </p>
            </div>
          </div>

          {groupDetails && (
            <div className="p-6 border-t">
              <h3 className="text-xl font-bold mb-4">Group Management</h3>

              <div className="mb-4">
                <p><strong>Group ID:</strong> {groupDetails.groupId}</p>
                <button
                  onClick={copyGroupIdToClipboard}
                  className="text-blue-500 hover:underline"
                >
                  Copy Group ID
                  <Clipboard className="inline ml-2" size={16} />
                </button>
              </div>

              {groupDetails.members && (
                <div className="mb-4">
                  <strong>Members:</strong>
                  <ul>
                    {Object.keys(groupDetails.members).map((memberId) => (
                      <li key={memberId}>{memberId}</li>
                    ))}
                  </ul>
                </div>
              )}

              {!isAdmin && (
                <button
                  onClick={leaveGroup}
                  className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
                >
                  Leave Group
                </button>
              )}

              {isAdmin && (
                <p className="text-gray-500">You are the admin of this group.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
