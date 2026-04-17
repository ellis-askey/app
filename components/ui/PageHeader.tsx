// components/ui/PageHeader.tsx

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-8 py-5 bg-white border-b border-[#e4e9f0]">
      <div>
        <h1 className="text-lg font-semibold text-gray-900 leading-tight">{title}</h1>
        {subtitle && (
          <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0 ml-4">{action}</div>}
    </div>
  );
}
