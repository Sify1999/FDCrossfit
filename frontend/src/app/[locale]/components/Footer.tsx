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

        <div>


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
              width={70}
              height={70}
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

            <a href="https://www.instagram.com/crossfit.fd/" className="flex items-start gap-3 hover:text-[#B4E3BD]">
              <svg className="shrink-0" aria-label="Instagram" fill="#B4E3BD" height="22" role="img" viewBox="0 0 24 26" width="22"><title>Instagram</title><path d="M12 2.982c2.937 0 3.285.011 4.445.064a6.087 6.087 0 0 1 2.042.379 3.408 3.408 0 0 1 1.265.823 3.408 3.408 0 0 1 .823 1.265 6.087 6.087 0 0 1 .379 2.042c.053 1.16.064 1.508.064 4.445s-.011 3.285-.064 4.445a6.087 6.087 0 0 1-.379 2.042 3.643 3.643 0 0 1-2.088 2.088 6.087 6.087 0 0 1-2.042.379c-1.16.053-1.508.064-4.445.064s-3.285-.011-4.445-.064a6.087 6.087 0 0 1-2.043-.379 3.408 3.408 0 0 1-1.264-.823 3.408 3.408 0 0 1-.823-1.265 6.087 6.087 0 0 1-.379-2.042c-.053-1.16-.064-1.508-.064-4.445s.011-3.285.064-4.445a6.087 6.087 0 0 1 .379-2.042 3.408 3.408 0 0 1 .823-1.265 3.408 3.408 0 0 1 1.265-.823 6.087 6.087 0 0 1 2.042-.379c1.16-.053 1.508-.064 4.445-.064M12 1c-2.987 0-3.362.013-4.535.066a8.074 8.074 0 0 0-2.67.511 5.392 5.392 0 0 0-1.949 1.27 5.392 5.392 0 0 0-1.269 1.948 8.074 8.074 0 0 0-.51 2.67C1.012 8.638 1 9.013 1 12s.013 3.362.066 4.535a8.074 8.074 0 0 0 .511 2.67 5.392 5.392 0 0 0 1.27 1.949 5.392 5.392 0 0 0 1.948 1.269 8.074 8.074 0 0 0 2.67.51C8.638 22.988 9.013 23 12 23s3.362-.013 4.535-.066a8.074 8.074 0 0 0 2.67-.511 5.625 5.625 0 0 0 3.218-3.218 8.074 8.074 0 0 0 .51-2.67C22.988 15.362 23 14.987 23 12s-.013-3.362-.066-4.535a8.074 8.074 0 0 0-.511-2.67 5.392 5.392 0 0 0-1.27-1.949 5.392 5.392 0 0 0-1.948-1.269 8.074 8.074 0 0 0-2.67-.51C15.362 1.012 14.987 1 12 1Zm0 5.351A5.649 5.649 0 1 0 17.649 12 5.649 5.649 0 0 0 12 6.351Zm0 9.316A3.667 3.667 0 1 1 15.667 12 3.667 3.667 0 0 1 12 15.667Zm5.872-10.859a1.32 1.32 0 1 0 1.32 1.32 1.32 1.32 0 0 0-1.32-1.32Z"></path></svg>
              <span>{t("ig")}</span>              
            </a>  
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