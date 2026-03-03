import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-16 h-16 rounded-2xl border border-accent/30 bg-bg-card flex items-center justify-center mb-8">
        <span className="text-accent text-2xl font-serif font-bold">N</span>
      </div>
      <h1 className="text-3xl font-serif font-semibold mb-2 tracking-tight">
        Página não encontrada
      </h1>
      <p className="text-text-secondary text-center text-sm max-w-xs mb-8">
        A página que você procura não existe ou foi movida.
      </p>
      <Link
        href="/"
        className="px-6 py-3 rounded-xl bg-accent/20 border border-accent/40 text-accent font-medium hover:bg-accent/30 transition-colors"
      >
        Voltar ao início
      </Link>
    </div>
  );
}
