export default function StatCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string | number;
  tone?: "default" | "green" | "red" | "gold";
}) {
  const toneClasses = {
    default: "text-ink",
    green: "text-ledger-green",
    red: "text-pen-red",
    gold: "text-gold",
  };

  return (
    <div className="border border-hairline rounded-lg bg-paper-raised px-5 py-4">
      <p className="text-xs text-muted mb-1.5">{label}</p>
      <p className={`font-serif text-3xl font-semibold ${toneClasses[tone]}`}>
        {value}
      </p>
    </div>
  );
}