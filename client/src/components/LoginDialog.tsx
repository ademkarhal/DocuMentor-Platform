import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore, useTranslation } from "@/hooks/use-store";
import { Lock, Loader2 } from "lucide-react";

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  authUrl?: string;
}

export function LoginDialog({ open, onOpenChange, onSuccess, authUrl }: LoginDialogProps) {
  const { t } = useTranslation();
  const { login } = useStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (open) {
      setUsername("");
      setPassword("");
      setError(false);
      setLoading(false);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, authUrl: authUrl || '' })
      });
      
      if (response.ok) {
        login(username, password);
        setUsername("");
        setPassword("");
        setError(false);
        onOpenChange(false);
        onSuccess?.();
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-login">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-muted-foreground" />
            <DialogTitle>{t.loginRequired}</DialogTitle>
          </div>
          <DialogDescription>{t.loginDescription}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">{t.username}</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t.username}
              data-testid="input-username"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t.password}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t.password}
              data-testid="input-password"
            />
          </div>
          {error && (
            <p className="text-sm text-destructive" data-testid="text-login-error">
              {t.loginError}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={loading} data-testid="button-login-submit">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t.login}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
