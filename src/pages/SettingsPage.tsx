import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { demoConnections } from '@/data/demo';
import { CHANNEL_CONFIG, SocialConnection } from '@/data/types';
import { ExternalLink, RefreshCw, CheckCircle2, XCircle, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [connections, setConnections] = useState<SocialConnection[]>(demoConnections);

  const toggleConnection = (id: string) => {
    setConnections(prev => prev.map(c => {
      if (c.id === id) {
        const newConnected = !c.connected;
        toast.success(newConnected ? `Connected to ${CHANNEL_CONFIG[c.channel].label}` : `Disconnected from ${CHANNEL_CONFIG[c.channel].label}`);
        return { ...c, connected: newConnected, lastSync: newConnected ? new Date().toISOString() : undefined };
      }
      return c;
    }));
  };

  const syncConnection = (id: string) => {
    const conn = connections.find(c => c.id === id);
    if (conn) toast.info(`Syncing ${CHANNEL_CONFIG[conn.channel].label}...`);
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your social accounts and preferences.</p>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="font-display">Social Account Connections</CardTitle>
          <CardDescription>Connect your social media accounts to publish content directly from Spiral Up.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {connections.map(conn => {
              const config = CHANNEL_CONFIG[conn.channel];
              return (
                <div key={conn.id} className="flex items-center gap-4 py-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl" style={{ backgroundColor: `${config.color}15` }}>
                    {config.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{config.label}</p>
                    <p className="text-xs text-muted-foreground">{conn.accountName}</p>
                    {conn.connected && conn.followers && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <Users className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{conn.followers.toLocaleString()} followers</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {conn.connected ? (
                      <>
                        <span className="hidden sm:flex items-center gap-1 text-xs text-success">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                        </span>
                        <Button variant="ghost" size="icon" onClick={() => syncConnection(conn.id)}>
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <span className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
                        <XCircle className="w-3.5 h-3.5" /> Disconnected
                      </span>
                    )}
                    <Switch checked={conn.connected} onCheckedChange={() => toggleConnection(conn.id)} />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="font-display">OAuth Integration</CardTitle>
          <CardDescription>Connect additional accounts using OAuth. No live credentials required for demo.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-muted/50 border border-border">
            <p className="text-sm text-muted-foreground">
              In production, clicking "Connect" would redirect you to each platform's OAuth flow to authorize Spiral Up to post on your behalf. For this demo, use the toggles above to simulate connections.
            </p>
          </div>
          <Button variant="outline" className="gap-2">
            <ExternalLink className="w-4 h-4" /> Add New Social Account
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="font-display">Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {['Ava Chen — Admin', 'Marcus Rivera — Manager', 'Jess Okafor — Creator', 'Kai Tanaka — Creator'].map(member => (
              <div key={member} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center text-xs font-bold text-primary-foreground">
                    {member.split(' ').map(w => w[0]).slice(0, 2).join('')}
                  </div>
                  <span className="text-sm">{member}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
