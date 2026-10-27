import { notFound } from "next/navigation";

// Allow any path here so the branded 404 is rendered on the server (with a 404 status).
export const dynamicParams = true;

/** Any unknown URL inside a language renders the branded 404. */
export default function CatchAll() {
  notFound();
}
