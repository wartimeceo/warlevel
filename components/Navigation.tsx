"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/home", label: "ACCUEIL", icon: "⬛" },
  { href: "/scan", label: "SCAN", icon: "◈" },
  { href: "/quests", label: "QUÊTES", icon: "◆" },
  { href: "/autopilot", label: "AUTO", icon: "◉" },
  { href: "/evolution", label: "ÉVOL", icon: "△" },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-950 border-t border-zinc-800">
      <div className="max-w-lg mx-auto flex">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center py-3 gap-0.5 transition-colors ${
                active
                  ? "text-white"
                  : "text-zinc-600 hover:text-zinc-400"
              }`}
            >
              <span className="text-base leading-none">{item.icon}</span>
              <span className="text-[10px] font-mono font-bold tracking-wider">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
