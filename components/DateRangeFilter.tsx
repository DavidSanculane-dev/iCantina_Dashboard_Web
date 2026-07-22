import DatePickerField from "./DatePickerField";

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
      <DatePickerField name="dateStart" label="Data inicio" defaultValue={dateStart} />
      <DatePickerField name="dateEnd" label="Data fim" defaultValue={dateEnd} />
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
