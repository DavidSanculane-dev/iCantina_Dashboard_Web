export default function StatCard({
  label,
  value,
  icon,
  bg = "bg-white",
}: {
  label: string;
  value: string;
  icon: string;
  bg?: string;
}) {
  return (
    <div className={`rounded-2xl ${bg} p-5 shadow-sm`}>
      <div className="flex items-center justify-between text-sm font-medium text-slate-500">
        {label}
        <span className="text-xl">{icon}</span>
      </div>
      <div className="mt-2 text-3xl font-bold text-slate-800">{value}</div>
    </div>
  );
}
