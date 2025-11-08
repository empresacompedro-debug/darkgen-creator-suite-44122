import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, Check, Trash2, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Alert {
  id: string;
  monitor_id: string;
  video_id: string;
  alert_type: string;
  alert_message: string;
  video_data: any;
  is_read: boolean;
  created_at: string;
}

export function AlertsPanel() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadAlerts();
    
    // Real-time subscription para novos alertas
    const channel = supabase
      .channel('alerts-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'competitor_alerts'
        },
        (payload) => {
          setAlerts(prev => [payload.new as Alert, ...prev]);
          toast({
            title: "🔔 Novo Alerta!",
            description: (payload.new as Alert).alert_message,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadAlerts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('competitor_alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      setAlerts(data);
    }
    setLoading(false);
  };

  const markAsRead = async (alertId: string) => {
    const { error } = await supabase
      .from('competitor_alerts')
      .update({ is_read: true })
      .eq('id', alertId);

    if (!error) {
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, is_read: true } : a));
    }
  };

  const deleteAlert = async (alertId: string) => {
    const { error } = await supabase
      .from('competitor_alerts')
      .delete()
      .eq('id', alertId);

    if (!error) {
      setAlerts(prev => prev.filter(a => a.id !== alertId));
      toast({ title: "Alerta removido" });
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = alerts.filter(a => !a.is_read).map(a => a.id);
    
    if (unreadIds.length === 0) return;

    const { error } = await supabase
      .from('competitor_alerts')
      .update({ is_read: true })
      .in('id', unreadIds);

    if (!error) {
      setAlerts(prev => prev.map(a => ({ ...a, is_read: true })));
      toast({ title: `${unreadIds.length} alertas marcados como lidos` });
    }
  };

  const unreadCount = alerts.filter(a => !a.is_read).length;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Carregando alertas...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <CardTitle>Alertas de Concorrentes</CardTitle>
          {unreadCount > 0 && (
            <Badge variant="destructive">{unreadCount}</Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button onClick={markAllAsRead} variant="outline" size="sm">
            <Check className="h-4 w-4 mr-2" />
            Marcar Todos como Lidos
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-8">
            <BellOff className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Nenhum alerta ainda</p>
            <p className="text-sm text-muted-foreground mt-1">
              Você será notificado quando concorrentes publicarem vídeos explosivos
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border-2 ${
                  alert.is_read 
                    ? 'border-border bg-muted/20' 
                    : 'border-primary bg-primary/5'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={alert.is_read ? "secondary" : "default"}>
                        {alert.alert_type === 'explosive_video' && '🔥'}
                        {alert.alert_type === 'high_vph' && '🚀'}
                        {alert.alert_type === 'viral' && '⭐'}
                        {' '}
                        {alert.alert_type.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(alert.created_at).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-sm font-medium mb-2">{alert.alert_message}</p>
                    {alert.video_data && (
                      <div className="flex items-center gap-2 mt-2">
                        <img 
                          src={alert.video_data.thumbnail_url} 
                          alt=""
                          className="w-20 h-12 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium line-clamp-2">
                            {alert.video_data.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {alert.video_data.vph} VPH • {alert.video_data.view_count?.toLocaleString()} views
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {!alert.is_read && (
                      <Button
                        onClick={() => markAsRead(alert.id)}
                        variant="ghost"
                        size="icon"
                        title="Marcar como lido"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      asChild
                      variant="ghost"
                      size="icon"
                      title="Ver vídeo"
                    >
                      <a 
                        href={`https://youtube.com/watch?v=${alert.video_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Eye className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button
                      onClick={() => deleteAlert(alert.id)}
                      variant="ghost"
                      size="icon"
                      title="Remover"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
