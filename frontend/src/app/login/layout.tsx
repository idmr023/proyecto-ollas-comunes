import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ollas Comunes | Login",
};

export default function LoginLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="w-full h-full min-h-0 flex flex-col">
      {children}
    </main>
  );
}
