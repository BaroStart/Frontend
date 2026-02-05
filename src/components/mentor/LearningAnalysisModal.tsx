import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ArrowRight, BarChart3, Calendar, Download, Info } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { useSubjectStudyTimes } from '@/hooks/useLearningAnalysis';
import { useWeeklyPatterns } from '@/hooks/useLearningAnalysis';
import type { DailyStudyPattern, SubjectStudyTime } from '@/types';

interface LearningAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  menteeId: string;
  menteeName: string;
}

export function LearningAnalysisModal({
  isOpen,
  onClose,
  menteeId,
  menteeName,
}: LearningAnalysisModalProps) {
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const navigate = useNavigate();

  const { data: subjectStudyTimes = [] } = useSubjectStudyTimes(menteeId);
  const { data: weeklyPatterns = [] } = useWeeklyPatterns(menteeId);

  const baseSubjectData: SubjectStudyTime[] = subjectStudyTimes;
  const baseWeeklyData: DailyStudyPattern[] = weeklyPatterns;

  const subjectData =
    period === 'month'
      ? baseSubjectData.map((s) => ({ ...s, hours: Math.round(s.hours * 4.3) }))
      : baseSubjectData;
  const weeklyData = baseWeeklyData;

  const maxHours = Math.max(...subjectData.map((s) => s.hours), 1);

  const handleDownloadReport = () => {
    const report =
      `${menteeName} 학습 분석 리포트 (${period === 'week' ? '이번 주' : '이번 달'})\n\n` +
      `과목별 학습 시간:\n` +
      subjectData.map((s) => `  ${s.subject}: ${s.hours}h`).join('\n') +
      `\n\n주간 학습 패턴:\n` +
      weeklyData.map((d) => `  ${d.day}: ${d.hours ?? '-'}h`).join('\n');
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `학습분석_${menteeName}_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <BarChart3 className="h-5 w-5 text-slate-600" />
            학습 분석 대시보드
          </h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setPeriod('week')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                period === 'week'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Calendar className="h-4 w-4" />
              이번 주
            </button>
            <button
              type="button"
              onClick={() => setPeriod('month')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                period === 'month'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Calendar className="h-4 w-4" />
              이번 달
            </button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={Download}
              onClick={handleDownloadReport}
            >
              리포트 다운로드
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* 과목별 학습 시간 */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-800">과목별 학습 시간</h3>
                <Info className="h-4 w-4 text-slate-400" />
              </div>
              <div className="space-y-4">
                {subjectData.map((item) => (
                  <div key={item.subject}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="font-medium text-slate-700">{item.subject}</span>
                      <span className="text-slate-600">{item.hours}h</span>
                    </div>
                    <div className="flex h-2 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="bg-slate-800 transition-all duration-300"
                        style={{ width: `${(item.hours / maxHours) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 주간 학습 패턴 */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-800">주간 학습 패턴</h3>
                <Calendar className="h-4 w-4 text-slate-400" />
              </div>
              <div className="space-y-3">
                {weeklyData.map((item) => (
                  <div key={item.day} className="flex items-center gap-3">
                    <span className="w-14 shrink-0 text-sm text-slate-700">{item.day}</span>
                    <span className="w-12 shrink-0 text-sm font-medium text-slate-800">
                      {item.hours != null ? `${item.hours}h` : '-'}
                    </span>
                    <div className="flex flex-1 gap-0.5">
                      {Array.from({ length: item.totalBlocks ?? 5 }).map((_, i) => (
                        <div
                          key={i}
                          className={`h-4 flex-1 rounded-sm ${
                            i < item.filledBlocks ? 'bg-slate-800' : 'bg-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 하단 자세히 버튼 */}
        <div className="border-t border-slate-200 p-4">
          <Button
            type="button"
            onClick={() => {
              onClose();
              navigate(`/mentor/assignments?tab=analytics&menteeId=${menteeId}`);
            }}
            className="w-full"
          >
            자세히
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
