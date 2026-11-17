import Link from 'next/link';

export default function NotFound() {
  return (
    <article className="max-w-2xl py-10">
      <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-neutral-950">Esta página no existe</h1>
      <p className="mt-3 text-neutral-700">
        Puede que el enlace esté mal escrito o que hayamos movido el contenido. Desde aquí puedes seguir:
      </p>
      <ul className="mt-5 space-y-2 text-neutral-900">
        <li><Link className="underline underline-offset-4 hover:text-red-900" href="/">Portada</Link></li>
        <li><Link className="underline underline-offset-4 hover:text-red-900" href="/espana/generales/2026/programas">Programas de cada partido</Link></li>
        <li><Link className="underline underline-offset-4 hover:text-red-900" href="/espana/congreso/xv-legislatura/votaciones">Votaciones del Congreso</Link></li>
        <li><Link className="underline underline-offset-4 hover:text-red-900" href="/espana/generales/2026/guias">Guías para votar</Link></li>
      </ul>
    </article>
  );
}
