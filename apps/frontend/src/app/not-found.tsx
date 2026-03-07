import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg-primary text-text-primary px-4">
      <h1 className="text-2xl font-bold mb-2">404</h1>
      <p className="text-text-muted mb-4">Página não encontrada.</p>
      <Link href="/" className="text-accent underline hover:opacity-90">
        Voltar ao início
      </Link>
    </div>
  );
}
