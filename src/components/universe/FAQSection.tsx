"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const FAQS = [
  {
    question: "What is Submynt?",
    answer:
      "Submynt is a single place to discover, compare and track every subscription you pay for — streaming, AI tools, productivity, gaming, telecom and more — organized into one browsable catalog.",
  },
  {
    question: "How does Submynt work?",
    answer:
      "Browse subscriptions by category or search for one directly. Each listing shows real pricing, plans, trial terms and ratings, so you can see the details before deciding anything.",
  },
  {
    question: "Can I compare subscription plans and prices?",
    answer:
      "Yes — open any subscription to see its plans and pricing, or use Compare to put two subscriptions side by side and see how they stack up.",
  },
  {
    question: "Can I buy subscriptions through Submynt?",
    answer:
      "No — Submynt doesn't process purchases. Each listing links out to \"Visit Provider,\" which takes you to the provider's own site to subscribe directly.",
  },
  {
    question: "Can I manage my existing subscriptions?",
    answer:
      "Yes — add subscriptions you already pay for to My Subscriptions to track renewal dates and monthly cost, and see potential savings if a cheaper plan is available.",
  },
  {
    question: "How does Submynt make money?",
    answer:
      "Submynt is currently free to browse and compare — we don't charge users directly. Any commercial partnerships never affect the prices or rankings shown.",
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="px-4 py-8 lg:px-8">
      <div className="mx-auto max-w-[1340px]">
        <h2 className="mb-3 text-lg font-semibold text-ink-0">Frequently asked questions</h2>
        <div className="mx-auto flex max-w-2xl flex-col gap-2">
          {FAQS.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={faq.question} className="glass-panel overflow-hidden rounded-2xl">
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left cursor-pointer"
                >
                  <span className="text-sm font-semibold text-ink-0">{faq.question}</span>
                  <ChevronDown
                    size={16}
                    className={cn("shrink-0 text-ink-500 transition-transform duration-200", isOpen && "rotate-180")}
                  />
                </button>
                {isOpen && (
                  <p className="px-4 pb-4 text-sm leading-relaxed text-ink-400">{faq.answer}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
