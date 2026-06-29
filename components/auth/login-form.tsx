'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, ShieldCheck, Stethoscope, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { login } from '@/lib/actions/auth.actions'
import { SystemBrand } from '@/components/brand/system-brand'

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'No se pudo iniciar sesión'
}

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await login({ email, password })
      router.push('/dashboard')
    } catch (err: unknown) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid w-full max-w-6xl gap-8 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="relative overflow-hidden rounded-[2rem] border border-rose-100/80 bg-[radial-gradient(circle_at_top_left,rgba(244,114,182,0.28),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(251,207,232,0.38),transparent_40%),linear-gradient(135deg,#fffdfd_0%,#fff4f8_48%,#ffffff_100%)] p-8 shadow-[0_32px_80px_rgba(136,19,55,0.12)] lg:p-12">
        <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_center,rgba(251,207,232,0.34),transparent_58%)] lg:block" />
        <div className="relative z-10 space-y-8">
          <SystemBrand href="" />
          <div className="max-w-xl space-y-4">
            <span className="inline-flex rounded-full border border-rose-200 bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-rose-700">
              Plataforma administrativa
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 lg:text-5xl">
              Operación médica, historia clínica y atención en un solo sistema.
            </h1>
            <p className="max-w-lg text-base leading-7 text-slate-600">
              Davos Salud centraliza pacientes, personal, citas y registros
              clínicos con un flujo diseñado para consulta diaria.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: ShieldCheck,
                title: 'Acceso seguro',
                description: 'Sesiones protegidas y control por roles.',
              },
              {
                icon: Stethoscope,
                title: 'Consulta clínica',
                description: 'Registros, imágenes y seguimiento por paciente.',
              },
              {
                icon: UserRound,
                title: 'Equipo centralizado',
                description: 'Usuarios, personal y agenda en una sola vista.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-rose-100/80 bg-white/80 p-4 backdrop-blur"
              >
                <item.icon className="mb-3 size-5 text-rose-600" />
                <h3 className="font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Card className="border-rose-100/80 bg-white/95 shadow-[0_32px_80px_rgba(136,19,55,0.14)] backdrop-blur">
        <CardContent className="p-8 lg:p-10">
          <div className="mb-8 space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-rose-700">
              Acceso del sistema
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              Iniciar sesión
            </h2>
            <p className="text-sm leading-6 text-slate-500">
              Ingrese sus credenciales para continuar con la operación diaria.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="h-12 border-rose-100 bg-white focus-visible:border-rose-300 focus-visible:ring-rose-200"
                placeholder="doctor@davossalud.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="h-12 border-rose-100 bg-white focus-visible:border-rose-300 focus-visible:ring-rose-200"
                placeholder="••••••••"
              />
            </div>
            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}
            <Button
              type="submit"
              className="h-12 w-full justify-between rounded-xl bg-rose-600 px-5 text-base hover:bg-rose-700"
              disabled={loading}
            >
              <span>{loading ? 'Ingresando...' : 'Entrar a Davos Salud'}</span>
              <ArrowRight className="size-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
