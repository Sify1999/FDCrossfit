"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Link, usePathname, useRouter } from "@/lib/navigation";
import { clearTokens, fetchCurrentUser, type CurrentUser } from "@/lib/auth";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();

  const tNav = useTranslations("nav");
  const tAuth = useTranslations("auth");

  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Re-check on every navigation, not just on mount — this is what makes
  // the navbar flip to the username right after login/register redirect
  // to /dashboard, since Navbar itself never remounts (it lives in the
  // locale layout, outside the page content that's swapping).
  useEffect(() => {
    let cancelled = false;
    fetchCurrentUser().then((u) => {
      if (cancelled) return;
      setUser(u);
      setAuthChecked(true);
    });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  function handleLogout() {
    clearTokens();
    setUser(null);
    setUserMenuOpen(false);
    setOpen(false);
    router.push("/");
  }

  const navItems = [
    { href: `/`, label: tNav("home") },
    { href: `/about`, label: tNav("about") },
    { href: `/coaches`, label: tNav("coaches") },
    { href: `/pricing`, label: tNav("plans") },
    { href: '/book' , label: tNav("book" )},
    { href: `/contact`, label: tNav("contact") },
  ];


  const isActive = (href:string)=>{
    if(href === `/`)
      return pathname === href;

    return pathname === href || pathname?.startsWith(`${href}/`);
  };


  return (
    <>

    <header
      className="
      relative
      z-[60]
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


      {/* Mobile Menu Toggle — animated hamburger that morphs into an X.
          z-[60] keeps it clickable above the drawer overlay (z-50) so
          the same button opens AND closes the menu. */}

      <button
        onClick={()=>setOpen((o)=>!o)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        className="
        flex
        h-8
        w-8
        flex-col
        items-center
        justify-center
        gap-1.5
        lg:hidden
        "
      >

        <span
          className={`
          h-0.5
          w-6
          rounded-full
          bg-white
          transition-all
          duration-300
          ease-in-out
          ${open ? "translate-y-2 rotate-45" : ""}
          `}
        />

        <span
          className={`
          h-0.5
          w-6
          rounded-full
          bg-white
          transition-all
          duration-300
          ease-in-out
          ${open ? "opacity-0" : "opacity-100"}
          `}
        />

        <span
          className={`
          h-0.5
          w-6
          rounded-full
          bg-white
          transition-all
          duration-300
          ease-in-out
          ${open ? "-translate-y-2 -rotate-45" : ""}
          `}
        />

      </button>



      {/* Logo — centered (image only) on small screens,
          left-aligned with full wordmark on desktop */}

      <Link
        href={`/`}
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
          width={100}
          height={100}
          className="lg:h-[110px] lg:w-[110px]"
        />

        <h1 className="-ml-5 hidden text-2xl font-black tracking-tight text-[#B4E3BD] lg:block font-heading">
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
        dir={locale==="fa" ? "rtl" : "ltr"}
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

        {authChecked && user ? (
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen((o) => !o)}
              aria-expanded={userMenuOpen}
              className="
              flex
              items-center
              gap-2
              rounded-full
              border
              border-[#B4E3BD]/30
              bg-[#B4E3BD]/10
              px-5
              py-2
              text-sm
              font-semibold
              text-[#B4E3BD]
              transition
              hover:border-[#B4E3BD]
              "
            >
              {user.username}
            </button>

            {userMenuOpen && (
              <>
                {/* Click-away catcher */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setUserMenuOpen(false)}
                />
                <div
                  className="
                  absolute
                  end-0
                  z-20
                  mt-2
                  w-44
                  overflow-hidden
                  rounded-xl
                  border
                  border-white/10
                  bg-[#141414]
                  py-1
                  shadow-2xl
                  shadow-black/50
                  "
                >
                  <Link
                    href="/dashboard"
                    onClick={() => setUserMenuOpen(false)}
                    className="block px-4 py-2.5 text-sm text-gray-300 transition hover:bg-white/5 hover:text-[#B4E3BD]"
                  >
                    {tAuth("dashboard")}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full px-4 py-2.5 text-start text-sm text-gray-300 transition hover:bg-white/5 hover:text-red-400"
                  >
                    {tNav("logout")}
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <Link
            href={`/login`}
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
            {tAuth("login")}
          </Link>
        )}

      </div>



      {/* Mobile Right — username (if logged in) + language switcher */}

      <div className="flex items-center gap-3 lg:hidden">
        {authChecked && user && (
          <Link
            href="/dashboard"
            className="max-w-[6rem] truncate text-sm font-semibold text-[#B4E3BD]"
          >
            {user.username}
          </Link>
        )}
        <LanguageSwitcher />
      </div>


    </header>



    {/* Mobile Sidebar */}

    <div
      className={`
      fixed
      inset-0
      z-50
      ${open ? "pointer-events-auto" : "pointer-events-none"}
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
        duration-300
        ${open ? "opacity-100" : "opacity-0"}
        `}
      />



      {/* Sidebar */}

      <aside
        className={`
        absolute
        left-0
        top-0
        h-full
        w-72
        bg-black
        p-8
        transition-transform
        duration-300
        ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >


        <div className="flex flex-col gap-6 pt-20">


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


          {authChecked && user ? (
            <>
              <p className="text-sm text-gray-500">{user.username}</p>

              <Link
                href={`/dashboard`}
                onClick={()=>setOpen(false)}
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

              <button
                onClick={handleLogout}
                className="text-start text-lg text-gray-400"
              >
                {tNav("logout")}
              </button>
            </>
          ) : (
            <Link
              href={`/login`}
              onClick={()=>setOpen(false)}
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
              {tAuth("login")}
            </Link>
          )}


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


{/* Hover underline — a mint line that grows in from the center.
    Hidden while active, since the pill fill already communicates
    the active state; only fires on hover for inactive items. */}
<span
className={`
absolute
bottom-3
left-1/2
h-0.5
w-0
-translate-x-1/2
rounded-full
bg-[#B4E3BD]
transition-all
duration-300
ease-out
${
active
?
"w-0"
:
"group-hover:w-2/3"
}
`}
/>


</Link>

)

}
