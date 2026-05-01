"use client";

import type { ReactNode } from "react";
import Footer from "./footer";
import Navbar from "./navbar";

export default function NavbarShell({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <Navbar />
      <div>{children}</div>
      <Footer />
    </>
  );
}
