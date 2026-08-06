"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";


export default function Footer() {

  const locale = useLocale();

  const t = useTranslations("footer");


  const links = [
    {
      href: `/${locale}`,
      label: t("links.home"),
    },
    {
      href: `/${locale}/about`,
      label: t("links.about"),
    },
    {
      href: `/${locale}/coaches`,
      label: t("links.coaches"),
    },
    {
      href: `/${locale}/pricing`,
      label: t("links.pricing"),
    },
    {
      href: `/${locale}/contact`,
      label: t("links.contact"),
    },
  ];



  return (

    <footer
      className="
      bg-black
      px-6
      pt-20
      text-white
      sm:px-12
      text-center md:text-left
      justify-center md:justify-start
      "
    >


      <div
        className="
        mx-auto
        grid
        max-w-6xl
        gap-12
        border-b
        border-white/10
        pb-16
        md:grid-cols-3
        "
      >



        {/* Brand */}

        <div className="flex flex-col items-center md:items-start">


          <Link
            href={`/${locale}`}
            className="
            flex
            items-center
            "
          >

            <Image
              src="/images/fdLogo.png"
              alt="FD Crossfit Logo"
              width={100}
              height={100}
            />


            <span
              className="
              -ml-3
              text-2xl
              font-bold
              text-[#B4E3BD]
              "
            >
              FDCrossfit
            </span>


          </Link>



          <p
            className="
            mt-5
            max-w-xs
            leading-relaxed
            text-gray-400
            "
          >
            {t("description")}
          </p>



          <Link
            href={`/${locale}/auth/register`}
            className="
            mt-8
            inline-block
            rounded-full
            bg-[#B4E3BD]
            px-7
            py-3
            font-semibold
            text-black
            transition
            hover:bg-white
            "
          >
            {t("join")}
          </Link>


        </div>





        {/* Navigation */}

        <div>


          <h3
            className="
            mb-5
            text-lg
            font-bold
            uppercase
            tracking-wide
            text-[#B4E3BD]
            "
          >
            {t("navigation")}
          </h3>



          <ul
            className="
            space-y-3
            "
          >

            {links.map((link)=>(

              <li key={link.href}>

                <Link
                  href={link.href}
                  className="
                  text-gray-400
                  transition
                  hover:text-[#B4E3BD]
                  "
                >
                  {link.label}
                </Link>


              </li>

            ))}


          </ul>


        </div>







        {/* Contact */}

        <div>


          <h3
            className="
            mb-5
            text-lg
            font-bold
            uppercase
            tracking-wide
            text-[#B4E3BD]
            "
          >
            {t("contact")}
          </h3>




          <div
            className="
            space-y-5
            text-gray-400
            flex
            flex-col
            items-center
            md:items-start
            space-y-5
            text-gray-400
            "
          >



            <ContactItem
              icon="/icons/map.svg"
              text={t("address")}
            />


            <ContactItem
              icon="/icons/phone.svg"
              text={t("phone")}
            />


            <ContactItem
              icon="/icons/mail.svg"
              text={t("email")}
            />

            <ContactItem
              icon="/icons/instagram.svg"
              text={t("instagram")}
            />
          </div>

        </div>



      </div>






      {/* Bottom */}

      <div
        className="
        py-6
        text-center
        text-sm
        text-gray-500
        "
      >

        © {new Date().getFullYear()} FDCrossfit.
        {t("rights")}

      </div>



    </footer>

  );
}





function ContactItem({
  icon,
  text,
}: {
  icon: string;
  text: string;
}) {

  return (

    <div
      className="
      flex
      items-center
      gap-3
      "
    >

      <Image
        src={icon}
        alt=""
        width={22}
        height={22}
        className="shrink-0"
      />


      <span>
        {text}
      </span>


    </div>

  );

}