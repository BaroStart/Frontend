import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const commentSchema = z.object({
  content: z.string().trim().min(1, "내용을 입력해주세요.").max(500, "500자 이내로 입력해주세요."),
});

export type CommentModalValues = z.infer<typeof commentSchema>;

type ThreadMessage = {
  id: string;
  author: string;
  content: string;
  parentId?: string | null;
  createdAtText?: string;
};

type CommentModalProps = {
  open: boolean;
  onClose: () => void;

  onSubmit: (values: CommentModalValues) => void | Promise<void>;

  thread?: {
    root?: ThreadMessage | null; 
    replies?: ThreadMessage[]; 
  };

  defaultValues?: Partial<CommentModalValues>;
  title?: string;

  onSendReply?: (text: string) => void | Promise<void>;
};

export function CommentModal({
  open,
  onClose,
  onSubmit,
  thread,
  defaultValues,
  title = "오늘의 코멘트와 궁금한 점을 남겨주세요!",
  onSendReply,
}: CommentModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { isSubmitting },
  } = useForm<CommentModalValues>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      content: defaultValues?.content ?? "",
    },
  });

  const [replyText, setReplyText] = useState("");
  const [localReplies, setLocalReplies] = useState<ThreadMessage[]>([]);

  const root = thread?.root ?? null;

  const hasSubmitted = !!root;

  const replies = useMemo(() => {
    return [...(thread?.replies ?? []), ...localReplies];
  }, [thread?.replies, localReplies]);

  useEffect(() => {
    if (open) {
      reset({ content: defaultValues?.content ?? "" });
      setReplyText("");
      setLocalReplies([]);
    }
  }, [open, defaultValues?.content, reset]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const content = watch("content") ?? "";
  const canSubmit = content.trim().length > 0 && !isSubmitting;

  const canSendReply = replyText.trim().length > 0 && !isSubmitting && hasSubmitted;

  const handleSendReply = async () => {
    if (!root) return;
    const text = replyText.trim();
    if (!text) return;

    if (onSendReply) {
      await onSendReply(text);
    } else {
      setLocalReplies((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          author: "나",
          content: text,
          parentId: root.id,
          createdAtText: "방금",
        },
      ]);
    }
    setReplyText("");
  };

  const modal = (
    <div className="fixed inset-0 z-[9999]">
      <button
        type="button"
        aria-label="닫기"
        onClick={onClose}
        className="absolute inset-0 bg-black/30"
      />

      <div className="absolute left-1/2 top-1/2 w-[86vw] max-w-sm -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="grid h-8 w-8 place-items-center rounded-full text-gray-500 hover:bg-gray-100 active:scale-[0.98]"
          >
            <span className="text-xl leading-none">×</span>
          </button>
        </div>

        <div className="max-h-[38vh] overflow-y-auto px-4 py-3">
          {!root ? (
            <div className="rounded-xl bg-gray-50 p-3 text-sm text-gray-600">
              아직 코멘트가 없어요. 아래에 코멘트를 남기면 멘토 답장이 여기에 표시돼요.
            </div>
          ) : (
            <div className="space-y-4">
              {/* root - 인스타그램 댓글 레이아웃: 프로필 + 사용자명·시간 + 본문 */}
              <div className="flex gap-2.5">
                <div className="h-8 w-8 shrink-0 rounded-full bg-gray-200" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-sm font-semibold text-gray-900">{root.author}</span>
                    {root.createdAtText && (
                      <span className="text-xs text-gray-400">{root.createdAtText}</span>
                    )}
                  </div>
                  <p className="mt-0.5 whitespace-pre-wrap text-sm leading-snug text-gray-900">{root.content}</p>
                </div>
              </div>

              {replies.length > 0 && (
                <div className="space-y-3 border-l-2 border-gray-100 pl-3 ml-4">
                  {replies.map((r) => (
                    <div key={r.id} className="flex gap-2.5">
                      <div
                        className={[
                          "h-7 w-7 shrink-0 rounded-full",
                          r.author === "멘토" ? "bg-brand/20" : "bg-gray-200",
                        ].join(" ")}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-sm font-semibold text-gray-900">{r.author}</span>
                          {r.createdAtText && (
                            <span className="text-xs text-gray-400">{r.createdAtText}</span>
                          )}
                        </div>
                        <p className="mt-0.5 whitespace-pre-wrap text-sm leading-snug text-gray-900">{r.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {!hasSubmitted && (
          <form
            onSubmit={handleSubmit(async (values) => {
              await onSubmit(values);
            })}
            className="border-t px-5 py-4"
          >
            <label className="mb-2 block text-sm font-semibold text-gray-900">
              코멘트 & 궁금한 점
            </label>
            <textarea
              {...register("content")}
              rows={5}
              className="w-full resize-none rounded-xl bg-gray-100 px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400"
              placeholder="오늘 어려웠던 점, 궁금한 점을 편하게 적어주세요."
            />

            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                disabled={!canSubmit}
                className={[
                  "h-11 rounded-full px-7 text-sm font-semibold transition",
                  canSubmit
                    ? "bg-gray-800 text-white active:scale-[0.99]"
                    : "bg-gray-200 text-gray-500",
                ].join(" ")}
              >
                {isSubmitting ? "저장 중..." : "완료"}
              </button>
            </div>
          </form>
        )}

        {hasSubmitted && (
          <div className="border-t px-4 py-3">
            <div className="flex items-end gap-2">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={2}
                placeholder="답글을 입력하세요."
                className="min-h-[44px] flex-1 resize-none rounded-xl bg-gray-100 px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400"
              />

              <button
                type="button"
                onClick={handleSendReply}
                disabled={!canSendReply}
                className={[
                  "h-[44px] shrink-0 rounded-full px-5 text-sm font-semibold transition",
                  canSendReply
                    ? "bg-gray-900 text-white active:scale-[0.99]"
                    : "bg-gray-200 text-gray-500",
                ].join(" ")}
              >
                전송
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
