import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Ghost } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background px-4 text-center">
      <Ghost className="mx-auto h-24 w-24 text-muted-foreground animate-bounce" />
      <h1 className="mt-8 text-4xl font-extrabold tracking-tight lg:text-5xl">
        404
      </h1>
      <h2 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
        Página no encontrada
      </h2>
      <p className="mt-4 max-w-lg text-lg text-muted-foreground">
        Lo sentimos, no pudimos encontrar la página que estás buscando. Puede que la URL sea incorrecta o que la página haya sido movida.
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
