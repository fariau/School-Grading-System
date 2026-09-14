export default function GradeBadge({ grade }: { grade: string }) {
  const isFail = grade === "F";
  const colorClass = isFail ? "text-pen-red" : "text-ledger-green";

  return <span className={`grade-stamp ${colorClass}`}>{grade}</span>;
}