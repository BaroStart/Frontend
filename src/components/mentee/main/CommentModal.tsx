import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const commentSchema = z.object({
  comment: z.string().trim().optional().default(""),
  question: z.string().trim().optional().default(""),
});

export type CommentModalValues = z.infer<typeof commentSchema>;

type CommentModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: CommentModalValues) => void | Promise<void>;
  defaultValues?: Partial<CommentModalValues>;
  title?: string;
};

export function CommentModal({
  open,
  onClose,
  onSubmit,
  defaultValues,
  title = "오늘의 코멘트를 남겨주세요!",
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
      comment: "",
      question: "",
      ...defaultValues,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        comment: defaultValues?.comment ?? "",
        question: defaultValues?.question ?? "",
      });
    }
  }, [open, defaultValues, reset]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const comment = watch("comment") ?? "";
  const question = watch("question") ?? "";
  const canSubmit = (comment.trim().length > 0 || question.trim().length > 0) && !isSubmitting;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="닫기"
        onClick={onClose}
        className="absolute inset-0 bg-black/30"
      />

      <div className="absolute left-1/2 top-1/2 w-[86vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-xl">
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

        <form
          onSubmit={handleSubmit(async (values) => {
            await onSubmit(values);
            onClose();
          })}
          className="px-5 py-4"
        >
          <div className="mb-4">
            <label className="mb-2 block text-sm font-semibold text-gray-900">코멘트</label>
            <textarea
              {...register("comment")}
              rows={4}
              placeholder=""
              className="w-full resize-none rounded-xl bg-gray-100 px-4 py-3 text-sm text-gray-900 outline-none ring-0 placeholder:text-gray-400 focus:bg-gray-100"
            />
          </div>

          <div className="mb-6">
            <label className="mb-2 block text-sm font-semibold text-gray-900">궁금한 점</label>
            <textarea
              {...register("question")}
              rows={4}
              placeholder=""
              className="w-full resize-none rounded-xl bg-gray-100 px-4 py-3 text-sm text-gray-900 outline-none ring-0 placeholder:text-gray-400 focus:bg-gray-100"
            />
          </div>

          <div className="flex justify-end">
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
      </div>
    </div>
  );
}
