import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ImportSessionRepository } from '@/server/repositories/import-session-repository';
import { ImportSessionDetailClient } from '@/components/studio/imports/import-session-detail-client';

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: 'Import Session Details — Studio | The Jayant Diaries',
  description: 'Detailed item-level processing audit for an archive import session.',
};

export default async function StudioImportDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await ImportSessionRepository.getSessionById(id);

  if (!session) {
    notFound();
  }

  return <ImportSessionDetailClient session={session} />;
}
