import { BookOpen, Calculator, FileText, Hexagon } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Dialog, DialogBody, DialogFooter, DialogHeader } from '@/components/ui/Dialog';
import type { FeedbackTemplate } from '@/lib/feedbackTemplateStorage';

const SUBJECT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  국어: BookOpen,
  영어: FileText,
  수학: Calculator,
  공통: Hexagon,
};

export function TemplateViewModal({
  template,
  onClose,
}: {
  template: FeedbackTemplate;
  onClose: () => void;
}) {
  const SubjectIcon = SUBJECT_ICONS[template.subject] ?? Hexagon;

  return (
    <Dialog open onClose={onClose}>
      <DialogHeader onClose={onClose}>
        <h2 className="text-lg font-semibold text-foreground">{template.name}</h2>
        <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-foreground/70">
          <SubjectIcon className="h-3.5 w-3.5" />
          {template.subject}
        </span>
      </DialogHeader>
      <DialogBody>
        <div className="rounded-lg bg-secondary/50 p-4">
          <p className="whitespace-pre-wrap text-sm text-foreground/80">{template.content}</p>
        </div>
        <div className="mt-4 flex justify-between text-xs text-foreground/50">
          <span>생성일: {template.createdAt.replace(/-/g, '.')}</span>
          <span>사용 횟수: {template.useCount}회</span>
        </div>
      </DialogBody>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          닫기
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
