"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "Mulai" },
  { href: "/checkin", label: "Check-in" },
  { href: "/submit", label: "Submit Karya" },
  { href: "/history", label: "Riwayat Saya" },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <nav className="tabs">
      {tabs.map((tab) => (
        <Link key={tab.href} href={tab.href} className={pathname === tab.href ? "active" : ""}>
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
