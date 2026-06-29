import Image from "next/image";
import Link from "next/link";

type Props = {
  compact?: boolean;
  href?: string;
};

export function SystemBrand({ compact = false, href = "/dashboard" }: Props) {
  const content = (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-12 w-14 shrink-0 items-center justify-center overflow-hidden bg-white">
        <Image
          src="/davos-salud-logo.jpeg"
          alt="Davos Salud"
          width={56}
          height={44}
          className="h-11 w-14 object-cover"
          priority
        />
      </div>
      <div className="min-w-0 group-data-[collapsible=icon]:hidden">
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
