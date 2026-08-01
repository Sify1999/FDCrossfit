"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";

// Images are stored as data so adding a new gym photo
// only requires adding another object here.
const GYM_IMAGES = [
  { id: "gym1", image: "/images/gym/gym1.jpg" },
  { id: "gym2", image: "/images/gym/gym2.jpg" },
  { id: "gym3", image: "/images/gym/gym3.jpg" },
  { id: "gym4", image: "/images/gym/gym4.jpg" },
];


export default function GymGallery() {

  const t = useTranslations("home.gymGallery");

  const [index, setIndex] = useState(0);

  // Stores where the drag started.
  // Pointer events work for both mouse and touch screens.
  const [dragStart, setDragStart] = useState<number | null>(null);



  function next() {
    setIndex((i) => (i + 1) % GYM_IMAGES.length);
  }


  function previous() {
    setIndex(
      (i) => (i - 1 + GYM_IMAGES.length) % GYM_IMAGES.length
    );
  }



  function handlePointerDown(
    e: React.PointerEvent
  ) {

    setDragStart(e.clientX);

  }



  function handlePointerUp(
    e: React.PointerEvent
  ) {

    if (dragStart === null)
      return;


    const distance = dragStart - e.clientX;


    // Minimum movement required
    // to prevent accidental slides.

    if (distance > 50)
      next();


    if (distance < -50)
      previous();


    setDragStart(null);

  }



  return (

    <section
      className="
      relative
      overflow-hidden
      bg-[#111111]
      px-6
      py-28
      text-white
      sm:px-12
      "
    >


      <div
        className="
        mx-auto
        max-w-6xl
        "
      >


        {/* Section heading */}

        <div
          className="
          mb-12
          text-center
          "
        >

          <span
            className="
            mb-4
            block
            text-sm
            font-bold
            uppercase
            tracking-tight  
            text-[#B4E3BD]
            "
          >
            {t("eyebrow")}
          </span>


          <h2
            className="
            text-4xl
            font-black
            uppercase
            tracking-wide
            sm:text-5xl
            "
          >
            {t("title")}
          </h2>


        </div>





        {/* Image slider */}

        <div
          className="
          relative
          aspect-video
          cursor-grab
          overflow-hidden
          rounded-3xl
          border
          border-[#B4E3BD]/10
          shadow-2xl
          active:cursor-grabbing
          "
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
        >


          {GYM_IMAGES.map((gym, i) => (

            <div
              key={gym.id}
              className={`
              absolute
              inset-0
              transition-all
              duration-700

              ${
                i === index
                  ? "scale-100 opacity-100"
                  : "pointer-events-none scale-105 opacity-0"
              }

              `}
            >

              <Image
                src={gym.image}
                alt="FD Crossfit gym"
                fill
                draggable={false}
                className="
                select-none
                object-cover
                "
              />


              {/* Dark overlay for better contrast */}

              <div
                className="
                absolute
                inset-0
                bg-black/20
                "
              />

            </div>

          ))}


        </div>





        {/* Navigation dots */}

        <div
          className="
          mt-8
          flex
          justify-center
          gap-3
          "
        >

          {GYM_IMAGES.map((gym, i) => (

            <button
              key={gym.id}
              onClick={() => setIndex(i)}
              aria-label={`Show gym image ${i + 1}`}
              className={`
              h-2
              rounded-full
              transition-all
              duration-300

              ${
                i === index
                  ? "w-10 bg-[#B4E3BD]"
                  : "w-2 bg-white/30 hover:bg-white/60"
              }

              `}
            />

          ))}

        </div>



      </div>


    </section>

  );
}