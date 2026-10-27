import { NotFoundContent } from "@/components/site/not-found-content";

// Rendered for notFound() anywhere under [lang]. The locale comes from the URL
// on the client, because not-found boundaries don't receive route params.
export default function NotFound() {
  return <NotFoundContent />;
}
