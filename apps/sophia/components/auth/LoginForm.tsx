"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@lib/contexts/AuthContext";

interface LoginFormProps {
  onSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const { login, isLoading, error } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    try {
      await login(username, password);
      onSuccess?.();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Login failed");
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  return (
    <motion.div
      className="w-full max-w-md mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="glass rounded-2xl p-8 backdrop-blur-md">
        <h1 className="text-3xl font-bold text-white mb-2 text-center">Welcome Back</h1>
        <p className="text-gray-400 text-center mb-8">Enter your QOR ID credentials</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error message */}
          {(formError || error) && (
            <motion.div
              className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {formError || error}
            </motion.div>
          )}

          {/* Username input */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="your_qor_id"
              className="w-full px-4 py-3 bg-navy-800/50 border border-primary-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition"
              disabled={isLoading}
              required
            />
          </div>

          {/* Password input */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-navy-800/50 border border-primary-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition"
              disabled={isLoading}
              required
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 mt-6 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 disabled:opacity-50 text-white font-semibold rounded-lg transition duration-300"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-400">
          Don't have a QOR ID?{" "}
          <a href="/signup" className="text-primary-400 hover:text-primary-300 transition">
            Create one
          </a>
        </div>
      </div>
    </motion.div>
  );
};

export default LoginForm;
