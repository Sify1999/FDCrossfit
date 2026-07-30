"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

export default function Navbar() {
  const pathname = usePathname();
  const locale = useLocale();
  const tNav = useTranslations("nav");
  const tAuth = useTranslations("auth");

  const navItems = [
    { href: `/${locale}`, label: tNav("home") },
    { href: `/${locale}/about`, label: tNav("about") },
    { href: `/${locale}/coaches`, label: tNav("coaches") },
    { href: `/${locale}/pricing`, label: tNav("plans") },
    { href: `/${locale}/contact`, label: tNav("contact") },
  ];

  const isActive = (href: string) => {
    if (href === `/${locale}`) return pathname === href;
    return pathname === href || pathname?.startsWith(`${href}/`);
  };

  return (
    <header
      className="relative flex h-20 w-full items-center justify-between bg-black px-8"
      dir="ltr"
    >
      {/* Logo left */}
      <div className="flex shrink-0 items-center -ml-7">
        <Image src="/images/fdLogo.png" alt="FD Logo" width={80} height={80} />
        <h1 className="-ml-3 text-2xl font-bold text-[#B4E3BD]">FDCrossfit</h1>
      </div>

      {/* Center Navigation */}
      <nav className="absolute left-1/2 flex -translate-x-1/2 items-center gap-1">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            name={item.label}
            active={isActive(item.href)}
          />
        ))}
      </nav>

      {/* Right side: Login / Dashboard */}
      <div className="flex shrink-0 items-center gap-5">
        
        <Link
          href={`/${locale}/dashboard`}
          className="rounded-full bg-[#B4E3BD] px-5 py-2 text-sm font-semibold text-black transition-all duration-300 hover:scale-105 hover:bg-white"
        >
          {tAuth("dashboard")}
        </Link>
      </div>
    </header>
  );
}

function NavLink({
  href,
  name,
  active,
}: {
  href: string;
  name: string;
  active: boolean;
}) {
  return (
    <Link href={href} className="group relative px-4 py-7 text-sm font-medium">
      {/* animated active/hover background */}
      <span
        className={`absolute inset-x-1 inset-y-4 rounded-lg transition-all duration-300 ease-out ${
          active
            ? "scale-100 bg-[#B4E3BD] opacity-100"
            : "scale-90 bg-[#B4E3BD]/0 opacity-0 group-hover:scale-100 group-hover:bg-[#B4E3BD]/10 group-hover:opacity-100"
        }`}
      />
      <span
        className={`relative z-10 transition-colors duration-300 ${
          active ? "text-black" : "text-white group-hover:text-[#B4E3BD]"
        }`}
      >
        {name}
      </span>
      {/* underline that grows in from the center when active */}
      <span
        className={`absolute bottom-3 left-1/2 h-0.5 -translate-x-1/2 bg-[#B4E3BD] transition-all duration-300 ease-out ${
          active ? "w-6 opacity-0" : "w-0 opacity-0"
        }`}
      />
    </Link>
  );
}