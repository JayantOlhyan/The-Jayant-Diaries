import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function StudioSettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-white">Archive Settings</h1>
        <p className="text-xs text-studio-muted">Configure archive identity, backups, and storage.</p>
      </div>

      <Card className="bg-studio-surface border-studio-border">
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-studio-muted">
            Archive Ownership
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-xs text-studio-muted">
          <p>
            <strong className="text-white">Canonical Owner:</strong> Jayant Olhyan
          </p>
          <p>
            <strong className="text-white">Database Status:</strong> PostgreSQL Relational Storage Active
          </p>
          <p>
            <strong className="text-white">Export Availability:</strong> Direct SQL and JSON dump exportable anytime.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
