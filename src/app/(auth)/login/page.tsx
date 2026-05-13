import { LoginForm } from './login-form'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <LoginForm error={params.error} />
    </div>
  )
}
