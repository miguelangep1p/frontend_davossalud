import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background px-4 text-center">
      <ShieldAlert className="mx-auto h-24 w-24 text-destructive animate-pulse" />
      <h1 className="mt-8 text-4xl font-extrabold tracking-tight lg:text-5xl">
        403
      </h1>
      <h2 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
        No tienes permisos suficientes
      </h2>
      <p className="mt-4 max-w-lg text-lg text-muted-foreground">
        Lo sentimos, no cuentas con los permisos necesarios para acceder a esta sección. Si crees que esto es un error, por favor contacta al administrador del sistema.
      </p>
      <div className="mt-8">
        <Link href="/">
          <Button size="lg" className="rounded-full shadow-lg hover:shadow-xl transition-all">
            Volver al inicio
          </Button>
        </Link>
      </div>
    </div>
  );
}
