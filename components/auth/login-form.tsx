'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { login } from '@/lib/actions/auth.actions'
import { cn } from '@/lib/utils'

type FieldErrors = { email?: string; password?: string }

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'No se pudo iniciar sesión'
}

function validate(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {}
  if (!email.trim()) errors.email = 'Ingresa tu correo'
  else if (!EMAIL_PATTERN.test(email.trim())) errors.email = 'Revisa el formato del correo'
  if (!password) errors.password = 'Ingresa tu contraseña'
  return errors
}

const inputClass =
  'h-11 rounded-xl border-slate-200 bg-white pl-10 text-sm placeholder:text-slate-400 focus-visible:border-rose-300 focus-visible:ring-rose-100'

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [capsLock, setCapsLock] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const errors = validate(email, password)
    setFieldErrors(errors)
    if (errors.email || errors.password) return

    setLoading(true)
    try {
      await login({ email: email.trim(), password })
      router.push('/dashboard')
    } catch (err: unknown) {
      setError(getErrorMessage(err))
      setLoading(false)
    }
  }

  function handlePasswordKey(e: React.KeyboardEvent<HTMLInputElement>) {
    setCapsLock(e.getModifierState('CapsLock'))
  }

  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="mb-8 flex flex-col items-center text-center">
        <Image
          src="/davos-salud-logo.jpeg"
          alt="Davos Salud"
          width={72}
          height={56}
          className="mb-4 h-14 w-[72px] rounded-xl object-cover"
          priority
        />
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Bienvenido
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Inicia sesión para continuar
        </p>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_20px_50px_rgba(136,19,55,0.08)] sm:p-8">
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="email">Correo</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={e => {
                  setEmail(e.target.value)
                  if (fieldErrors.email) setFieldErrors(f => ({ ...f, email: undefined }))
                }}
                aria-invalid={!!fieldErrors.email}
                aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                className={inputClass}
                placeholder="tucorreo@ejemplo.com"
              />
            </div>
            {fieldErrors.email ? (
              <p id="email-error" className="text-xs text-rose-600">
                {fieldErrors.email}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={e => {
                  setPassword(e.target.value)
                  if (fieldErrors.password) setFieldErrors(f => ({ ...f, password: undefined }))
                }}
                onKeyUp={handlePasswordKey}
                onKeyDown={handlePasswordKey}
                onBlur={() => setCapsLock(false)}
                aria-invalid={!!fieldErrors.password}
                aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                className={cn(inputClass, 'pr-11')}
                placeholder="Tu contraseña"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute top-1/2 right-1.5 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600 focus-visible:ring-2 focus-visible:ring-rose-200 focus-visible:outline-none"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {fieldErrors.password ? (
              <p id="password-error" className="text-xs text-rose-600">
                {fieldErrors.password}
              </p>
            ) : capsLock ? (
              <p className="text-xs text-amber-600">Bloq Mayús está activado</p>
            ) : null}
          </div>

          {error ? (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700"
            >
              {error}
            </div>
          ) : null}

          <Button
            type="submit"
            className="h-11 w-full rounded-xl bg-rose-600 text-sm font-semibold hover:bg-rose-700"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Ingresando…
              </>
            ) : (
              'Iniciar sesión'
            )}
          </Button>
        </form>
      </div>

      <p className="mt-6 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} Davos Salud
      </p>
    </div>
  )
}
