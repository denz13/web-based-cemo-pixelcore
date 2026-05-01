"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminDashboard from "./dashboard/admin-dashboard";
import { onAuthStateChange, AUTH_BACKEND_ENABLED } from "../src/services/authService";

export default function HomePage() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    return onAuthStateChange((user) => {
      setLoggedIn(!!user);
    });
  }, []);

  if (loggedIn) {
    return <AdminDashboard />;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center bg-white px-4 py-10">
      <main className="flex max-w-lg flex-col items-center gap-6 text-center">
        <h1 className="text-2xl font-semibold text-black">
          Flora Fauna Biodiversity
        </h1>

        <p className="text-zinc-600">Temporary landing page</p>

        <div className="flex w-full flex-col items-center gap-4">
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/login"
              className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700"
            >
              Go to Login
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-gray-600 px-6 py-3 font-medium text-white transition-colors hover:bg-gray-700"
            >
              Go to Register
            </Link>
          </div>
          {!AUTH_BACKEND_ENABLED && (
            <p
              className="w-full rounded-lg border border-dashed border-zinc-200 bg-zinc-50 px-4 py-3 text-xs leading-relaxed text-zinc-600"
              role="note"
            >
              <span className="font-medium text-zinc-700">
                Dev login (placeholder)
              </span>
              <br />
              Email: <code className="text-zinc-800">you@example.com</code> or any valid
              address · Password: at least 4 characters.
              <br />
              Admin preview: <code className="text-zinc-800">admin@localhost</code>
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
