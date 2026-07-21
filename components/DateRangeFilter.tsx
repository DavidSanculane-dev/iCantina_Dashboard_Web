export default function DateRangeFilter({
  action,
  dateStart,
  dateEnd,
  extra,
}: {
  action: string;
  dateStart: string;
  dateEnd: string;
  extra?: React.ReactNode;
}) {
  return (
    <form
      action={action}
      method="get"
      className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl bg-white p-4 shadow-sm"
    >
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">
          Data inicio
        </label>
        <input
          type="date"
          name="dateStart"
          defaultValue={dateStart}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">
          Data fim
        </label>
        <input
          type="date"
          name="dateEnd"
          defaultValue={dateEnd}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </div>
      {extra}
      <button
        type="submit"
        className="rounded-lg bg-brand-green px-4 py-2 text-sm font-semibold text-white hover:bg-brand-greenDark"
      >
        🔍 Consultar
      </button>
    </form>
  );
}
