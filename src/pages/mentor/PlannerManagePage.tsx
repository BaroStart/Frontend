import { useEffect, useState } from 'react';

import { Calendar } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { DefaultSelect } from '@/components/ui/select';
import {
  formatPlannerDuration,
  getPlannerCompletedItemsByMenteeAndDate,
  getPlannerRecordsByMenteeAndDate,
  type PlannerCompletedItem,
  type PlannerRecord,
} from '@/data/plannerMock';
import { useMentees } from '@/hooks/useMentees';
import { getTodayDateStr } from '@/lib/dateUtils';
import { getPlannerFeedback, savePlannerFeedback } from '@/lib/plannerFeedbackStorage';

export function PlannerManagePage() {
  const { data: mentees = [] } = useMentees();
  const [planner, setPlanner] = useState({
    menteeId: '',
    date: getTodayDateStr(),
    feedback: '',
  });

  useEffect(() => {
    if (planner.menteeId && planner.date) {
      const saved = getPlannerFeedback(planner.menteeId, planner.date);
      setPlanner((prev) => ({ ...prev, feedback: saved?.feedbackText ?? '' }));
    }
  }, [planner.menteeId, planner.date]);

  const handleSavePlannerFeedback = () => {
    if (!planner.menteeId || !planner.date) return;
    savePlannerFeedback({
      id: `pf-${planner.menteeId}-${planner.date}`,
      menteeId: planner.menteeId,
      date: planner.date,
      feedbackText: planner.feedback,
      createdAt: new Date().toISOString(),
    });
    alert('피드백이 저장되었습니다.');
  };

  return (
    <div className="min-w-0 space-y-6">
      <div className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-slate-700">멘티 선택</label>
              <DefaultSelect
                value={planner.menteeId}
                onValueChange={(v) => setPlanner((prev) => ({ ...prev, menteeId: v }))}
                placeholder="멘티를 선택하세요"
                options={mentees.map((m) => ({
                  value: m.id,
                  label: `${m.name} (${m.grade} · ${m.track})`,
                }))}
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-slate-700">날짜 선택</label>
              <input
                type="date"
                value={planner.date}
                onChange={(e) => setPlanner((prev) => ({ ...prev, date: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
            </div>
          </div>
        </div>

        {planner.menteeId ? (
          <PlannerContent
            menteeId={planner.menteeId}
            date={planner.date}
            feedback={planner.feedback}
            menteeName={mentees.find((m) => m.id === planner.menteeId)?.name ?? ''}
            onFeedbackChange={(v) => setPlanner((prev) => ({ ...prev, feedback: v }))}
            onSaveFeedback={handleSavePlannerFeedback}
          />
        ) : (
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-12">
            <div className="text-slate-300">
              <Calendar className="h-12 w-12" />
            </div>
            <p className="mt-4 text-sm text-slate-500">
              멘티를 선택하면 플래너를 확인하고 피드백을 작성할 수 있습니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function PlannerContent({
  menteeId,
  date,
  feedback,
  menteeName,
  onFeedbackChange,
  onSaveFeedback,
}: {
  menteeId: string;
  date: string;
  feedback: string;
  menteeName: string;
  onFeedbackChange: (v: string) => void;
  onSaveFeedback: () => void;
}) {
  const records = getPlannerRecordsByMenteeAndDate(menteeId, date);
  const completedItems = getPlannerCompletedItemsByMenteeAndDate(menteeId, date);
  const totalHours = (records.reduce((sum, r) => sum + r.durationMinutes, 0) / 60).toFixed(1);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="mb-3 text-base font-semibold text-slate-900">과제 (학습 기록)</h3>
          {records.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">
              해당 날짜에 기록된 학습이 없습니다.
            </p>
          ) : (
            <>
              <div className="mb-3 text-sm text-slate-600">총 학습 시간: {totalHours}시간</div>
              <div className="space-y-2">
                {records
                  .sort((a, b) => b.durationMinutes - a.durationMinutes)
                  .map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2"
                    >
                      <span className="font-medium text-slate-900">{r.subject}</span>
                      <span className="font-mono text-sm text-slate-600">
                        {formatPlannerDuration(r.durationMinutes)}
                      </span>
                    </div>
                  ))}
              </div>

              <div className="mt-4 border-t border-slate-100 pt-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">완료된 To-do / 과제</p>
                  <span className="text-xs text-slate-500">{completedItems.length}개</span>
                </div>
                {completedItems.length === 0 ? (
                  <p className="py-3 text-center text-sm text-slate-500">
                    완료된 To-do/과제가 없습니다.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {completedItems.map((item) => (
                      <CompletedItemRow key={item.id} item={item} />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="mb-3 text-base font-semibold text-slate-900">플래너 피드백</h3>
          <p className="mb-3 text-sm text-slate-500">
            {menteeName}님의 학습 기록을 확인하고 피드백을 작성해주세요.
          </p>
          <textarea
            value={feedback}
            onChange={(e) => onFeedbackChange(e.target.value)}
            placeholder="예: 오늘 수학 학습 시간이 가장 많았네요. 내일은 영어 독해 비중을 늘려보면 좋겠습니다."
            rows={5}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
          />
          <div className="mt-3 flex justify-end">
            <Button type="button" onClick={onSaveFeedback}>
              피드백 저장
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="mb-3 text-base font-semibold text-slate-900">타임라인</h3>
        {records.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-500">
            타임라인을 표시할 학습 기록이 없습니다.
          </p>
        ) : (
          <PlannerTimeline records={records} />
        )}
      </div>
    </div>
  );
}

function PlannerTimeline({ records }: { records: PlannerRecord[] }) {
  const COLORS: Record<string, string> = {
    수학: 'bg-rose-200',
    영어: 'bg-violet-200',
    국어: 'bg-amber-200',
    문학: 'bg-amber-100',
    사탐: 'bg-emerald-200',
    한국사: 'bg-emerald-100',
    과탐: 'bg-sky-200',
    과학: 'bg-sky-200',
  };
  const hours = Array.from({ length: 15 }, (_, i) => i + 6);
  const sorted = [...records].sort((a, b) => (a.startHour ?? 0) - (b.startHour ?? 0));

  return (
    <div className="space-y-1">
      {hours.map((hour) => {
        const blocks = sorted.filter((r) => {
          const start = r.startHour ?? 0;
          const end = start + Math.ceil(r.durationMinutes / 60);
          return hour >= start && hour < end;
        });
        return (
          <div key={hour} className="flex items-center gap-2">
            <span className="w-8 shrink-0 text-xs text-slate-500">{hour}시</span>
            <div className="flex flex-1 gap-1">
              {blocks.map((r) => (
                <div
                  key={r.id}
                  className={`h-6 flex-1 rounded ${COLORS[r.subject] ?? 'bg-slate-200'}`}
                  title={`${r.subject} ${formatPlannerDuration(r.durationMinutes)}`}
                />
              ))}
              {blocks.length === 0 && <div className="h-6 flex-1 rounded bg-slate-50" />}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CompletedItemRow({ item }: { item: PlannerCompletedItem }) {
  const badgeClass =
    item.type === 'todo'
      ? 'bg-violet-50 text-violet-700'
      : 'bg-emerald-50 text-emerald-700';
  const badgeText = item.type === 'todo' ? '자기주도 TO-DO' : '과제';
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-white px-3 py-2">
      <div className="min-w-0">
        <div className="mb-0.5 flex items-center gap-2">
          <span className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${badgeClass}`}>
            {badgeText}
          </span>
          {item.subject && (
            <span className="inline-flex shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
              {item.subject}
            </span>
          )}
        </div>
        <p className="truncate text-sm text-slate-800">{item.title}</p>
      </div>
    </div>
  );
}
