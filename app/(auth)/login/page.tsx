import { LoginForm } from '@/components/auth/login-form'

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[linear-gradient(180deg,#fffdfd_0%,#fff5f8_50%,#ffffff_100%)] px-4 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(244,114,182,0.16),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(251,207,232,0.24),transparent_28%)]" />
      <div className="relative z-10 w-full">
        <LoginForm />
      </div>
    </main>
  )
}
