"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header 
      className="relative flex h-20 w-full items-center bg-black px-8"
      dir="ltr"
    >

      {/* Logo left */}
      <div className="flex items-center -ml-7">
        <Image
          src="/images/fdLogo.png"
          alt="FD Logo"
          width={80}
          height={80}
        />

        <h1 className="-ml-3 text-2xl font-bold text-[#B4E3BD]">
          FDCrossfit
        </h1>
      </div>


      {/* Center Navigation */}
      <nav className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 text-white">

        <NavLink 
          href="/en"
          name="Home"
          active={pathname === "/en"}
        />

        <NavLink 
          href="/en/pricing"
          name="Pricing"
          active={pathname === "/en/pricing"}
        />

        <NavLink 
          href="/en/coaches"
          name="Coaches"
          active={pathname === "/en/coaches"}
        />

      </nav>
      <div className="text-white">
        Login
      </div>
    </header>
  );
}


function NavLink({
  href,
  name,
  active
}: {
  href: string;
  name: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`
        px-4 py-7 transition
        ${
          active
            ? "bg-[#B4E3BD] text-black"
            : "hover:bg-gray-900 hover:text-[#B4E3BD]"
        }
      `}
    >
      {name}
    </Link>
  );
}