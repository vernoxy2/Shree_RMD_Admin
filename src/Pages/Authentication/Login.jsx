import React, { useState } from "react";
import { auth, db } from "../../../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const q = query(collection(db, "users"), where("email", "==", user.email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        alert("User not found");
        setLoading(false);
        return;
      }

      let role = "";
      querySnapshot.forEach((doc) => {
        role = doc.data().role;
      });

      localStorage.setItem("role", role);

      if (role === "hospital admin") {
        navigate("/hospital-dashboard");
      } else if (role === "college admin") {
        navigate("/college-dashboard");
      } else {
        alert("Invalid role");
      }

    } catch (error) {
      alert(error.message);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">

      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 border">

        {/* Logo / Title */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-red-700">
            Admin Login
          </h2>
          <p className="text-gray-500 text-sm">
            RMD Ayurveda College & Hospital
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">

          {/* Email */}
          <div>
            <label className="text-sm text-gray-600">Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-sm text-gray-600">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              className="w-full mt-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {/* Footer */}
        <p className="text-xs text-gray-400 text-center mt-6">
          Authorized personnel only
        </p>
      </div>
    </div>
  );
};

export default Login;