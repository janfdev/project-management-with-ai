import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { TextEffect } from "@/components/ui/text-effect";
import { AnimatedGroup } from "@/components/ui/animated-group";
import { HeroHeader } from "./header";


export default function HeroSection() {
  return (
    <>
      <HeroHeader />
      <main className="overflow-hidden bg-zinc-950 text-white min-h-screen">
        <div
          aria-hidden
          className="absolute inset-0 isolate hidden contain-strict lg:block"
        >
          {/* Background decorations */}
          <div className="w-140 h-320 -translate-y-87.5 absolute left-0 top-0 -rotate-45 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,hsla(0,0%,85%,.08)_0,hsla(0,0%,55%,.02)_50%,hsla(0,0%,45%,0)_80%)]" />
          <div className="h-320 absolute left-0 top-0 w-60 -rotate-45 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.06)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)] [translate:5%_-50%]" />
          <div className="h-320 -translate-y-87.5 absolute left-0 top-0 w-60 -rotate-45 bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.04)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)]" />
        </div>
        <section>
          <div className="relative pt-24 pb-32">
            <div className="absolute inset-0 -z-10 size-full [background:radial-gradient(125%_125%_at_50%_100%,transparent_0%,#000_75%)]"></div>
            <div className="mx-auto max-w-5xl px-6">
              <div className="sm:mx-auto lg:mr-auto lg:mt-0 text-center lg:text-left">
                <TextEffect
                  preset="fade-in-blur"
                  speedSegment={0.3}
                  as="h1"
                  className="mt-8 max-w-3xl text-balance text-5xl font-medium md:text-6xl lg:mt-16 tracking-tight text-white"
                >
                  Workload Intelligence Platform
                </TextEffect>
                <TextEffect
                  per="line"
                  preset="fade-in-blur"
                  speedSegment={0.3}
                  delay={0.5}
                  as="p"
                  className="mt-8 max-w-2xl text-pretty text-lg text-zinc-400"
                >
                  Stop guessing. Start measuring. Assess performance objectively
                  based on real execution data, powered by AI.
                </TextEffect>

                <AnimatedGroup
                  variants={{
                    container: {
                      visible: {
                        transition: {
                          staggerChildren: 0.05,
                          delayChildren: 0.75,
                        },
                      },
                    },
                    item: {
                      hidden: {
                        opacity: 0,
                        filter: "blur(12px)",
                        y: 12,
                      },
                      visible: {
                        opacity: 1,
                        filter: "blur(0px)",
                        y: 0,
                        transition: {
                          type: "spring",
                          bounce: 0.3,
                          duration: 1.5,
                        },
                      },
                    },
                  }}
                  className="mt-12 flex items-center gap-4"
                >
                  <div
                    key={1}
                    className="bg-zinc-800 rounded-[calc(var(--radius-xl)+0.125rem)] border border-zinc-700 p-0.5"
                  >
                    <Button
                      asChild
                      size="lg"
                      className="rounded-xl px-6 text-base bg-white text-black hover:bg-zinc-200"
                    >
                      <Link href="/auth/login">
                        <span className="text-nowrap font-medium">
                          Get Started
                        </span>
                      </Link>
                    </Button>
                  </div>
                  <Button
                    key={2}
                    asChild
                    size="lg"
                    variant="ghost"
                    className="h-10.5 rounded-xl px-6 text-base text-zinc-300 hover:text-white hover:bg-zinc-800"
                  >
                    <Link href="#">
                      <span className="text-nowrap">Live Demo</span>
                    </Link>
                  </Button>
                </AnimatedGroup>
              </div>
            </div>
            <AnimatedGroup
              variants={{
                container: {
                  visible: {
                    transition: {
                      staggerChildren: 0.05,
                      delayChildren: 0.75,
                    },
                  },
                },
                item: {
                  hidden: {
                    opacity: 0,
                    filter: "blur(12px)",
                    y: 12,
                  },
                  visible: {
                    opacity: 1,
                    filter: "blur(0px)",
                    y: 0,
                    transition: {
                      type: "spring",
                      bounce: 0.3,
                      duration: 1.5,
                    },
                  },
                },
              }}
            >
              <div className="mask-b-from-55% relative mt-16 overflow-hidden px-4 md:px-0">
                <div className="mx-auto max-w-6xl overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/50 shadow-2xl p-2">
                  <Image
                    src="/dashboard.png"
                    alt="Workload Intelligence Dashboard"
                    className="size-full rounded-xl object-cover object-top border border-zinc-800"
                    width="3276"
                    height="4095"
                    priority
                  />
                </div>
              </div>
            </AnimatedGroup>
          </div>
        </section>
      </main>
    </>
  );
}
