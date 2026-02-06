type Subject = "ALL" | "KOREAN" | "ENGLISH" | "MATH";

type Props = {
  value: Subject;
  onChange: (v: Subject) => void;
};

export function SubjectFilter({ value, onChange }: Props) {
  const items: { label: string; value: Subject }[] = [
    { label: "전체", value: "ALL" },
    { label: "국어", value: "KOREAN" },
    { label: "영어", value: "ENGLISH" },
    { label: "수학", value: "MATH" },
  ];

  return (
    <div className="flex gap-2">
      {items.map((item) => (
        <button
          key={item.value}
          onClick={() => onChange(item.value)}
          className={[
            "rounded-full px-4 py-2 text-sm",
            value === item.value
              ? "bg-black text-white"
              : "border border-gray-200 text-gray-600",
          ].join(" ")}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}