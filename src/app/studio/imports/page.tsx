import { Metadata } from 'next';
import { ImportSessionRepository } from '@/server/repositories/import-session-repository';
import { ImportHistoryClient } from '@/components/studio/imports/import-history-client';

export const metadata: Metadata = {
  title: 'Import History — Studio | The Jayant Diaries',
  description: 'Deterministic audit record of media batch imports and session statuses.',
};

export default async function StudioImportsPage() {
  const sessions = await ImportSessionRepository.getAllSessions(100, 0);

  return <ImportHistoryClient initialSessions={sessions} />;
}
