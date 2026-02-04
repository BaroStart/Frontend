export type Subject = "KOREAN" | "ENGLISH" | "MATH" | "ETC";

export type FeedbackItem = {
  id: string;
  subject: Subject;
  mentorName: string;
  content: string;

  timeText?: string;   
  assignmentId?: string;
};

type Props = {
  item: FeedbackItem;
  className?: string;
  onOpenAssignment?: (assignmentId: string) => void;
};

function subjectIcon(subject: Subject) {
  switch (subject) {
    case "KOREAN": return "✍️"; 
    case "ENGLISH": return "🗣️";
    case "MATH": return "📐";
    default: return "📘";
  }
}

export function FeedbackCard({
  item,
  className,
  onOpenAssignment,
}: Props) {
  const canOpenAssignment = Boolean(
    item.assignmentId && onOpenAssignment
  );

  return (
    <div
      className={[
        "w-full rounded-2xl border border-gray-100 bg-white p-4 shadow-sm",
        className ?? "",
      ].join(" ")}
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">{subjectIcon(item.subject)}</span>
        <span className="text-sm font-semibold text-gray-900">
          {item.subject}
        </span>
      </div>

      <div className="mt-3 text-xs font-medium text-gray-600">
        {item.mentorName} 멘토
      </div>

      <p className="mt-1 whitespace-pre-line text-sm leading-6 text-gray-900">
        {item.content}
      </p>

      <div className="mt-4 flex items-center justify-between text-xs">
        <span className="text-gray-400">
          {item.timeText}
        </span>

        <button
          type="button"
          disabled={!canOpenAssignment}
          onClick={() => {
            if (!item.assignmentId || !onOpenAssignment) return;
            onOpenAssignment(item.assignmentId);
          }}
          className={["font-semibold transition",
            canOpenAssignment
              ? "text-gray-900 hover:underline"
              : "text-gray-300 cursor-default",
          ].join(" ")}
        >
          과제 보기 &gt;
        </button>
      </div>
    </div>
  );
}

