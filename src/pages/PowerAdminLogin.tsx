import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, AlertCircle, Loader2 } from 'lucide-react';
import logoFull from '@/assets/logo-power-full.png';

export default function PowerAdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const success = await login(password);
      if (success) {
        navigate('/dashboard');
      } else {
        setError('Contraseña incorrecta');
        setPassword('');
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-foreground/5 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-foreground/3 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative w-full max-w-md animate-scale-in">
        {/* Logo and branding */}
        <div className="text-center mb-8">
          <img 
            src={logoFull} 
            alt="Power" 
            className="h-32 mx-auto mb-6 invert"
          />
          <p className="text-muted-foreground text-sm tracking-widest uppercase">
            Admin System Protected
          </p>
        </div>

        {/* Login form */}
        <div className="glass-card-elevated p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-muted-foreground">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresa tu contraseña"
                  className="pl-11 h-12 admin-input text-base"
                  disabled={isSubmitting}
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 px-4 py-3 rounded-lg animate-fade-in">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 admin-button text-base"
              disabled={isSubmitting || !password}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Verificando...
                </>
              ) : (
                'Ingresar'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
