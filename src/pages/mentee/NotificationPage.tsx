import { Bell, Clock, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

type NotificationType = "reminder" | "feedback" | "system";

interface NotificationItem {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  link?: string;
}

// --- Mock ---
const NOTIFICATIONS: NotificationItem[] = [
  {
    id: 1,
    type: "feedback",
    title: "새로운 피드백 도착",
    message: "김민준 멘토님이 [영어 독해 - 주제문 찾기] 과제에 피드백을 남겼습니다.",
    time: "방금 전",
    isRead: false,
  },
  {
    id: 2,
    type: "reminder",
    title: "미완료 과제 알림",
    message: "어제 마감된 [국어 - 고전시가] 과제가 제출되지 않았습니다.",
    time: "1일 전",
    isRead: false,
  },
  {
    id: 3,
    type: "reminder",
    title: "미완료 과제 알림",
    message: "어제 마감된 [수학 - 미적분 II] 과제가 제출되지 않았습니다.",
    time: "1일 전",
    isRead: true,
  },
  {
    id: 4,
    type: "feedback",
    title: "새로운 피드백 도착",
    message: "김민준 멘토님이 [영어 독해 - 주제문 찾기] 과제에 피드백을 남겼습니다.",
    time: "2일 전",
    isRead: true,
  },
];

export function NotificationPage() {
  const getIcon = (type: NotificationType) => {
    switch (type) {
      case "feedback":
        return <MessageSquare className="h-5 w-5 text-[#0E9ABE]" />;
      case "reminder":
        return <Clock className="h-5 w-5 text-rose-500" />;
      case "system":
        return <Bell className="h-5 w-5 text-slate-500" />;
    }
  };

  const getIconBg = (type: NotificationType) => {
    switch (type) {
      case "feedback":
        return "bg-[#0E9ABE]/10";
      case "reminder":
        return "bg-rose-500/10";
      case "system":
        return "bg-slate-200/60";
    }
  };

  return (
    <div className="flex h-full flex-col bg-white px-4 pt-4">
      <header className="mb-4">
        <h1 className="ml-1 text-xl font-extrabold tracking-tight text-slate-900">
          알림
        </h1>
      </header>

      <div className="flex-1 space-y-4 pb-20">
        {NOTIFICATIONS.length > 0 ? (
          NOTIFICATIONS.map((item) => (
            <div
              key={`${item.id}-${item.time}`}
              className={cn(
                "rounded-3xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-300 hover:bg-gray-50 hover:shadow-md",
                !item.isRead && "bg-blue-50/30"
              )}
            >
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    "flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl",
                    getIconBg(item.type)
                  )}
                >
                  {getIcon(item.type)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3
                      className={cn(
                        "truncate pr-2 text-sm",
                        item.isRead
                          ? "font-semibold text-slate-700"
                          : "font-bold text-slate-900"
                      )}
                    >
                      {item.title}
                    </h3>

                    <div className="flex items-center gap-2">
                      {!item.isRead && (
                        <div className="h-2 w-2 rounded-full bg-[#0E9ABE]" />
                      )}
                      <span className="whitespace-nowrap text-xs text-slate-400">
                        {item.time}
                      </span>
                    </div>
                  </div>

                  <p
                    className={cn(
                      "mt-2 line-clamp-2 text-sm leading-relaxed",
                      item.isRead
                        ? "text-slate-500"
                        : "font-medium text-slate-600"
                    )}
                  >
                    {item.message}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-400">
              <Bell className="h-8 w-8 opacity-50" />
            </div>
            <p className="font-medium text-gray-500">새로운 알림이 없습니다.</p>
            <p className="mt-1 text-sm text-gray-400">오늘은 조용한 하루네요!</p>
          </div>
        )}

        <div className="pt-2 text-center">
          <p className="text-xs text-slate-400">최근 30일 동안의 알림만 보관됩니다.</p>
        </div>
      </div>
    </div>
  );
}
