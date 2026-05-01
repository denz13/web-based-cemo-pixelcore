"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { onAuthStateChange, getUserProfile } from "../src/services/authService";

export default function LandingPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

 useEffect(() => {
  const unsubscribe = onAuthStateChange(async (user) => {
    if (user) {
      const profile = await getUserProfile(user.uid);
      console.log("Role:", profile?.role); // ← check what this prints
      setIsAdmin(profile?.role === "admin");
    }
  });
  return () => unsubscribe();
}, []);

  return (
    <>
      {/* Temporary admin banner */}
      {isAdmin && (
        <div
          style={{
            background: "#1a1a2e",
            color: "#fff",
            padding: "0.75rem 1.5rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>
            You are logged in as <strong>Admin</strong>
          </span>
          <button
            onClick={() => router.push("/admin/users")}
            style={{
              background: "#e94560",
              color: "#fff",
              border: "none",
              padding: "0.4rem 1rem",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Go to User Management
          </button>
        </div>
      )}

      {/* Landing Page */}
      <div className="flex min-h-screen items-center justify-center bg-white">
        <main className="flex flex-col items-center gap-8">
          <h1 className="text-2xl font-semibold text-black">
            Flora Fauna Biodiversity
          </h1>

          <p className="text-zinc-600">Temporary landing page</p>

          <div className="flex gap-4">
            <Link
              href="/login"
              className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Go to Login
            </Link>

            <Link
              href="/register"
              className="rounded-lg bg-gray-600 px-6 py-3 font-medium text-white hover:bg-gray-700 transition-colors"
            >
              Go to Register
            </Link>
          </div>
        </main>
      </div>
    </>
  );
}