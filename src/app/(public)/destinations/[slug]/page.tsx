import { notFound } from "next/navigation";
import { Metadata } from "next";

interface DestinationPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: DestinationPageProps): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `${slug.replace(/-/g, " ").toUpperCase()}`,
    description: `Places and journeys in ${slug}`,
  };
}

export default async function DestinationDetailPage({ params }: DestinationPageProps) {
  const { slug } = await params;

  if (!slug) notFound();

  return (
    <div className="mx-auto max-w-5xl px-6 py-20">
      <div className="space-y-4">
        <span className="text-xs font-semibold uppercase tracking-cinematic text-cinema-accent">
          Destination
        </span>
        <h1 className="font-serif text-4xl font-bold capitalize text-white">
          {slug.replace(/-/g, " ")}
        </h1>
      </div>
    </div>
  );
}
