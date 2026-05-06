
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  useEffect(() => { router.push("/login"); }, [router]);
  return <div className="h-screen flex items-center justify-center" style={{ backgroundColor: "#08090a" }}><div className="w-8 h-8 border-2 border-[#5e6ad2] border-t-transparent rounded-full animate-spin" /></div>;
}
