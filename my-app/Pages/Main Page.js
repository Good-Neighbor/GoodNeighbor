import React from "react";
import { useNavigate } from "react-router-dom";

export default function MainPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white shadow-2xl rounded-2xl p-10 w-full max-w-md text-center">
        <h1 className="text-3xl font-semibold text-gray-800 mb-8">Welcome</h1>
        
        <div className="flex flex-col gap-4">
          <button
            onClick={() => navigate("/signin")}
            className="bg-blue-600 text-white py-3 rounded-xl text-lg font-medium hover:bg-blue-700 transition"
          >
            Sign In
          </button>

          <button
            onClick={() => navigate("/listings")}
            className="bg-green-600 text-white py-3 rounded-xl text-lg font-medium hover:bg-green-700 transition"
          >
            Go to Listings
          </button>

          <button
            onClick={() => navigate("/create")}
            className="bg-purple-600 text-white py-3 rounded-xl text-lg font-medium hover:bg-purple-700 transition"
          >
            Create Listing
          </button>
        </div>
      </div>
    </div>
  );
}
