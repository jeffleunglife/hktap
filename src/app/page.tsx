"use client";

/* eslint-disable react-hooks/rules-of-hooks */

import dynamicImport from "next/dynamic";
import { Suspense, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import CameraCapture from "./Components/Camera";
import Chat from "./Components/Chat";
import Ranking from "./Components/Ranking";
import Beams from "@/components/Beams";

import Dock from "./Components/Dock";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

const Map = dynamicImport(() => import("./Components/Map"), {
  ssr: false,
  loading: () => <div>Loading map...</div>,
});

export const dynamic = "force-dynamic";

const popContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.18,
      delayChildren: 0.05,
    },
  },
};

const popItem = {
  hidden: { opacity: 0, scale: 0.85, y: 40 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 140, damping: 16 },
  },
};

const pullContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.16, delayChildren: 0.05 },
  },
};

const pullItem = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 140, damping: 18 },
  },
};

const slideFromLeft = {
  hidden: { opacity: 0, x: -80 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "spring", stiffness: 160, damping: 20 },
  },
};

const paintGroup = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.25 },
  },
};

const sketchWipeItem = {
  hidden: {
    opacity: 0,
    clipPath: "polygon(0 0, 0 0, 0 100%, 0 100%)",
  },
  visible: {
    opacity: 1,
    clipPath: [
      "polygon(0 0, 0 0, 0 100%, 0 100%)",
      "polygon(0 0, 55% 0, 40% 100%, 0 100%)",
      "polygon(0 0, 85% 0, 70% 100%, 0 100%)",
      "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
    ],
    transition: {
      opacity: { duration: 0.3, ease: [0.42, 0, 0.58, 1] },
      clipPath: { duration: 1.4, ease: "easeInOut" },
    },
  },
};

const swooshContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.18 },
  },
};

const swooshItem = {
  hidden: { opacity: 0, y: 70, scale: 0.92 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 170, damping: 16 },
  },
};

const magicPop = {
  hidden: { opacity: 0, scale: 0.6 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 210, damping: 14 },
  },
};

const wordsContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const wordVariant = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.6 },
  },
};

const AnimatedWords = ({
  text,
  className,
}: {
  text: string;
  className?: string;
}) => {
  const words = text.split(" ");

  return (
    <motion.p
      className={className}
      variants={wordsContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: false, amount: 0.6 }}
    >
      {words.map((word, index) => (
        <motion.span
          key={`${word}-${index}`}
          variants={wordVariant}
          style={{ display: "inline-block", whiteSpace: "pre" }}
        >
          {word}
          {index < words.length - 1 ? " " : ""}
        </motion.span>
      ))}
    </motion.p>
  );
};

