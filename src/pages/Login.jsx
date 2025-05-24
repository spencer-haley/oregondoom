import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate("/admin");
    } catch (err) {
      setError("Invalid email or password");
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-black text-doomGreen flex items-center justify-center px-4">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-md bg-black-900 border border-doomGreen rounded-lg p-8 shadow-xl"
        >
          <h2 className="text-4xl font-metal text-center text-doomGrey mb-6">Admin Login</h2>

          {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}

          <label className="block text-sm mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full mb-4 px-3 py-2 bg-black border border-doomGreen rounded text-doomGreen placeholder-gray-500"
            placeholder="admin@example.com"
            required
          />

          <label className="block text-sm mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full mb-6 px-3 py-2 bg-black border border-doomGreen rounded text-doomGreen placeholder-gray-500"
            placeholder="••••••••"
            required
          />

          <button
            type="submit"
            className="w-full py-2 font-bold rounded bg-doomGreen text-black hover:bg-lime-400 transition"
          >
            Sign In
          </button>
        </form>
      </div>
    </>
  );
}
