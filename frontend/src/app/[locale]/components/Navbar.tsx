"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Navbar() {
  const pathname = usePathname();
  const locale = useLocale();

  const tNav = useTranslations("nav");
  const tAuth = useTranslations("auth");

  const [open, setOpen] = useState(false);

  const navItems = [
    { href: `/${locale}`, label: tNav("home") },
    { href: `/${locale}/about`, label: tNav("about") },
    { href: `/${locale}/coaches`, label: tNav("coaches") },
    { href: `/${locale}/pricing`, label: tNav("plans") },
    { href: `/${locale}/contact`, label: tNav("contact") },
  ];


  const isActive = (href:string)=>{
    if(href === `/${locale}`)
      return pathname === href;

    return pathname === href || pathname?.startsWith(`${href}/`);
  };


  return (
    <>

    <header
      className="
      relative
      flex
      h-20
      w-full
      items-center
      justify-between
      bg-black
      px-6
      sm:px-8
      "
      dir="ltr"
    >


      {/* Mobile Hamburger — left side on small screens */}

      <button
        onClick={()=>setOpen(true)}
        aria-label="Open menu"
        className="
        text-3xl
        text-white
        lg:hidden
        "
      >
        ☰
      </button>



      {/* Logo — centered (image only) on small screens,
          left-aligned with full wordmark on desktop */}

      <Link
        href={`/${locale}`}
        className="
        absolute
        left-1/2
        top-1/2
        flex
        -translate-x-1/2
        -translate-y-1/2
        items-center
        lg:static
        lg:left-auto
        lg:top-auto
        lg:order-first
        lg:translate-x-0
        lg:translate-y-0
        "
      >

        <Image
          src="/images/fdLogo.png"
          alt="FD Logo"
          width={120}
          height={120}
          className="lg:h-[120px] lg:w-[120px]"
        />

        <h1 className="-ml-5 hidden text-2xl font-bold text-[#B4E3BD] lg:block">
          FDCrossfit
        </h1>

      </Link>



      {/* Desktop Navigation */}

      <nav
        className="
        absolute
        left-1/2
        hidden
        -translate-x-1/2
        items-center
        gap-1
        lg:flex
        "
        dir={locale === "fa" ? "rtl" : "ltr"}
      >

        {navItems.map(item=>(
          <NavLink
            key={item.href}
            href={item.href}
            name={item.label}
            active={isActive(item.href)}
          />
        ))}

      </nav>



      {/* Desktop Right */}

      <div
        className="
        hidden
        items-center
        gap-5
        lg:flex
        "
      >

        <LanguageSwitcher />


        <Link
          href={`/${locale}/auth/login`}
          className="
          text-sm
          font-medium
          text-white
          transition
          hover:text-[#B4E3BD]
          "
        >
          {tAuth("login")}
        </Link>


        <Link
          href={`/${locale}/dashboard`}
          className="
          rounded-full
          bg-[#B4E3BD]
          px-5
          py-2
          text-sm
          font-semibold
          text-black
          transition
          hover:scale-105
          hover:bg-white
          "
        >
          {tAuth("dashboard")}
        </Link>


      </div>



      {/* Mobile Language Switcher — right side on small screens */}

      <div className="lg:hidden">
        <LanguageSwitcher />
      </div>


    </header>



    {/* Mobile Sidebar */}

    <div
      className={`
      fixed
      inset-0
      z-50
      transition
      ${open ? "visible" : "invisible"}
      `}
    >


      {/* Overlay */}

      <div
        onClick={()=>setOpen(false)}
        className={`
        absolute
        inset-0
        bg-black/70
        transition-opacity
        ${open ? "opacity-100" : "opacity-0"}
        `}
      />



      {/* Sidebar */}

      <aside
        className={`
        absolute
        right-0
        top-0
        h-full
        w-72
        bg-black
        p-8
        transition-transform
        duration-300
        ${open ? "translate-x-0" : "translate-x-full"}
        `}
      >


        <button
          onClick={()=>setOpen(false)}
          className="
          mb-10
          text-3xl
          text-white
          "
        >
          ×
        </button>



        <div className="flex flex-col gap-6">


          {navItems.map(item=>(
            <Link
              key={item.href}
              href={item.href}
              onClick={()=>setOpen(false)}
              className={`
              text-lg
              ${
                isActive(item.href)
                ? "text-[#B4E3BD]"
                : "text-white"
              }
              `}
            >
              {item.label}
            </Link>
          ))}



          <div className="mt-5 border-t border-white/20 pt-5">
          </div>



          <Link
            href={`/${locale}/auth/login`}
            className="
            text-white
            "
          >
            {tAuth("login")}
          </Link>



          <Link
            href={`/${locale}/dashboard`}
            className="
            rounded-full
            bg-[#B4E3BD]
            px-5
            py-3
            text-center
            font-semibold
            text-black
            "
          >
            {tAuth("dashboard")}
          </Link>


        </div>


      </aside>


    </div>


    </>
  );
}




function NavLink({
 href,
 name,
 active,
}:{
 href:string;
 name:string;
 active:boolean;
}){

return(

<Link
href={href}
className="
group
relative
px-4
py-7
text-sm
font-medium
"
>

<span
className={`
absolute
inset-x-1
inset-y-4
rounded-lg
transition
${
active
?
"bg-[#B4E3BD]"
:
"bg-transparent group-hover:bg-[#B4E3BD]/10"
}
`}
/>


<span
className={`
relative
z-10
${
active
?
"text-black"
:
"text-white group-hover:text-[#B4E3BD]"
}
`}
>
{name}
</span>


</Link>

)

}