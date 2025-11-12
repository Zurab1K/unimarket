"use client";

import { useState } from "react";

export default function Home() {
  const [action, setAction] = useState("Sign Up");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-b from-white to-purple-100">
      <div className="text-center w-full max-w-md">
        <h1 className="text-6xl font-bold mb-4 text-black">Your Campus</h1>
        <h1 className="text-6xl font-bold mb-4 text-purple-600">UniMarket</h1>

        <div className="flex items-center justify-center">
          <p className="text-lg text-gray-700 mb-5 whitespace-nowrap">
            Buy and sell dorm essentials, textbooks, and more with fellow students!
          </p>
        </div>

        {/* Top Buttons */}
        <div className="space-x-4 mb-3">
          <button
            onClick={() => setAction("Sign Up")}
            className={`px-6 py-1 rounded-lg transform transition duration-200 hover:scale-90 ${
              action === "Sign Up"
                ? "bg-purple-600 text-white"
                : "border-2 border-purple-600 text-purple-600 bg-white"
            }`}
          >
            Sign Up
          </button>
          <button
            onClick={() => setAction("Log In")}
            className={`px-6 py-1 rounded-lg transform transition duration-200 hover:scale-90 ${
              action === "Log In"
                ? "bg-purple-600 text-white"
                : "border-2 border-purple-600 text-purple-600 bg-white"
            }`}
          >
            Log In
          </button>
        </div>

        {/* Form */}
        <div className="flex items-center justify-center flex-col space-y-4 mb-6">
          <input
            type="text"
            placeholder="Username"
            className="w-3/4 border border-gray-300 px-3 py-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 text-black"
          />
          
          {/* Show Email input only for Sign Up */}
          {action === "Sign Up" && (
            <input
              type="email"
              placeholder="Email"
              className="w-3/4 border border-gray-300 px-3 py-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 text-black"
            />
          )}

          <input
            type="password"
            placeholder="Password"
            className="w-3/4 border border-gray-300 px-3 py-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 text-black"
          />
        </div>

        {/* Bottom Button */}
        <div className="space-x-4">
          <button className="bg-purple-600 text-white px-6 py-3 rounded-lg transform transition duration-200 hover:scale-90">
            {action}
          </button>
        </div>
      </div>
    </main>
  );
}
