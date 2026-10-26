import type { Metadata } from "next";
import { SelectedWork } from "@/components/site/selected-work";
import { CtaBand } from "@/components/site/cta-band";
import { Reveal } from "@/components/ui/reveal";

export const metadata: Metadata = {
  title: "Work",
  description: "Sample websites designed by Masion Web Studio for beauty, restaurant, wellness and professional service businesses.",
};

export default function WorkPage() {
  return (
    <>
      <section className="container-page pb-14 pt-16 md:pb-20 md:pt-28">
        <Reveal>
          <p className="eyebrow mb-8">Selected Work</p>
          <h1 className="max-w-[14ch] text-display font-medium text-balance">Every business deserves its own look.</h1>
          <p className="mt-8 max-w-xl text-lede text-muted">
            Explore sample sites we’ve designed across industries. Open any project to see the full
            case study and a live, interactive version of the site.
          </p>
        </Reveal>
      </section>
      <section className="container-page pb-[var(--space-section)]">
        <SelectedWork />
      </section>
      <CtaBand title="Like what you see? Let’s design yours." />
    </>
  );
}