export default function Home() {
  const searchParams = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : ""
  );
  const selectedCategory = searchParams.get("category") || "default";

  const supabaseUrl = "https://sokmrypoigsarqrdmgpq.supabase.co";
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_KEY ??
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNva21yeXBvaWdzYXJxcmRtZ3BxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3MjkwMzksImV4cCI6MjA3MzMwNTAzOX0.Ft4CaoxdTlSANniyiSv3MYSp0QMqLgmuT36yRu6FPwI";

  const [currentCategory, setCurrentCategory] = useState("");
  const [locationsData, setLocationsData] = useState<any[]>([]);

  const [moreOption, setMoreOption] = useState(false);
  const [leaderboard, setLeaderboard] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const [camera, setCamera] = useState(false);
  const [ranking, setRanking] = useState(false);

  const [categories, setCategories] = useState<any[]>([]);
  const [topCategories, setTopCategories] = useState<any[]>([]);

  const [search, setSearch] = useState("");

  const handleAnimationComplete = () => {
    console.log("All letters have animated!");
  };

  const items = [
    {
      icon: "/leaderboard.svg",
      label: "Leaderboard",
      onClick: () => setRanking(true),
    },
    {
      icon: "/add.svg",
      label: "Add Location",
      onClick: () => setCamera(true),
    },
    {
      icon: "/AI.svg",
      label: "AI Assistant",
      onClick: () => setChatOpen(!chatOpen),
    },
  ];

  useEffect(() => {
    async function fetchLocationsData() {
      if (supabaseKey !== undefined) {
        const supabase = createClient(supabaseUrl, supabaseKey);

        try {
          const { data, error } = await supabase
            .from("locations_db")
            .select("*");

          if (error) {
            console.error("Error fetching locations:", error);
          } else {
            setLocationsData(data || []);
          }
        } catch (err) {
          console.error("Failed to fetch locations:", err);
        }
      }
    }

    fetchLocationsData();
  }, [supabaseKey]);

  async function addData() {
    if (supabaseKey !== undefined) {
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data, error } = await supabase
        .from("locations_db")
        .insert([{ title: "someValue", description: "otherValue" }])
        .select();

      if (error) {
        console.log(error);
      }
    }
  }

  async function fetchCategories() {
    if (supabaseKey !== undefined) {
      const supabase = createClient(supabaseUrl, supabaseKey);

      let { data: categories, error } = await supabase
        .from("locations_db")
        .select("category")
        .neq("category", "");

      if (error) {
        console.log(error);
        setCategories([]);
        setTopCategories([]);
      } else {
        const categoryCounts: { [key: string]: number } = (
          categories || []
        ).reduce(
          (
            acc: { [key: string]: number },
            { category }: { category: string }
          ) => {
            if (category) {
              acc[category] = (acc[category] || 0) + 1;
            }
            return acc;
          },
          {}
        );

        const sortedCategories = Object.entries(categoryCounts)
          .map(([category, count]) => ({ category, count }))
          .sort((a, b) => b.count - a.count);

        const allCategories = sortedCategories.map(({ category }) => ({
          category,
        }));

        const topThreeCategories = await Promise.all(
          sortedCategories.slice(0, 3).map(async ({ category }) => {
            const { data: location, error: locationError } = await supabase
              .from("locations_db")
              .select("photo")
              .eq("category", category)
              .neq("photo", "")
              .limit(1)
              .order("id", { ascending: Math.random() > 0.5 });

            if (locationError) {
              console.log(
                `Error fetching photo for ${category}:`,
                locationError
              );
              return { category, photo: "" };
            }

            return {
              category,
              photo: location.length > 0 ? location[0].photo : "",
            };
          })
        );

        setCategories(allCategories);
        setTopCategories(topThreeCategories);
      }
    }
  }

  useEffect(() => {
    fetchCategories();
  }, []);

  function getMatchScore(category: string, search: string) {
    const cat = category.toLowerCase();
    const s = search.toLowerCase();

    let score = 0;
    for (let i = 0; i < s.length; i++) {
      if (cat[i] === s[i]) {
        score++;
      } else {
        break;
      }
    }
    return score;
  }

  return (
    <>
      <Suspense fallback={<div className="w-full h-full flex justify-center items-center fixed"><p>Loading...</p></div>}>
        <div
          className={
            selectedCategory == "default" ? "hidden" : "flex justify-center"
          }
        >
          <div
            onClick={() => {
              window.location.replace(`/`);
            }}
            className="fixed top-5 p-1 px-3 z-[100] bg-indigo-500 cursor-pointer rounded-full"
          >
            <p className="text-white text-sm text-center">
              Category Search: {selectedCategory}, click to dismiss.
            </p>
          </div>
        </div>

        <div className="fixed bg-black z-[100] flex justify-center bottom-0 left-[50%] right-[50%] mb-5">
          <Dock
            items={items}
            panelHeight={68}
            baseItemSize={50}
            magnification={70}
          />
        </div>

        <div className="flex justify-center items-center h-[35em] bg-gray-100 relative">
          <Suspense>
            <Map />
          </Suspense>
        </div>

        <div>
          <div className="sticky bg-white top-0 z-[99] py-15 animate-fade-up animate-ease-in-out px-10">
            <p className="text-center font-bold text-3xl lg:text-5xl">
              Find and Share Your Destinations
            </p>
            <p className="text-center mt-3 text-gray-600">
              A few taps, know where to go on the map; find extraordinary places
              in Hong Kong.
            </p>
          </div>

          <div className=" mt-10 flex justify-center items-center">
            <div>
              <div className="flex justify-center">
                {" "}
                <img className="w-5" src={"/fire-gray.svg"}></img>
              </div>
              <div className="mx-[.1em]"></div>
              <p className="text-center font-semibold text-gray-600 text-sm mt-2">
                TRENDING OPTIONS
              </p>
            </div>
          </div>

          <div className="mt-5 w-full h-[65em] md:h-[25em] lg:h-[35em]">
            <motion.div
              className="grid md:grid-cols-3 h-full"
              variants={popContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false, amount: 0.35 }}
            >
              {topCategories.map((item) => {
                return (
                  <motion.div
                    variants={popItem}
                    onClick={() => {
                      setCurrentCategory(item.category);
                      window.location.replace(`/?category=${item.category}`);
                    }}
                    key={item.category}
                    className="cursor-pointer bg-cover bg-center flex justify-center items-center relative group"
                    style={{
                      backgroundImage: item.photo
                        ? `url(${item.photo})`
                        : "none",
                      backgroundColor: item.photo ? "transparent" : "#e0e0e0",
                    }}
                  >
                    <div className="absolute inset-0 bg-black opacity-50 group-hover:opacity-70 transition-opacity duration-300"></div>
                    <p className="text-white xl:text-2xl font-bold z-10">
                      {item.category.charAt(0).toUpperCase() +
                        item.category.slice(1)}
                    </p>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>

        <div className="mt-[5em] mb-15 flex justify-center">
          <p
            onClick={() =>
              moreOption == true ? setMoreOption(false) : setMoreOption(true)
            }
            className="text-sm underline cursor-pointer"
          >
            View All Options
          </p>
        </div>

        <div
          className={
            moreOption == true
              ? "bg-white h-[35em] w-full absolute z-[50] duration-300 mt-[30em]"
              : "bg-white h-[35em] w-full absolute z-[50] duration-300"
          }
        ></div>

        <div className="relative z-[5] bg-gray-100 h-[35em] overflow-auto border-t-[.1em] border-gray-300">
          <input
            onChange={(e) => setSearch(e.target.value)}
            className="w-full py-5 outline-none px-5"
            placeholder="Search..."
          ></input>
          <div className="grid w-full overflow-auto pb-[50em] border-t-[.1em] border-gray-300">
            {categories

              .map((item) => {
                const cat = item.category.toLowerCase();
                const s = search.toLowerCase().trim();

                let matchScore = 0;

                if (s.length > 0) {
                  const index = cat.indexOf(s);
                  if (index !== -1) {
                    matchScore = s.length + (cat.length - index) * 0.01;
                  }
                }

                return { ...item, matchScore };
              })
              .filter((item) => search === "" || item.matchScore > 0)
              .sort((a, b) => b.matchScore - a.matchScore)
              .map((item) => {
                return (
                  <div
                    key={item.category}
                    onClick={() => {
                      setCurrentCategory(item.category);
                      window.location.replace(`/?category=${item.category}`);
                    }}
                    className="bg-white p-3 py-5 cursor-pointer hover:brightness-[90%] duration-300 border-b-[.1em] border-gray-300"
                  >
                    <p className="ml-2">
                      {item.category.length > 50
                        ? item.category.charAt(0).toUpperCase() +
                          item.category.slice(1, 50) +
                          "..."
                        : item.category.charAt(0).toUpperCase() +
                          item.category.slice(1)}
                    </p>
                  </div>
                );
              })}
          </div>
        </div>

        <div
          className={
            camera == true
              ? "fixed w-full h-full top-0 z-[102]"
              : "fixed w-full h-full top-0 z-[102] hidden"
          }
        >
          <div className="bg-black w-full h-screen top-0 z-[-1] opacity-30 absolute"></div>
          <div className="flex items-center justify-center w-full h-full">
            <CameraCapture onClose={() => setCamera(false)} />
          </div>
        </div>

        <div
          className={
            ranking == true
              ? "fixed w-full h-full top-0 z-[102]"
              : "fixed w-full h-full top-0 z-[102] hidden"
          }
        >
          <div className="bg-black w-full h-screen top-0 z-[-1] opacity-30 absolute"></div>
          <div className="flex items-center justify-center w-full h-full p-4">
            <Ranking onClose={() => setRanking(false)} />
          </div>
        </div>

        <motion.div
          className="mb-[5em] relative z-[80] mt-10 px-10"
          variants={pullContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.4 }}
        >
          <motion.div
            className="flex justify-center items-center mb-5"
            variants={pullItem}
          >
            {" "}
            <img className="w-5" src={"/features.svg"}></img>
            <p className="ml-1 text-center text-gray-600 font-semibold">
              OUR FEATURES
            </p>
          </motion.div>
          <motion.p
            className="text-center text-4xl font-semibold"
            variants={pullItem}
          >
            A better way to share, and a better place to find.
          </motion.p>
          <motion.p
            className="mt-10 text-gray-600 text-center"
            variants={pullItem}
          >
            No more boredom in Hong Kong after using this platform
          </motion.p>
        </motion.div>

        <motion.div
          className="2xl:grid grid-cols-8 gap-5 md:px-10 lg:px-20 relative z-[80]"
          variants={paintGroup}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.3 }}
        >
          <div className="p-4 col-span-3">
            <motion.div
              className="border-2 rounded-xl p-10 border-gray-200 outline-gray-100 outline-6"
              variants={sketchWipeItem}
            >
              <div
                className="w-full h-[20em] rounded-xl"
                style={{
                  backgroundImage: 'url("/location.png")',
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              ></div>

              <p className="text-2xl my-7 font-semibold">
                Instant Location Sharing
              </p>
              <p className="text-gray-600 mt-1 leading-loose lg:h-[10em]">
                Our advanced camera feature automatically records your location
                when you submit, so you don't have to manually input where you
                are. 3, 2, 1... Captured! Share your location without
                interruption!
              </p>
            </motion.div>
          </div>

          <div className="p-4 col-span-3">
            <motion.div
              className="border-2 rounded-xl p-10 border-gray-200 outline-gray-100 outline-6"
              variants={sketchWipeItem}
            >
              <div
                className="w-full h-[20em] rounded-xl"
                style={{
                  backgroundImage: 'url("/heats.png")',
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              ></div>

              <p className="text-2xl my-7 font-semibold">Bring Up the Heat</p>
              <p className="text-gray-600 mt-1 leading-loose lg:h-[10em]">
                We want everyone to participate in this craze. Show your love to
                the locations you are deeply interested in. Show the world what
                you love in Hong Kong by heating them up!
              </p>
            </motion.div>
          </div>

          <div className="p-4 col-span-2">
            <motion.div
              className="border-2 rounded-xl p-10 border-gray-200 outline-gray-100 outline-6"
              variants={sketchWipeItem}
            >
              <div
                className="w-full h-[20em] rounded-xl"
                style={{
                  backgroundImage: 'url("/leaderboard.png")',
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              ></div>

              <p className="text-2xl my-7 font-semibold">Leaderboard</p>
              <p className="text-gray-600 mt-1 leading-loose lg:h-[10em]">
                Learn what is popular in Hong Kong, it's time to grab your
                belongings and go have a look.
              </p>
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          className="2xl:grid grid-cols-6 gap-5 md:px-10 lg:px-20"
          variants={paintGroup}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.3 }}
        >
          <div className="p-4 col-span-2">
            <motion.div
              className="border-2 rounded-xl p-10 border-gray-200 outline-gray-100 outline-6"
              variants={sketchWipeItem}
            >
              <div
                className="w-full h-[20em] rounded-xl"
                style={{
                  backgroundImage: 'url("/unique.png")',
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              ></div>

              <p className="text-2xl my-7 font-semibold">Be the Unique One</p>
              <p className="text-gray-600 mt-1 leading-loose lg:h-[10em]">
                Your recommendation could be so valuable that it becomes red
                with over 500 heats! Oh, it's hot here.
              </p>
            </motion.div>
          </div>
          <div className="p-4 col-span-4">
            <motion.div
              className="border-2 rounded-xl p-10 border-gray-200 outline-gray-100 outline-6"
              variants={sketchWipeItem}
            >
              <div
                className="w-full h-[20em] rounded-xl"
                style={{
                  backgroundImage: 'url("/ai.png")',
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              ></div>

              <p className="text-2xl my-7 font-semibold">
                Powerful AI & Great Database
              </p>
              <p className="text-gray-600 mt-1 leading-loose lg:h-[10em]">
                Enjoy the AI chatbot backed by a massive database integrated
                into our website. You can receive the best and latest
                information by simply stating what you want to it. With the
                advanced model and fresh data, you are promised to get the best
                guidance possible.
              </p>
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          className="2xl:grid grid-cols-2 gap-5 md:px-10 lg:px-20"
          variants={paintGroup}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.3 }}
        >
          <div className="p-4 col-span-1">
            <motion.div
              className="border-2 rounded-xl p-10 border-gray-200 outline-gray-100 outline-6"
              variants={sketchWipeItem}
            >
              <div
                className="w-full h-[20em] rounded-xl"
                style={{
                  backgroundImage: 'url("/category.png")',
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              ></div>

              <p className="text-2xl my-7 font-semibold">Diverse Categories</p>
              <p className="text-gray-600 mt-1 leading-loose lg:h-[10em]">
                We sort locations by their purposes. So, you can find the most
                desirable place by looking at what you can do in particular
                destinations: more warm, welcoming, and straightforward; we have
                the right place for you.
              </p>
            </motion.div>
          </div>
          <div className="p-4 col-span-1">
            <motion.div
              className="border-2 rounded-xl p-10 border-gray-200 outline-gray-100 outline-6"
              variants={paintItem}
            >
              <div
                className="w-full h-[20em] rounded-xl"
                style={{
                  backgroundImage: 'url("/hk.png")',
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              ></div>

              <p className="text-2xl my-7 font-semibold">We Love Hong Kong</p>
              <p className="text-gray-600 mt-1 leading-loose lg:h-[10em]">
                Hong Kong, a fantastic place, is alluring, innovative, and
                exceptional. It is a place that stands up to any adversity; When
                we face troubles, we find solutions. Enthusiasm, solidarity, and
                thoughtfulness made us unique and magical. We love it here!
              </p>
            </motion.div>
          </div>
        </motion.div>

        <div className="relative z-[50] px-10 2xl:px-20 mt-[20em]">
          <div className="lg:flex justify-between items-center">
            <motion.div
              variants={pullContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false, amount: 0.4 }}
            >
              <motion.div
                className="flex items-center mb-5"
                variants={slideFromLeft}
              >
                {" "}
                <img className="w-5" src={"/purpose.svg"}></img>
                <p className="ml-1 text-center text-gray-600 font-semibold">
                  PURPOSE
                </p>
              </motion.div>
              <motion.p
                className="text-5xl lg:text-7xl font-semibold"
                variants={slideFromLeft}
              >
                Why HKTAP?
              </motion.p>
              <motion.p
                className="text-xl lg:w-[35em] 2xl:w-[45em] mt-5 text-gray-600"
                variants={slideFromLeft}
              >
                It's fun, engaging, and filled with love! The best thing?
                Everyone can use it. Every pin in the map is a real human, a
                footprint on Hong Kong; it's real. Find somewhere exciting to
                go, and share somewhere worth your time.
              </motion.p>

              <motion.div className="mt-10" variants={slideFromLeft}>
                <a
                  onClick={() => setCamera(true)}
                  className=" text-xl cursor-pointer bg-black text-white px-5 py-2 rounded-xl hover:px-10 duration-300"
                >
                  「Try to Take a Snapshot」
                </a>
              </motion.div>
            </motion.div>
            <motion.div
              className="flex justify-center rounded-xl lg:ml-15"
              variants={fadeIn}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false, amount: 0.4 }}
            >
              <video
                className="rounded-xl w-[30em] mt-20 lg:mt-0"
                loop
                autoPlay
                muted
              >
                <source src="hktap-intro.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </motion.div>
          </div>
        </div>

        <div className="mt-[20em] px-3 md:px-10">
          <motion.div
            className="flex flex-col items-center"
            variants={pullContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.4 }}
          >
            <motion.div
              className="flex justify-center items-center mb-5"
              variants={pullItem}
            >
              {" "}
              <img className="w-5" src={"/team.svg"}></img>
              <p className="ml-1 text-center text-gray-600 font-semibold">
                OUR TEAM
              </p>
            </motion.div>
            <motion.p
              className="text-center text-3xl lg:text-5xl w-[20em] leading-tight font-semibold"
              variants={pullItem}
            >
              Developed by Four Aspiring Talented Youth in Hong Kong
            </motion.p>
          </motion.div>
          <div className="flex justify-center">
            <motion.p
              className="text-center mt-5 text-gray-600"
              variants={magicPop}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false, amount: 0.6 }}
            >
              The platform is built by a group of Gen Zs
            </motion.p>
          </div>

          <motion.div
            className="grid md:grid-cols-2 2xl:grid-cols-4 gap-5 md:px-10 2xl:px-20 mt-20"
            variants={swooshContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.3 }}
          >
            <motion.div className="border-[.1em] p-5 h-[40em]" variants={swooshItem}>
              <div
                className="w-full h-[25em] bg-center bg-cover"
                style={{ backgroundImage: "url('/ricky.png')" }}
              ></div>
              <p className="mt-2 text-xl font-semibold">Ricky Chan</p>
              <p className="text-gray-600">Developer & Designer</p>
              <div className="mt-2">
                <Link
                  className="text-xs underline"
                  href={"https://rickychan.xyz/"}
                >
                  rickychan.xyz
                </Link>
              </div>
              <p className="mt-10 text-xs">
                "Be extraordinary; not just be different, but unique with the
                greatest endeavor."—Ricky Chan
              </p>
            </motion.div>

            <motion.div className="border-[.1em] p-5 h-[40em]" variants={swooshItem}>
              <div
                className="w-full h-[25em] bg-center bg-contain bg-no-repeat"
                style={{ backgroundImage: "url('/owenisas.png')" }}
              ></div>
              <p className="mt-2 text-xl font-semibold">Thomas Suen</p>
              <p className="text-gray-600">Developer & Photographer</p>
              <div className="mt-2">
                <Link
                  className="text-xs underline"
                  href={"https://owenisas.com/"}
                >
                  owenisas.com
                </Link>
              </div>
              <p className="mt-10 text-xs">
                "Creating digital experiences with passion and
                precision."—Thomas Suen
              </p>
            </motion.div>

            <motion.div className="border-[.1em] p-5 h-[40em]" variants={swooshItem}>
              <div
                className="w-full h-[25em] bg-center bg-cover"
                style={{ backgroundImage: "url('/jeff.png')" }}
              ></div>
              <p className="mt-2 text-xl font-semibold">Jeff Leung</p>
              <p className="text-gray-600">Creative Strategist</p>
              <div className="mt-2">
                <Link
                  className="text-xs underline"
                  href={
                    "https://youtube.com/@jeffleunglife?si=vPzGQT0VDA4dcLFp"
                  }
                >
                  YouTube Channel
                </Link>
              </div>
              <p className="mt-10 text-xs">
                "Heaven definitely creates us for a purpose. Heads down on best
                creations, riches will return in season."—Jeff Leung
              </p>
            </motion.div>

            <motion.div className="border-[.1em] p-5 h-[40em]" variants={swooshItem}>
              <div
                className="w-full h-[25em] bg-center bg-cover"
                style={{ backgroundImage: "url('/chm.png')" }}
              ></div>
              <p className="mt-2 text-xl font-semibold">Jade Chan</p>
              <p className="text-gray-600">Designer & Analyst</p>
              <div className="mt-2">
                <Link className="text-xs underline" href={"/"}>
                  N/A
                </Link>
              </div>
              <p className="mt-10 text-xs">
                "Do the right thing with perseverance."—Jade Chan
              </p>
            </motion.div>
          </motion.div>
        </div>

        <div className="mt-[20em]">
          <div style={{ width: "100%", height: "600px", position: "absolute" }}>
            <Beams
              beamWidth={2}
              beamHeight={15}
              beamNumber={12}
              lightColor="#ffffff"
              speed={2}
              noiseIntensity={1.75}
              scale={0.2}
              rotation={35}
            />
          </div>

          <motion.div
            className="flex justify-center relative z-[50] text-white items-center"
            variants={fadeIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.35 }}
          >
            <div className="mt-[14em]">
              <AnimatedWords
                className="text-center text-3xl lg:text-5xl font-semibold"
                text="Learn About Our Ideas and Initiatives"
              />
              <motion.div
                className="flex justify-center mt-10"
                variants={pullItem}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: false, amount: 0.6 }}
              >
                <Link
                  className="bg-white p-5 px-20 text-black hover:px-30 duration-300 rounded-xl"
                  target="_blank"
                  href="https://devpost.com/software/hktap"
                >
                  Learn More
                </Link>
              </motion.div>
            </div>
          </motion.div>

        </div>

        <section className="bg-white pt-24">
          <motion.div
            className="flex justify-center"
            variants={fadeIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.5 }}
          >
            <motion.p
              className="text-center text-3xl lg:text-5xl font-semibold"
              variants={pullItem}
            >
              AND
            </motion.p>
          </motion.div>

          <div className="mt-16 mb-[20em] flex justify-center rounded-xl px-10">
            <Link href={"https://github.com/RedTotally/hktap"}>
              <img
                className="w-[65em] rounded-xl cursor-pointer  hover:brightness-[90%] duration-300"
                src={"/open-source.png"}
              ></img>
            </Link>
          </div>
        </section>

        <footer className="mb-[25em] px-10">
          <p className="text-center">
            © 2025 HKTAP | Developed with ❤️ | AWS AI Hackathon Hong Kong 🇭🇰
          </p>

          <p className="text-center text-xs mt-2">We Develop the <Link className="underline" target="_blank" href={"https://en.wikipedia.org/wiki/Supercalifragilisticexpialidocious"}>Supercalifragilisticexpialidocious</Link> ✨</p>
        </footer>

        <div className="relative z-[103]">
          <Chat
            locationsData={locationsData}
            supabaseUrl={supabaseUrl}
            supabaseKey={supabaseKey}
            isOpen={chatOpen}
            onToggle={() => setChatOpen(!chatOpen)}
          />
        </div>
      </Suspense>
    </>
  );
}
