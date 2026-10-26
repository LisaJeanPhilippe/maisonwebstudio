import Link from "next/link";

export default function NotFound() {
  return (
    <main className={`grid min-h-dvh place-items-center bg-canvas px-6 text-center`}>
      <div>
        <p className="eyebrow mb-6">404</p>
        <h1 className="text-headline font-medium">This page took a different path.</h1>
        <p className="mt-6 text-lede text-muted">The page you’re looking for doesn’t exist or has moved.</p>
        <Link href="/" className="btn btn-primary mt-10">Back to home</Link>
      </div>
    </main>
  );
}
