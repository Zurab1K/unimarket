"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();

  const hideFooter =
    pathname === "/login" ||
    pathname === "/reset-password" ||
    pathname?.startsWith("/onboarding");

  if (hideFooter) return null;

  return (
    <footer className="w-full bg-[#f6f0ea] px-2 pb-6 pt-8 sm:px-3">
      <div className="mx-auto w-full max-w-[calc(100vw-1rem)] rounded-[2rem] border border-[#eadccf] bg-[linear-gradient(180deg,#fffaf6,#f8efe8)] px-6 py-5 text-[#4b2d27] shadow-[0_12px_30px_rgba(75,36,28,0.05)] sm:px-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="lg:flex-1">
            <h2 className="text-2xl font-semibold text-[#2a1714]">
              <span className="text-[rgb(var(--brand-accent))]">Uni</span>
              <span className="text-[rgb(var(--brand-primary))]">Market</span>
            </h2>
            <p className="mt-2 text-sm font-medium text-[#745f59] sm:text-base lg:whitespace-nowrap">
              A student-first marketplace for finding textbooks, dorm essentials, furniture, and everyday campus deals in one place.
            </p>
          </div>

          <div className="flex max-w-md items-center gap-4 rounded-[1.6rem] border border-[#eadccf] bg-[#fffdfb] px-4 py-2.5">
            <a
              href="https://www.sbcs.io/"
              target="_blank"
              rel="noreferrer"
              aria-label="Visit Stony Brook Computing Society"
              className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl bg-white"
            >
              <Image
                src="/sbcs_logo.png"
                alt="Stony Brook Computing Society"
                fill
                sizes="48px"
                className="object-contain"
              />
            </a>
            <div className="text-sm leading-6 text-[#745f59]">
              <p>
                Built through{" "}
                <a
                  href="https://www.sbcs.io/"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-[rgb(var(--brand-primary))] underline underline-offset-4"
                >
                  Stony Brook Computing Society
                </a>
                &apos;s
              </p>
              <p>
                <a
                  href="https://www.sbcs.io/project-quack"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-[rgb(var(--brand-primary))] underline underline-offset-4"
                >
                  Project Quack
                </a>{" "}
                program.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 border-t border-[#eadccf] pt-3 text-sm text-[#8a736b]">
          <div className="flex flex-col gap-3 text-center lg:grid lg:grid-cols-3 lg:items-center lg:text-left">
            <p className="font-medium text-[#6d4037] sm:justify-self-start">
              Built for students, by students.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/team"
                className="font-medium text-[rgb(var(--brand-primary))] underline underline-offset-4 transition hover:text-[rgb(var(--brand-accent))]"
              >
                Team
              </Link>
              <Link
                href="/safety"
                className="font-medium text-[rgb(var(--brand-primary))] underline underline-offset-4 transition hover:text-[rgb(var(--brand-accent))]"
              >
                Safety
              </Link>
              <Link
                href="/terms"
                className="font-medium text-[rgb(var(--brand-primary))] underline underline-offset-4 transition hover:text-[rgb(var(--brand-accent))]"
              >
                Terms
              </Link>
              <Link
                href="/privacy"
                className="font-medium text-[rgb(var(--brand-primary))] underline underline-offset-4 transition hover:text-[rgb(var(--brand-accent))]"
              >
                Privacy
              </Link>
            </div>
            <p className="sm:justify-self-end">© 2026 Zurabi Kochiashvili</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
