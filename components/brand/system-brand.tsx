import Image from "next/image";
import Link from "next/link";

type Props = {
  compact?: boolean;
  href?: string;
};

export function SystemBrand({ compact = false, href = "/dashboard" }: Props) {
  const content = (
    <div className="flex items-center gap-3">
      <div className="flex size-11 items-center justify-center rounded-2xl border border-rose-100/80 bg-white shadow-[0_16px_40px_rgba(190,24,93,0.14)]">
        <Image
          src="/davos-salud-logo-transparent.png"
          alt="Davos Salud"
          width={44}
          height={44}
          className="size-9 object-contain"
          priority
        />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold uppercase tracking-[0.24em] text-rose-700">
          Davos Salud
        </p>
        {!compact ? (
          <p className="truncate text-sm text-slate-500">
            Gestión clínica integral
          </p>
        ) : null}
      </div>
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
