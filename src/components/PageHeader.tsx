import ShopIdentity from "./ShopIdentity";

export default function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="@container flex h-[92px] shrink-0 items-center gap-4 border-b border-line px-6">
      <ShopIdentity />
      <div className="hidden h-10 w-px shrink-0 bg-line @xl:block" />
      <div className="hidden min-w-0 @xl:block">
        <h1 className="truncate text-xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-0.5 truncate text-sm text-muted">{subtitle}</p>}
      </div>
      {children && <div className="ml-auto flex items-center gap-3">{children}</div>}
    </header>
  );
}
