import { BarChart3, Download, Edit, FileText, Save, X } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from 'docx';
import { saveAs } from 'file-saver';
import { useMemo, useState, useEffect } from 'react';

import { Button } from '@/components/ui/Button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMentee } from '@/hooks/useMentee';
import {
  useFeedbackItems,
  useIncompleteAssignments,
  useMenteeKpi,
} from '@/hooks/useMenteeDetail';
import {
  useSubjectStudyTimes,
  useWeeklyPatterns,
} from '@/hooks/useLearningAnalysis';
import { useMentees } from '@/hooks/useMentees';

type AnalysisType = {
  strengths: string[];
  weaknesses: string[];
  studyStyle: string[];
  improvements: string[];
  subjectStats: Record<string, { total: number; completed: number; urgent: number }>;
  overallAnalysis: {
    summary: string[];
    strengths: string[];
    weaknesses: string[];
    guidancePoints: string[];
  };
  subjectDetailedAnalysis: Record<
    string,
    {
      studyStyle: string[];
      weakAreas: string[];
      mistakeTypes: string[];
      guidanceDirection: string[];
    }
  >;
  overallGuidance: string[];
};

export function LearningAnalyticsSection() {
  const [selectedMenteeId, setSelectedMenteeId] = useState<string>('');
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editedAnalysis, setEditedAnalysis] = useState<{
    overallAnalysis?: AnalysisType['overallAnalysis'];
    subjectDetailedAnalysis?: AnalysisType['subjectDetailedAnalysis'];
    overallGuidance?: string[];
  } | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisType | null>(null);

  const { data: mentees = [] } = useMentees();
  const { data: selectedMentee } = useMentee(selectedMenteeId || undefined);
  const { data: kpi } = useMenteeKpi(selectedMenteeId || undefined);
  const { data: feedbackItems = [] } = useFeedbackItems(selectedMenteeId || undefined);
  const { data: incompleteAssignments = [] } = useIncompleteAssignments(
    selectedMenteeId || undefined
  );
  const { data: subjectStudyTimes = [] } = useSubjectStudyTimes(selectedMenteeId || undefined);
  const { data: weeklyPatterns = [] } = useWeeklyPatterns(selectedMenteeId || undefined);

  const computedAnalysis = useMemo(() => {
    if (!selectedMenteeId || !kpi) return null;

    const extractSubCategory = (title: string, subject: string): string => {
      const lowerTitle = title.toLowerCase();
      if (subject === '국어') {
        if (lowerTitle.includes('비문학')) return '비문학';
        if (lowerTitle.includes('문학') || lowerTitle.includes('시') || lowerTitle.includes('소설')) return '문학';
        if (lowerTitle.includes('문법')) return '문법';
        if (lowerTitle.includes('화법') || lowerTitle.includes('작문')) return '화법과 작문';
        return '기타';
      }
      if (subject === '영어') {
        if (lowerTitle.includes('독해') || lowerTitle.includes('reading')) return '독해';
        if (lowerTitle.includes('듣기') || lowerTitle.includes('listening')) return '듣기';
        if (lowerTitle.includes('단어') || lowerTitle.includes('어휘') || lowerTitle.includes('vocabulary')) return '어휘';
        if (lowerTitle.includes('문법') || lowerTitle.includes('grammar')) return '문법';
        if (lowerTitle.includes('쓰기') || lowerTitle.includes('writing')) return '쓰기';
        return '기타';
      }
      if (subject === '수학') {
        if (lowerTitle.includes('미적분')) return '미적분';
        if (lowerTitle.includes('기하')) return '기하';
        if (lowerTitle.includes('확률') || lowerTitle.includes('통계')) return '확률과 통계';
        if (lowerTitle.includes('수학1') || lowerTitle.includes('수1')) return '수학1';
        if (lowerTitle.includes('수학2') || lowerTitle.includes('수2')) return '수학2';
        return '기타';
      }
      return '기타';
    };

    const subjectStats = feedbackItems.reduce(
      (acc, item) => {
        if (!acc[item.subject]) acc[item.subject] = { total: 0, completed: 0, urgent: 0 };
        acc[item.subject].total++;
        if (item.status === 'completed') acc[item.subject].completed++;
        if (item.status === 'urgent') acc[item.subject].urgent++;
        return acc;
      },
      {} as Record<string, { total: number; completed: number; urgent: number }>
    );

    const subjectDetailStats: Record<string, Record<string, { total: number; completed: number; urgent: number }>> = {};
    feedbackItems.forEach((item) => {
      const subCategory = extractSubCategory(item.title, item.subject);
      if (!subjectDetailStats[item.subject]) subjectDetailStats[item.subject] = {};
      if (!subjectDetailStats[item.subject][subCategory]) {
        subjectDetailStats[item.subject][subCategory] = { total: 0, completed: 0, urgent: 0 };
      }
      subjectDetailStats[item.subject][subCategory].total++;
      if (item.status === 'completed') subjectDetailStats[item.subject][subCategory].completed++;
      if (item.status === 'urgent') subjectDetailStats[item.subject][subCategory].urgent++;
    });

    const strengths: string[] = [];
    Object.entries(subjectDetailStats).forEach(([subject, detailStats]) => {
      Object.entries(detailStats).forEach(([subCategory, stats]) => {
        const rate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
        if (rate >= 80 && stats.total >= 2) strengths.push(`${subject} - ${subCategory} (완료율 ${Math.round(rate)}%)`);
      });
    });
    Object.entries(subjectStats).forEach(([subject, stats]) => {
      const rate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
      if (rate >= 80 && stats.total >= 3) strengths.push(`${subject} 전체 (완료율 ${Math.round(rate)}%)`);
    });
    const topStudy = [...subjectStudyTimes].sort((a, b) => b.hours - a.hours)[0];
    if (topStudy && topStudy.hours > 40) strengths.push(`${topStudy.subject} (주간 ${topStudy.hours}시간 집중)`);

    const weaknesses: string[] = [];
    Object.entries(subjectDetailStats).forEach(([subject, detailStats]) => {
      Object.entries(detailStats).forEach(([subCategory, stats]) => {
        const rate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
        if (rate < 50 && stats.total >= 2) weaknesses.push(`${subject} - ${subCategory} (완료율 ${Math.round(rate)}%)`);
        if (stats.urgent >= 1) weaknesses.push(`${subject} - ${subCategory} (긴급 과제 ${stats.urgent}개)`);
      });
    });
    Object.entries(subjectStats).forEach(([subject, stats]) => {
      const rate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
      if (rate < 50 && stats.total >= 2) weaknesses.push(`${subject} 전체 (완료율 ${Math.round(rate)}%)`);
      if (stats.urgent >= 2) weaknesses.push(`${subject} 전체 (긴급 과제 ${stats.urgent}개)`);
    });
    const lowStudy = subjectStudyTimes.filter((s) => s.hours > 0).sort((a, b) => a.hours - b.hours)[0];
    if (lowStudy && lowStudy.hours < 20) weaknesses.push(`${lowStudy.subject} (주간 ${lowStudy.hours}시간, 부족)`);

    const studyStyle: string[] = [];
    const avgDaily = weeklyPatterns.reduce((sum, p) => sum + (p.hours || 0), 0) / (weeklyPatterns.length || 1);
    if (avgDaily >= 3.5) studyStyle.push('매우 꾸준한 학습 습관');
    else if (avgDaily >= 2.5) studyStyle.push('적절한 학습 습관');
    else studyStyle.push('학습 시간 확대 필요');
    const weekendHours = (weeklyPatterns.find((p) => p.day === '토요일')?.hours || 0) + (weeklyPatterns.find((p) => p.day === '일요일')?.hours || 0);
    if (weekendHours > 5) studyStyle.push('주말 집중형 학습자');
    else if (weekendHours < 2) studyStyle.push('평일 중심 학습자');
    const mostActive = weeklyPatterns.filter((p) => p.hours && p.hours > 0).sort((a, b) => (b.hours || 0) - (a.hours || 0))[0];
    if (mostActive) studyStyle.push(`${mostActive.day}에 가장 활발`);

    const improvements: string[] = [];
    if (kpi.assignmentCompletionRate < 80) improvements.push(`과제 완료율 개선 필요 (현재 ${kpi.assignmentCompletionRate}%, 목표 80% 이상)`);
    if (kpi.completionRateChange < 0) improvements.push(`과제 완료율이 ${Math.abs(kpi.completionRateChange)}%p 하락했습니다`);
    if (incompleteAssignments.filter((a) => a.status === 'deadline_soon').length > 0) improvements.push('마감 임박 과제가 있어 즉시 처리 필요');
    if (kpi.studyHoursChange < 0) improvements.push(`학습 시간이 ${Math.abs(kpi.studyHoursChange)}시간 감소했습니다`);

    const overallAnalysis = { summary: [] as string[], strengths: [] as string[], weaknesses: [] as string[], guidancePoints: [] as string[] };
    const avgCompletionRate = Object.values(subjectStats).reduce(
      (sum, stats) => sum + (stats.total > 0 ? (stats.completed / stats.total) * 100 : 0),
      0
    ) / (Object.keys(subjectStats).length || 1);
    const weakSubjects = Object.entries(subjectStats).filter(([, s]) => (s.total > 0 ? (s.completed / s.total) * 100 : 0) < 60 && s.total >= 2).map(([sub]) => sub);
    const strongSubjects = Object.entries(subjectStats).filter(([, s]) => (s.total > 0 ? (s.completed / s.total) * 100 : 0) >= 80 && s.total >= 2).map(([sub]) => sub);
    const urgentCount = Object.values(subjectStats).reduce((sum, s) => sum + s.urgent, 0);

    if (avgCompletionRate >= 60) {
      overallAnalysis.summary.push('학생은 기본 개념 이해력은 있는 편이나, 고등 과정에서 요구되는 문제 분석의 깊이와 실수 관리가 아직 충분히 자리 잡지 않은 상태입니다.');
    } else {
      overallAnalysis.summary.push('학생은 기본 개념 이해력 보완이 필요한 상태이며, 고등 과정에서 요구되는 문제 분석의 깊이와 실수 관리가 아직 충분히 자리 잡지 않은 상태입니다.');
    }
    if (weakSubjects.length > 0 && strongSubjects.length > 0) {
      overallAnalysis.summary.push('공부할 때 스스로 약점을 점검하며 보완하기보다는, 비교적 잘 되는 단원이나 익숙한 유형 위주로 학습하려는 경향이 있습니다.');
    }
    if (kpi.completionRateChange < 0 || kpi.scoreChange < 0 || urgentCount > 0) {
      overallAnalysis.summary.push('시험 상황에서는 시간 압박이나 긴장으로 인해 평소보다 실수가 늘어나는 타입으로 보이며, 알고 있는 문제에서도 점수를 놓치는 경우가 종종 발생합니다.');
    }
    overallAnalysis.summary.push('전반적으로 학습량의 문제라기보다는, 공부 방식과 시험 대응 전략을 조정할 필요가 있는 학생입니다.');

    const subjectDetailedAnalysis: Record<string, { studyStyle: string[]; weakAreas: string[]; mistakeTypes: string[]; guidanceDirection: string[] }> = {};
    ['국어', '영어', '수학'].forEach((subject) => {
      if (!subjectDetailStats[subject]) return;
      const detailStats = subjectDetailStats[subject];
      const subjectStat = subjectStats[subject] || { total: 0, completed: 0, urgent: 0 };
      const completionRate = subjectStat.total > 0 ? (subjectStat.completed / subjectStat.total) * 100 : 0;
      const analysis = { studyStyle: [] as string[], weakAreas: [] as string[], mistakeTypes: [] as string[], guidanceDirection: [] as string[] };

      if (subject === '국어') {
        analysis.studyStyle.push('국어는 감각적으로 접근하는 경향이 있으며, 지문을 체계적으로 분석하기보다는 빠르게 읽고 정답을 찾으려는 편입니다.');
        const 비문학Rate = detailStats['비문학']?.total ? (detailStats['비문학'].completed / detailStats['비문학'].total) * 100 : 0;
        const 문학Rate = detailStats['문학']?.total ? (detailStats['문학'].completed / detailStats['문학'].total) * 100 : 0;
        if (비문학Rate < 70 || completionRate < 70) analysis.weakAreas.push('비문학 지문에서 핵심 논지나 근거 문장을 정확히 잡아내지 못하는 경우가 있습니다.');
        if (문학Rate < 70 || completionRate < 70) analysis.weakAreas.push('문학에서는 선지 판단 기준이 흔들려 비슷한 선택지에서 오답이 발생하는 경향이 보입니다.');
        if (detailStats['문법']?.total && detailStats['문법'].completed < detailStats['문법'].total * 0.8) analysis.weakAreas.push('내신 서술형에서는 답의 방향은 맞지만 표현이 부족해 감점되는 경우가 있습니다.');
        if (completionRate < 80 && subjectStat.total >= 1) analysis.mistakeTypes.push('지문은 이해했으나 문제에서 요구한 조건이나 관점을 놓쳐 오답으로 이어지는 경우가 잦습니다.');
        analysis.guidanceDirection.push('지문을 구조적으로 읽고, 문제에서 요구하는 기준을 먼저 확인하는 훈련을 진행할 예정입니다.');
        analysis.guidanceDirection.push('속도보다는 정확도를 우선으로 하여 실전에서 안정적인 점수를 낼 수 있도록 지도합니다.');
      } else if (subject === '영어') {
        analysis.studyStyle.push('영어는 아는 단어와 익숙한 표현 위주로 해석하는 편이며, 문장 구조가 복잡해질수록 의미를 추측해 문제를 푸는 경향이 있습니다.');
        const 독해Rate = detailStats['독해']?.total ? (detailStats['독해'].completed / detailStats['독해'].total) * 100 : 0;
        const 문법Rate = detailStats['문법']?.total ? (detailStats['문법'].completed / detailStats['문법'].total) * 100 : 0;
        if (독해Rate < 70 || completionRate < 70) analysis.weakAreas.push('긴 문장 구조 분석 능력이 부족해 해석이 중간에서 끊기는 경우가 있습니다.');
        if (문법Rate < 70 || completionRate < 70) analysis.weakAreas.push('문법은 개념은 알고 있으나 문제에 적용하는 과정에서 실수가 발생합니다.');
        if (detailStats['어휘']?.total && detailStats['어휘'].completed < detailStats['어휘'].total * 0.8) analysis.weakAreas.push('어휘의 정확한 의미와 뉘앙스 구분이 약한 편입니다.');
        if (독해Rate < 80 || completionRate < 80) analysis.mistakeTypes.push('문장을 끝까지 해석하지 않고 일부 의미만으로 답을 선택해 오답이 발생하는 경우가 있습니다.');
        analysis.guidanceDirection.push('모든 문제를 문장 구조 분석 후 해석하는 습관을 기르는 데 집중할 예정입니다.');
        analysis.guidanceDirection.push('단어와 문법은 단순 암기가 아닌, 실제 문제 적용 위주로 반복 학습을 진행합니다.');
      } else if (subject === '수학') {
        analysis.studyStyle.push('수학은 개념 이해 속도는 빠른 편이나, 문제를 풀 때 풀이 과정을 정리하지 않고 바로 답을 구하려는 경향이 있습니다.');
        if (subjectStat.urgent > 0 || completionRate < 80) analysis.weakAreas.push('계산 실수가 잦고, 문제 조건을 놓치는 경우가 있습니다.');
        if (completionRate < 80) analysis.weakAreas.push('풀이 과정이 생략되어 스스로 오류를 발견하지 못하는 경우가 많습니다.');
        if (completionRate < 85) {
          analysis.mistakeTypes.push('풀 수 있는 문제임에도 불구하고 사소한 실수로 점수를 잃는 비중이 높은 학생입니다.');
          analysis.mistakeTypes.push('시험 후에는 아는 문제였다는 반응이 자주 나타납니다.');
        }
        analysis.guidanceDirection.push('문제 풀이 시 조건 확인, 풀이 단계 정리, 검산 과정을 반드시 거치도록 지도할 예정입니다.');
        analysis.guidanceDirection.push('실전 문제를 통해 시간 관리와 안정적인 풀이 습관을 함께 훈련합니다.');
      }

      if (analysis.studyStyle.length > 0 || analysis.weakAreas.length > 0 || analysis.mistakeTypes.length > 0 || analysis.guidanceDirection.length > 0) {
        subjectDetailedAnalysis[subject] = analysis;
      }
    });

    const overallGuidance: string[] = [];
    if (avgCompletionRate >= 50) {
      overallGuidance.push('학생은 학습 능력이 부족하다기보다는, 고등 과정에 맞는 공부 방식과 시험 전략이 아직 완전히 정립되지 않은 상태입니다.');
      overallGuidance.push('약점과 실수 유형이 비교적 명확하기 때문에, 이를 중심으로 지도할 경우 내신과 수능 모두에서 성적 향상을 기대할 수 있습니다.');
      overallGuidance.push('학습량을 무작정 늘리기보다는, 정확한 문제 해석과 실수 관리에 초점을 맞춰 지도할 계획입니다.');
    } else {
      overallGuidance.push('학생은 기본 학습 능력 보완과 함께, 고등 과정에 맞는 공부 방식과 시험 전략을 정립할 필요가 있습니다.');
      overallGuidance.push('약점과 실수 유형을 중심으로 지도하여 내신과 수능 모두에서 성적 향상을 기대할 수 있습니다.');
    }

    return {
      strengths,
      weaknesses,
      studyStyle,
      improvements,
      subjectStats,
      overallAnalysis,
      subjectDetailedAnalysis,
      overallGuidance,
    };
  }, [selectedMenteeId, kpi, feedbackItems, incompleteAssignments, subjectStudyTimes, weeklyPatterns]);

  useEffect(() => {
    if (computedAnalysis) {
      setAnalysis(computedAnalysis);
      setEditedAnalysis(null);
      setEditingSection(null);
    } else {
      setAnalysis(null);
    }
  }, [computedAnalysis]);

  const displayAnalysis = editedAnalysis && editingSection
    ? { ...analysis!, ...editedAnalysis }
    : analysis;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <label className="mb-2 block text-sm font-medium text-slate-700">분석할 멘티 선택</label>
        <Select value={selectedMenteeId} onValueChange={setSelectedMenteeId}>
          <SelectTrigger className="w-full sm:max-w-xs">
            <SelectValue placeholder="멘티를 선택하세요" />
          </SelectTrigger>
          <SelectContent>
            {mentees.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.name} ({m.grade} · {m.track})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedMenteeId && analysis && displayAnalysis ? (
        <>
          <div className="flex justify-end gap-2">
            <Button
              onClick={async () => {
                if (editingSection) {
                  alert('편집 모드를 종료한 후 PDF를 다운로드해주세요.');
                  return;
                }
                const reportContent = document.getElementById('analysis-report');
                if (!reportContent) return;
                const clonedContent = reportContent.cloneNode(true) as HTMLElement;
                clonedContent.querySelectorAll('button').forEach((btn) => btn.remove());
                clonedContent.querySelectorAll('svg').forEach((svg) => svg.remove());
                clonedContent.querySelectorAll('textarea').forEach((textarea) => {
                  const text = (textarea as HTMLTextAreaElement).value || textarea.textContent || '';
                  const lines = text.split('\n').filter((l) => l.trim());
                  const parent = textarea.parentElement;
                  if (parent) {
                    const div = document.createElement('div');
                    div.className = 'text-sm leading-relaxed text-slate-700';
                    lines.forEach((line) => {
                      const p = document.createElement('p');
                      p.textContent = line;
                      p.style.marginBottom = '0.5rem';
                      div.appendChild(p);
                    });
                    parent.replaceChild(div, textarea);
                  }
                });
                clonedContent.querySelectorAll('input, textarea, select').forEach((el) => el.remove());
                const temp = document.createElement('div');
                temp.style.cssText = 'position:absolute;left:-9999px;top:0';
                temp.style.width = clonedContent.scrollWidth + 'px';
                temp.appendChild(clonedContent);
                document.body.appendChild(temp);
                await new Promise((r) => setTimeout(r, 100));
                try {
                  await html2pdf()
                    .set({
                      margin: [10, 10, 10, 10] as [number, number, number, number],
                      filename: `학생분석리포트_${selectedMentee?.name || '학생'}_${new Date().toISOString().slice(0, 10)}.pdf`,
                      image: { type: 'jpeg' as const, quality: 0.98 },
                      html2canvas: { scale: 2, useCORS: true, logging: false, windowWidth: clonedContent.scrollWidth, windowHeight: clonedContent.scrollHeight, allowTaint: true },
                      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
                    })
                    .from(clonedContent)
                    .save();
                } catch (err) {
                  console.error(err);
                  alert('PDF 다운로드 중 오류가 발생했습니다.');
                } finally {
                  if (document.body.contains(temp)) document.body.removeChild(temp);
                }
              }}
              className="no-print"
              icon={Download}
            >
              PDF 다운로드
            </Button>
            <Button
              onClick={async () => {
                if (!selectedMentee || !displayAnalysis || !kpi) return;
                const children: Paragraph[] = [];
                children.push(new Paragraph({ text: '학생 학습 분석 리포트', heading: HeadingLevel.TITLE, alignment: AlignmentType.LEFT, spacing: { after: 200 } }));
                children.push(new Paragraph({ children: [new TextRun({ text: `학생명: ${selectedMentee.name}`, bold: true }), new TextRun({ text: ` | 학년: ${selectedMentee.grade} | 과정: ${selectedMentee.track}` })], spacing: { after: 100 } }));
                children.push(new Paragraph({ text: `작성일: ${new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}`, spacing: { after: 400 } }));
                if (kpi) {
                  children.push(new Paragraph({ text: 'KPI 요약', heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 200 } }));
                  children.push(new Paragraph({ text: `총 학습 시간: ${kpi.totalStudyHours}시간 | 과제 완료율: ${kpi.assignmentCompletionRate}% | 평균 점수: ${kpi.averageScore}점 | 출석률: ${kpi.attendanceRate}%`, spacing: { after: 300 } }));
                }
                if (weeklyPatterns.length > 0) {
                  children.push(new Paragraph({ text: '생활패턴 분석', heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 200 } }));
                  children.push(new Paragraph({ text: weeklyPatterns.map((p) => `${p.day}: ${p.hours || 0}시간`).join(' | '), spacing: { after: 300 } }));
                }
                if (subjectStudyTimes.length > 0) {
                  children.push(new Paragraph({ text: '과목별 학습 시간', heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 200 } }));
                  subjectStudyTimes.sort((a, b) => b.hours - a.hours).forEach((item) => {
                    children.push(new Paragraph({ text: `${item.subject}: ${item.hours}시간`, spacing: { after: 100 } }));
                  });
                }
                if (displayAnalysis.overallAnalysis?.summary.length) {
                  children.push(new Paragraph({ text: '전반적인 학습 태도 및 공부 스타일', heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 200 } }));
                  displayAnalysis.overallAnalysis.summary.forEach((t: string) => children.push(new Paragraph({ text: t, spacing: { after: 150 } })));
                }
                if (displayAnalysis.subjectDetailedAnalysis && Object.keys(displayAnalysis.subjectDetailedAnalysis).length > 0) {
                  Object.entries(displayAnalysis.subjectDetailedAnalysis).forEach(([subject, details]) => {
                    const d = details as { studyStyle: string[]; weakAreas: string[]; mistakeTypes: string[]; guidanceDirection: string[] };
                    children.push(new Paragraph({ text: `${subject} 과목 분석`, heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 200 } }));
                    if (d.studyStyle.length) { children.push(new Paragraph({ text: '학습 스타일', heading: HeadingLevel.HEADING_2, spacing: { before: 100, after: 100 } })); d.studyStyle.forEach((s: string) => children.push(new Paragraph({ text: s, spacing: { after: 100 } }))); }
                    if (d.weakAreas.length) { children.push(new Paragraph({ text: '취약한 부분', heading: HeadingLevel.HEADING_2, spacing: { before: 100, after: 100 } })); d.weakAreas.forEach((a: string) => children.push(new Paragraph({ text: `• ${a}`, spacing: { after: 100 } }))); }
                    if (d.mistakeTypes.length) { children.push(new Paragraph({ text: '실수 유형', heading: HeadingLevel.HEADING_2, spacing: { before: 100, after: 100 } })); d.mistakeTypes.forEach((m: string) => children.push(new Paragraph({ text: m, spacing: { after: 100 } }))); }
                    if (d.guidanceDirection.length) { children.push(new Paragraph({ text: '지도 방향', heading: HeadingLevel.HEADING_2, spacing: { before: 100, after: 100 } })); d.guidanceDirection.forEach((g: string) => children.push(new Paragraph({ text: g, spacing: { after: 100 } }))); }
                  });
                }
                if (displayAnalysis.overallGuidance?.length) {
                  children.push(new Paragraph({ text: '종합 평가 및 상담 마무리 멘트', heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 200 } }));
                  displayAnalysis.overallGuidance.forEach((g: string) => children.push(new Paragraph({ text: g, spacing: { after: 150 } })));
                }
                const doc = new Document({ sections: [{ children: children as any }] });
                try {
                  const blob = await Packer.toBlob(doc);
                  saveAs(blob, `학생분석리포트_${selectedMentee.name}_${new Date().toISOString().slice(0, 10)}.docx`);
                } catch (err) {
                  console.error(err);
                  alert('Word 다운로드 중 오류가 발생했습니다.');
                }
              }}
              variant="outline"
              className="no-print"
              icon={FileText}
            >
              Word 다운로드
            </Button>
          </div>

          <div id="analysis-report" className="mx-auto max-w-4xl rounded-xl border border-slate-200 bg-white p-8 shadow-lg">
            <div className="mb-6 border-b-2 border-slate-800 pb-4">
              <h1 className="mb-2 text-2xl font-bold text-slate-900">학생 학습 분석 리포트</h1>
              <div className="text-sm text-slate-600">
                <p>학생명: <span className="font-semibold">{selectedMentee?.name}</span> | 학년: {selectedMentee?.grade} | 과정: {selectedMentee?.track}</p>
                <p>작성일: {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>

            {kpi && (
              <div className="mb-6 grid grid-cols-4 gap-3">
                <div className="rounded-lg bg-slate-50 p-3 text-center">
                  <p className="mb-1 text-xs text-slate-600">총 학습 시간</p>
                  <p className="text-lg font-bold text-slate-900">{kpi.totalStudyHours}시간</p>
                  {kpi.studyHoursChange !== 0 && <p className="mt-1 text-xs text-slate-600">{kpi.studyHoursChange > 0 ? '+' : ''}{kpi.studyHoursChange}시간</p>}
                </div>
                <div className="rounded-lg bg-slate-50 p-3 text-center">
                  <p className="mb-1 text-xs text-slate-600">과제 완료율</p>
                  <p className="text-lg font-bold text-slate-900">{kpi.assignmentCompletionRate}%</p>
                  {kpi.completionRateChange !== 0 && <p className="mt-1 text-xs text-slate-600">{kpi.completionRateChange > 0 ? '+' : ''}{kpi.completionRateChange}%p</p>}
                </div>
                <div className="rounded-lg bg-slate-50 p-3 text-center">
                  <p className="mb-1 text-xs text-slate-600">평균 점수</p>
                  <p className="text-lg font-bold text-slate-900">{kpi.averageScore}점</p>
                  {kpi.scoreChange !== 0 && <p className="mt-1 text-xs text-slate-600">{kpi.scoreChange > 0 ? '+' : ''}{kpi.scoreChange}점</p>}
                </div>
                <div className="rounded-lg bg-slate-50 p-3 text-center">
                  <p className="mb-1 text-xs text-slate-600">출석률</p>
                  <p className="text-lg font-bold text-slate-900">{kpi.attendanceRate}%</p>
                  {kpi.attendanceChange !== 0 && <p className="mt-1 text-xs text-slate-600">{kpi.attendanceChange > 0 ? '+' : ''}{kpi.attendanceChange}%p</p>}
                </div>
              </div>
            )}

            {weeklyPatterns.length > 0 && (
              <div className="mb-6">
                <h2 className="mb-3 border-b-2 border-slate-200 pb-2 text-base font-bold text-slate-900">생활패턴 분석</h2>
                <div className="grid grid-cols-7 gap-2">
                  {weeklyPatterns.map((pattern) => {
                    const maxH = Math.max(...weeklyPatterns.map((p) => p.hours || 0), 1);
                    const h = ((pattern.hours || 0) / maxH) * 100;
                    return (
                      <div key={pattern.day} className="text-center">
                        <div className="mb-2 text-xs font-medium text-slate-600">{pattern.day}</div>
                        <div className="relative mx-auto h-20 w-full rounded-t bg-slate-100">
                          <div className="absolute bottom-0 w-full rounded-t bg-slate-600" style={{ height: `${Math.max(h, 5)}%` }} />
                        </div>
                        <div className="mt-1 text-xs text-slate-700">{pattern.hours || 0}h</div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="mb-1 font-semibold text-slate-700">주간 총 학습 시간</p>
                    <p className="text-lg font-bold text-slate-900">{weeklyPatterns.reduce((s, p) => s + (p.hours || 0), 0)}시간</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="mb-1 font-semibold text-slate-700">평균 일일 학습 시간</p>
                    <p className="text-lg font-bold text-slate-900">
                      {(weeklyPatterns.reduce((s, p) => s + (p.hours || 0), 0) / (weeklyPatterns.filter((p) => (p.hours || 0) > 0).length || 1)).toFixed(1)}시간
                    </p>
                  </div>
                </div>
              </div>
            )}

            {subjectStudyTimes.length > 0 && (
              <div className="mb-6">
                <h2 className="mb-3 border-b-2 border-slate-200 pb-2 text-base font-bold text-slate-900">과목별 학습 시간</h2>
                <div className="space-y-2">
                  {subjectStudyTimes.sort((a, b) => b.hours - a.hours).map((item) => {
                    const maxH = Math.max(...subjectStudyTimes.map((s) => s.hours), 1);
                    const pct = (item.hours / maxH) * 100;
                    return (
                      <div key={item.subject} className="flex items-center gap-3">
                        <div className="w-20 text-sm font-medium text-slate-700">{item.subject}</div>
                        <div className="flex-1">
                          <div className="h-6 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full rounded-full bg-slate-600" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                        <div className="w-16 text-right text-sm font-semibold text-slate-900">{item.hours}시간</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {displayAnalysis.overallAnalysis && displayAnalysis.overallAnalysis.summary.length > 0 && (
              <div className="mb-6" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                <div className="mb-3 flex items-center justify-between border-b-2 border-slate-200 pb-2">
                  <h2 className="text-base font-bold text-slate-900">전반적인 학습 태도 및 공부 스타일</h2>
                  {editingSection !== 'overall' ? (
                    <button type="button" onClick={() => { setEditingSection('overall'); setEditedAnalysis({ overallAnalysis: { ...displayAnalysis.overallAnalysis }, subjectDetailedAnalysis: displayAnalysis.subjectDetailedAnalysis, overallGuidance: displayAnalysis.overallGuidance }); }} className="flex items-center gap-1 rounded px-2 py-1 text-xs text-slate-600 hover:bg-slate-100">
                      <Edit className="h-3 w-3" /> 편집
                    </button>
                  ) : (
                    <div className="flex gap-1">
                      <button type="button" onClick={() => { if (editedAnalysis?.overallAnalysis && analysis) setAnalysis({ ...analysis, overallAnalysis: editedAnalysis.overallAnalysis }); setEditingSection(null); }} className="flex items-center gap-1 rounded px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"><Save className="h-3 w-3" /> 저장</button>
                      <button type="button" onClick={() => { setEditingSection(null); setEditedAnalysis(null); }} className="flex items-center gap-1 rounded px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"><X className="h-3 w-3" /> 취소</button>
                    </div>
                  )}
                </div>
                {editingSection === 'overall' && editedAnalysis?.overallAnalysis ? (
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700">요약</label>
                      <textarea value={editedAnalysis.overallAnalysis.summary.join('\n')} onChange={(e) => setEditedAnalysis({ ...editedAnalysis, overallAnalysis: { ...editedAnalysis.overallAnalysis!, summary: e.target.value.split('\n').filter((t) => t.trim()) } })} rows={4} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-700">장점 (쉼표로 구분)</label>
                        <textarea value={editedAnalysis.overallAnalysis.strengths.join(', ')} onChange={(e) => setEditedAnalysis({ ...editedAnalysis, overallAnalysis: { ...editedAnalysis.overallAnalysis!, strengths: e.target.value.split(',').map((s) => s.trim()).filter((s) => s) } })} rows={2} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-700">약점 (쉼표로 구분)</label>
                        <textarea value={editedAnalysis.overallAnalysis.weaknesses.join(', ')} onChange={(e) => setEditedAnalysis({ ...editedAnalysis, overallAnalysis: { ...editedAnalysis.overallAnalysis!, weaknesses: e.target.value.split(',').map((s) => s.trim()).filter((s) => s) } })} rows={2} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700">지도 포인트 (쉼표로 구분)</label>
                      <textarea value={editedAnalysis.overallAnalysis.guidancePoints.join(', ')} onChange={(e) => setEditedAnalysis({ ...editedAnalysis, overallAnalysis: { ...editedAnalysis.overallAnalysis!, guidancePoints: e.target.value.split(',').map((s) => s.trim()).filter((s) => s) } })} rows={2} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3 text-sm leading-relaxed text-slate-700">
                      {displayAnalysis.overallAnalysis.summary.map((text: string, idx: number) => <p key={idx}>{text}</p>)}
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      {displayAnalysis.overallAnalysis.strengths.length > 0 && (
                        <div className="rounded-lg bg-slate-50 p-3">
                          <p className="mb-2 text-xs font-semibold text-slate-700">장점</p>
                          <div className="flex flex-wrap gap-1.5">
                            {displayAnalysis.overallAnalysis.strengths.map((s: string, idx: number) => <span key={idx} className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700">{s}</span>)}
                          </div>
                        </div>
                      )}
                      {displayAnalysis.overallAnalysis.weaknesses.length > 0 && (
                        <div className="rounded-lg bg-slate-50 p-3">
                          <p className="mb-2 text-xs font-semibold text-slate-700">약점</p>
                          <div className="flex flex-wrap gap-1.5">
                            {displayAnalysis.overallAnalysis.weaknesses.map((w: string, idx: number) => <span key={idx} className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700">{w}</span>)}
                          </div>
                        </div>
                      )}
                    </div>
                    {displayAnalysis.overallAnalysis.guidancePoints.length > 0 && (
                      <div className="mt-4 rounded-lg bg-slate-50 p-3">
                        <p className="mb-1 text-xs font-semibold text-slate-700">지도 포인트</p>
                        <p className="text-sm text-slate-800">{displayAnalysis.overallAnalysis.guidancePoints.join(', ')}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {displayAnalysis?.subjectDetailedAnalysis && Object.keys(displayAnalysis.subjectDetailedAnalysis).length > 0 && (
              <div className="mb-6" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                <div className="mb-3 flex items-center justify-between border-b-2 border-slate-200 pb-2">
                  <h2 className="text-base font-bold text-slate-900">과목별 상세 분석</h2>
                  {editingSection !== 'subject' ? (
                    <button type="button" onClick={() => { setEditingSection('subject'); setEditedAnalysis({ overallAnalysis: displayAnalysis.overallAnalysis, subjectDetailedAnalysis: { ...displayAnalysis.subjectDetailedAnalysis }, overallGuidance: displayAnalysis.overallGuidance }); }} className="flex items-center gap-1 rounded px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"><Edit className="h-3 w-3" /> 편집</button>
                  ) : (
                    <div className="flex gap-1">
                      <button type="button" onClick={() => { if (editedAnalysis?.subjectDetailedAnalysis && analysis) setAnalysis({ ...analysis, subjectDetailedAnalysis: editedAnalysis.subjectDetailedAnalysis }); setEditingSection(null); }} className="flex items-center gap-1 rounded px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"><Save className="h-3 w-3" /> 저장</button>
                      <button type="button" onClick={() => { setEditingSection(null); setEditedAnalysis(null); }} className="flex items-center gap-1 rounded px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"><X className="h-3 w-3" /> 취소</button>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(displayAnalysis.subjectDetailedAnalysis).map(([subject, details]) => {
                    const d = details as { studyStyle: string[]; weakAreas: string[]; mistakeTypes: string[]; guidanceDirection: string[] };
                    return (
                      <div key={subject} className="rounded-lg border border-slate-200 bg-white p-4" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                        <h3 className="mb-3 text-sm font-bold text-slate-900">{subject} 과목 분석</h3>
                        {editingSection === 'subject' && editedAnalysis?.subjectDetailedAnalysis ? (
                          <div className="space-y-3">
                            <div>
                              <label className="mb-1 block text-xs font-semibold text-slate-600">학습 스타일</label>
                              <textarea value={editedAnalysis.subjectDetailedAnalysis[subject]?.studyStyle.join('\n') || ''} onChange={(e) => setEditedAnalysis({ ...editedAnalysis, subjectDetailedAnalysis: { ...editedAnalysis.subjectDetailedAnalysis!, [subject]: { ...editedAnalysis.subjectDetailedAnalysis![subject], studyStyle: e.target.value.split('\n').filter((t) => t.trim()) } } })} rows={2} className="w-full rounded-lg border border-slate-300 px-2 py-1 text-xs" />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-semibold text-slate-600">취약한 부분</label>
                              <textarea value={editedAnalysis.subjectDetailedAnalysis[subject]?.weakAreas.join('\n') || ''} onChange={(e) => setEditedAnalysis({ ...editedAnalysis, subjectDetailedAnalysis: { ...editedAnalysis.subjectDetailedAnalysis!, [subject]: { ...editedAnalysis.subjectDetailedAnalysis![subject], weakAreas: e.target.value.split('\n').filter((t) => t.trim()) } } })} rows={2} className="w-full rounded-lg border border-slate-300 px-2 py-1 text-xs" />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-semibold text-slate-600">실수 유형</label>
                              <textarea value={editedAnalysis.subjectDetailedAnalysis[subject]?.mistakeTypes.join('\n') || ''} onChange={(e) => setEditedAnalysis({ ...editedAnalysis, subjectDetailedAnalysis: { ...editedAnalysis.subjectDetailedAnalysis!, [subject]: { ...editedAnalysis.subjectDetailedAnalysis![subject], mistakeTypes: e.target.value.split('\n').filter((t) => t.trim()) } } })} rows={2} className="w-full rounded-lg border border-slate-300 px-2 py-1 text-xs" />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-semibold text-slate-600">지도 방향</label>
                              <textarea value={editedAnalysis.subjectDetailedAnalysis[subject]?.guidanceDirection.join('\n') || ''} onChange={(e) => setEditedAnalysis({ ...editedAnalysis, subjectDetailedAnalysis: { ...editedAnalysis.subjectDetailedAnalysis!, [subject]: { ...editedAnalysis.subjectDetailedAnalysis![subject], guidanceDirection: e.target.value.split('\n').filter((t) => t.trim()) } } })} rows={2} className="w-full rounded-lg border border-slate-300 px-2 py-1 text-xs" />
                            </div>
                          </div>
                        ) : (
                          <>
                            {d.studyStyle.length > 0 && <div className="mb-3"><p className="mb-1 text-xs font-semibold text-slate-600">학습 스타일</p>{d.studyStyle.map((s, i) => <p key={i} className="text-xs leading-relaxed text-slate-700">{s}</p>)}</div>}
                            {d.weakAreas.length > 0 && <div className="mb-3"><p className="mb-1 text-xs font-semibold text-slate-600">취약한 부분</p><ul className="space-y-0.5">{d.weakAreas.map((a, i) => <li key={i} className="text-xs text-slate-700">• {a}</li>)}</ul></div>}
                            {d.mistakeTypes.length > 0 && <div className="mb-3"><p className="mb-1 text-xs font-semibold text-slate-600">실수 유형</p>{d.mistakeTypes.map((m, i) => <p key={i} className="text-xs leading-relaxed text-slate-700">{m}</p>)}</div>}
                            {d.guidanceDirection.length > 0 && <div><p className="mb-1 text-xs font-semibold text-slate-600">지도 방향</p>{d.guidanceDirection.map((g, i) => <p key={i} className="text-xs leading-relaxed text-slate-700">{g}</p>)}</div>}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {displayAnalysis?.overallGuidance && displayAnalysis.overallGuidance.length > 0 && (
              <div className="rounded-lg border-2 border-slate-300 bg-slate-50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-base font-bold text-slate-900">종합 평가 및 상담 마무리 멘트</h2>
                  {editingSection !== 'guidance' ? (
                    <button type="button" onClick={() => { setEditingSection('guidance'); setEditedAnalysis({ overallAnalysis: displayAnalysis.overallAnalysis, subjectDetailedAnalysis: displayAnalysis.subjectDetailedAnalysis, overallGuidance: [...displayAnalysis.overallGuidance] }); }} className="flex items-center gap-1 rounded px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"><Edit className="h-3 w-3" /> 편집</button>
                  ) : (
                    <div className="flex gap-1">
                      <button type="button" onClick={() => { if (editedAnalysis?.overallGuidance && analysis) setAnalysis({ ...analysis, overallGuidance: editedAnalysis.overallGuidance }); setEditingSection(null); }} className="flex items-center gap-1 rounded px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"><Save className="h-3 w-3" /> 저장</button>
                      <button type="button" onClick={() => { setEditingSection(null); setEditedAnalysis(null); }} className="flex items-center gap-1 rounded px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"><X className="h-3 w-3" /> 취소</button>
                    </div>
                  )}
                </div>
                {editingSection === 'guidance' && editedAnalysis?.overallGuidance ? (
                  <textarea value={editedAnalysis.overallGuidance.join('\n')} onChange={(e) => setEditedAnalysis({ ...editedAnalysis, overallGuidance: e.target.value.split('\n').filter((t) => t.trim()) })} rows={6} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
                ) : (
                  <div className="space-y-2 text-sm leading-relaxed text-slate-700">
                    {displayAnalysis.overallGuidance.map((g: string, idx: number) => <p key={idx}>{g}</p>)}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      ) : selectedMenteeId ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-12">
          <BarChart3 className="h-12 w-12 text-slate-300" />
          <p className="mt-4 text-sm text-slate-500">데이터를 불러오는 중...</p>
        </div>
      ) : (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-12">
          <BarChart3 className="h-12 w-12 text-slate-300" />
          <h3 className="mt-4 text-lg font-semibold text-slate-800">통계 분석</h3>
          <p className="mt-2 text-center text-sm text-slate-500 max-w-md">멘티를 선택하면 학습 스타일, 강점, 약점, 개선점을 분석해드립니다.</p>
        </div>
      )}
    </div>
  );
}
