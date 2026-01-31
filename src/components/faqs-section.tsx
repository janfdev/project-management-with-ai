"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { DynamicIcon, type IconName } from "lucide-react/dynamic";
import Link from "next/link";

type FAQItem = {
  id: string;
  icon: IconName;
  question: string;
  answer: string;
};

export default function FAQsThree() {
  const faqItems: FAQItem[] = [
    {
      id: "item-1",
      icon: "trophy",
      question:
        "Apa perbedaan utama Biznovation dengan Jira, Trello, atau Asana?",
      answer:
        "Biznovation tidak hanya mencatat status tugas, tetapi menilai kualitas eksekusi kerja melalui bukti nyata dan audit AI, sehingga performa dapat dievaluasi secara objektif.",
    },
    {
      id: "item-2",
      icon: "credit-card",
      question: "Apakah AI di Biznovation menggantikan peran manajer?",
      answer:
        "Tidak. AI berfungsi sebagai asisten dan auditor awal, bukan pengambil keputusan. Keputusan akhir tetap di tangan Project Manager atau HR.",
    },
    {
      id: "item-3",
      icon: "atom",
      question: "Apakah sistem ini memantau karyawan secara berlebihan?",
      answer:
        "Tidak. Biznovation dirancang untuk mendukung produktivitas, bukan pengawasan. Data yang dikumpulkan hanya terkait eksekusi tugas yang memang relevan dengan pekerjaan.",
    },
    {
      id: "item-4",
      icon: "globe",
      question: "Apakah Quality Score AI bersifat final?",
      answer:
        "Tidak. Quality Score adalah indikator awal, bukan nilai akhir. Manajer dapat memvalidasi atau menyesuaikan berdasarkan konteks.",
    },
    {
      id: "item-5",
      icon: "squircle",
      question: "Bagaimana sistem menangani keterlambatan tugas?",
      answer:
        "AI mendeteksi risiko lebih awal dan memberikan rekomendasi. Penyesuaian tetap dilakukan oleh manusia, bukan otomatis oleh sistem.",
    },
  ];

  return (
    <section className="py-16 md:py-32">
      <div className="mx-auto max-w-5xl px-4 md:px-6">
        <div className="flex flex-col gap-10 md:flex-row md:gap-16">
          <div className="md:w-1/3">
            <div className="sticky top-20">
              <h2 className="mt-4 text-3xl font-bold">
                Frequently Asked Questions
              </h2>
              <p className="text-muted-foreground mt-4">
                {`Can't find what you're looking for? Contact our{' '}`}
                <Link
                  href="#"
                  className="text-primary font-medium hover:underline"
                >
                  customer support team
                </Link>
              </p>
            </div>
          </div>
          <div className="md:w-2/3">
            <Accordion type="single" collapsible className="w-full space-y-2">
              {faqItems.map((item) => (
                <AccordionItem
                  key={item.id}
                  value={item.id}
                  className="bg-background shadow-xs rounded-lg border px-4 last:border-b"
                >
                  <AccordionTrigger className="cursor-pointer items-center py-5 hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="flex size-6">
                        <DynamicIcon
                          name={item.icon}
                          className="m-auto size-4"
                        />
                      </div>
                      <span className="text-base">{item.question}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-5">
                    <div className="px-9">
                      <p className="text-base">{item.answer}</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </section>
  );
}
