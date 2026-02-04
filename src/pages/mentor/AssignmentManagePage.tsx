import {
  AlertCircle,
  BarChart3,
  Calendar,
  CheckCircle2,
  Download,
  FolderOpen,
  Layers,
  Plus,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { Button } from '@/components/ui/Button';
import { useMentee } from '@/hooks/useMentee';
import {
  useFeedbackItems,
  useIncompleteAssignments,
  useMenteeKpi,
} from '@/hooks/useMenteeDetail';
import { useSubjectStudyTimes, useWeeklyPatterns } from '@/hooks/useLearningAnalysis';
import { useMentees } from '@/hooks/useMentees';

type TabType = 'templates' | 'materials' | 'planner' | 'analytics';

export function AssignmentManagePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>('templates');
  const [selectedMenteeId, setSelectedMenteeId] = useState<string>('');

  // URL 쿼리 파라미터에서 탭과 멘티 ID 읽기
  useEffect(() => {
    const tabParam = searchParams.get('tab') as TabType | null;
    const menteeIdParam = searchParams.get('menteeId');
    
    if (tabParam && ['templates', 'materials', 'planner', 'analytics'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
    
    if (menteeIdParam) {
      setSelectedMenteeId(menteeIdParam);
    }
  }, [searchParams]);

  const { data: mentees = [] } = useMentees();
  const { data: selectedMentee } = useMentee(selectedMenteeId || undefined);
  const { data: kpi } = useMenteeKpi(selectedMenteeId || undefined);
  const { data: feedbackItems = [] } = useFeedbackItems(selectedMenteeId || undefined);
  const { data: incompleteAssignments = [] } = useIncompleteAssignments(
    selectedMenteeId || undefined
  );
  const { data: subjectStudyTimes = [] } = useSubjectStudyTimes(selectedMenteeId || undefined);
  const { data: weeklyPatterns = [] } = useWeeklyPatterns(selectedMenteeId || undefined);

  const analysis = useMemo(() => {
    if (!selectedMenteeId || !kpi) return null;

    // 과제 제목에서 세부 카테고리 추출
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

    // 과목별 분석
    const subjectStats = feedbackItems.reduce(
      (acc, item) => {
        if (!acc[item.subject]) {
          acc[item.subject] = { total: 0, completed: 0, urgent: 0 };
        }
        acc[item.subject].total++;
        if (item.status === 'completed') acc[item.subject].completed++;
        if (item.status === 'urgent') acc[item.subject].urgent++;
        return acc;
      },
      {} as Record<string, { total: number; completed: number; urgent: number }>
    );

    // 과목별 세부 영역 분석
    const subjectDetailStats: Record<
      string,
      Record<string, { total: number; completed: number; urgent: number }>
    > = {};

    feedbackItems.forEach((item) => {
      const subCategory = extractSubCategory(item.title, item.subject);
      if (!subjectDetailStats[item.subject]) {
        subjectDetailStats[item.subject] = {};
      }
      if (!subjectDetailStats[item.subject][subCategory]) {
        subjectDetailStats[item.subject][subCategory] = { total: 0, completed: 0, urgent: 0 };
      }
      subjectDetailStats[item.subject][subCategory].total++;
      if (item.status === 'completed') subjectDetailStats[item.subject][subCategory].completed++;
      if (item.status === 'urgent') subjectDetailStats[item.subject][subCategory].urgent++;
    });

    // 강점: 완료율이 높은 과목/세부 영역, 학습 시간이 많은 과목
    const strengths: string[] = [];
    
    // 세부 영역별 강점 분석
    Object.entries(subjectDetailStats).forEach(([subject, detailStats]) => {
      Object.entries(detailStats).forEach(([subCategory, stats]) => {
        const completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
        if (completionRate >= 80 && stats.total >= 2) {
          strengths.push(`${subject} - ${subCategory} (완료율 ${Math.round(completionRate)}%)`);
        }
      });
    });

    // 과목별 강점
    Object.entries(subjectStats).forEach(([subject, stats]) => {
      const completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
      if (completionRate >= 80 && stats.total >= 3) {
        strengths.push(`${subject} 전체 (완료율 ${Math.round(completionRate)}%)`);
      }
    });

    const topStudySubject = subjectStudyTimes.sort((a, b) => b.hours - a.hours)[0];
    if (topStudySubject && topStudySubject.hours > 40) {
      strengths.push(`${topStudySubject.subject} (주간 ${topStudySubject.hours}시간 집중)`);
    }

    // 약점: 완료율이 낮은 과목/세부 영역, 긴급 과제가 많은 과목
    const weaknesses: string[] = [];
    
    // 세부 영역별 약점 분석
    Object.entries(subjectDetailStats).forEach(([subject, detailStats]) => {
      Object.entries(detailStats).forEach(([subCategory, stats]) => {
        const completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
        if (completionRate < 50 && stats.total >= 2) {
          weaknesses.push(`${subject} - ${subCategory} (완료율 ${Math.round(completionRate)}%)`);
        }
        if (stats.urgent >= 1) {
          weaknesses.push(`${subject} - ${subCategory} (긴급 과제 ${stats.urgent}개)`);
        }
      });
    });

    // 과목별 약점
    Object.entries(subjectStats).forEach(([subject, stats]) => {
      const completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
      if (completionRate < 50 && stats.total >= 2) {
        weaknesses.push(`${subject} 전체 (완료율 ${Math.round(completionRate)}%)`);
      }
      if (stats.urgent >= 2) {
        weaknesses.push(`${subject} 전체 (긴급 과제 ${stats.urgent}개)`);
      }
    });

    const lowStudySubject = subjectStudyTimes
      .filter((s) => s.hours > 0)
      .sort((a, b) => a.hours - b.hours)[0];
    if (lowStudySubject && lowStudySubject.hours < 20) {
      weaknesses.push(`${lowStudySubject.subject} (주간 ${lowStudySubject.hours}시간, 부족)`);
    }

    // 공부 스타일 분석
    const studyStyle: string[] = [];
    const avgDailyHours =
      weeklyPatterns.reduce((sum, p) => sum + (p.hours || 0), 0) / weeklyPatterns.length;
    if (avgDailyHours >= 3.5) {
      studyStyle.push('매우 꾸준한 학습 습관');
    } else if (avgDailyHours >= 2.5) {
      studyStyle.push('적절한 학습 습관');
    } else {
      studyStyle.push('학습 시간 확대 필요');
    }

    const weekendHours =
      (weeklyPatterns.find((p) => p.day === '토요일')?.hours || 0) +
      (weeklyPatterns.find((p) => p.day === '일요일')?.hours || 0);
    if (weekendHours > 5) {
      studyStyle.push('주말 집중형 학습자');
    } else if (weekendHours < 2) {
      studyStyle.push('평일 중심 학습자');
    }

    const mostActiveDay = weeklyPatterns
      .filter((p) => p.hours && p.hours > 0)
      .sort((a, b) => (b.hours || 0) - (a.hours || 0))[0];
    if (mostActiveDay) {
      studyStyle.push(`${mostActiveDay.day}에 가장 활발`);
    }

    // 고쳐야 할 점
    const improvements: string[] = [];
    if (kpi.assignmentCompletionRate < 80) {
      improvements.push(
        `과제 완료율 개선 필요 (현재 ${kpi.assignmentCompletionRate}%, 목표 80% 이상)`
      );
    }
    if (kpi.completionRateChange < 0) {
      improvements.push(`과제 완료율이 ${Math.abs(kpi.completionRateChange)}%p 하락했습니다`);
    }
    if (incompleteAssignments.filter((a) => a.status === 'deadline_soon').length > 0) {
      improvements.push('마감 임박 과제가 있어 즉시 처리 필요');
    }
    if (kpi.studyHoursChange < 0) {
      improvements.push(`학습 시간이 ${Math.abs(kpi.studyHoursChange)}시간 감소했습니다`);
    }

    // 전반적인 공부 스타일 종합 분석
    const overallAnalysis = {
      summary: [] as string[],
      strengths: [] as string[],
      weaknesses: [] as string[],
      guidancePoints: [] as string[],
    };

    // 기본 이해력 평가
    const avgCompletionRate = Object.values(subjectStats).reduce(
      (sum, stats) => sum + (stats.total > 0 ? (stats.completed / stats.total) * 100 : 0),
      0
    ) / Object.keys(subjectStats).length;

    // 약점 점검 습관 분석
    const weakSubjects = Object.entries(subjectStats)
      .filter(([, stats]) => {
        const rate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
        return rate < 60 && stats.total >= 2;
      })
      .map(([subject]) => subject);

    const strongSubjects = Object.entries(subjectStats)
      .filter(([, stats]) => {
        const rate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
        return rate >= 80 && stats.total >= 2;
      })
      .map(([subject]) => subject);

    const urgentCount = Object.values(subjectStats).reduce((sum, stats) => sum + stats.urgent, 0);

    // 전반적인 학습 태도 및 공부 스타일
    if (avgCompletionRate >= 60) {
      overallAnalysis.summary.push(
        '학생은 기본 개념 이해력은 있는 편이나, 고등 과정에서 요구되는 문제 분석의 깊이와 실수 관리가 아직 충분히 자리 잡지 않은 상태입니다.'
      );
    } else {
      overallAnalysis.summary.push(
        '학생은 기본 개념 이해력 보완이 필요한 상태이며, 고등 과정에서 요구되는 문제 분석의 깊이와 실수 관리가 아직 충분히 자리 잡지 않은 상태입니다.'
      );
    }

    if (weakSubjects.length > 0 && strongSubjects.length > 0) {
      overallAnalysis.summary.push(
        '공부할 때 스스로 약점을 점검하며 보완하기보다는, 비교적 잘 되는 단원이나 익숙한 유형 위주로 학습하려는 경향이 있습니다.'
      );
    }

    // 시험 상황 분석
    if (kpi.completionRateChange < 0 || kpi.scoreChange < 0 || urgentCount > 0) {
      overallAnalysis.summary.push(
        '시험 상황에서는 시간 압박이나 긴장으로 인해 평소보다 실수가 늘어나는 타입으로 보이며, 알고 있는 문제에서도 점수를 놓치는 경우가 종종 발생합니다.'
      );
    }

    overallAnalysis.summary.push(
      '전반적으로 학습량의 문제라기보다는, 공부 방식과 시험 대응 전략을 조정할 필요가 있는 학생입니다.'
    );

    // 과목별 상세 분석
    const subjectDetailedAnalysis: Record<
      string,
      {
        studyStyle: string[];
        weakAreas: string[];
        mistakeTypes: string[];
        guidanceDirection: string[];
      }
    > = {};

    ['국어', '영어', '수학'].forEach((subject) => {
      if (!subjectDetailStats[subject]) return;

      const detailStats = subjectDetailStats[subject];
      const subjectStat = subjectStats[subject] || { total: 0, completed: 0, urgent: 0 };
      const completionRate = subjectStat.total > 0 ? (subjectStat.completed / subjectStat.total) * 100 : 0;

      const analysis = {
        studyStyle: [] as string[],
        weakAreas: [] as string[],
        mistakeTypes: [] as string[],
        guidanceDirection: [] as string[],
      };

      if (subject === '국어') {
        // 학습 스타일
        analysis.studyStyle.push(
          '국어는 감각적으로 접근하는 경향이 있으며, 지문을 체계적으로 분석하기보다는 빠르게 읽고 정답을 찾으려는 편입니다.'
        );

        // 취약한 부분
        const 비문학Rate =
          detailStats['비문학'] && detailStats['비문학'].total > 0
            ? (detailStats['비문학'].completed / detailStats['비문학'].total) * 100
            : 0;
        const 문학Rate =
          detailStats['문학'] && detailStats['문학'].total > 0
            ? (detailStats['문학'].completed / detailStats['문학'].total) * 100
            : 0;

        if (비문학Rate < 70 || completionRate < 70) {
          analysis.weakAreas.push('비문학 지문에서 핵심 논지나 근거 문장을 정확히 잡아내지 못하는 경우가 있습니다.');
        }
        if (문학Rate < 70 || completionRate < 70) {
          analysis.weakAreas.push('문학에서는 선지 판단 기준이 흔들려 비슷한 선택지에서 오답이 발생하는 경향이 보입니다.');
        }
        if (detailStats['문법'] && detailStats['문법'].total > 0 && detailStats['문법'].completed < detailStats['문법'].total * 0.8) {
          analysis.weakAreas.push('내신 서술형에서는 답의 방향은 맞지만 표현이 부족해 감점되는 경우가 있습니다.');
        }

        // 실수 유형
        if (completionRate < 80 && subjectStat.total >= 1) {
          analysis.mistakeTypes.push(
            '지문은 이해했으나 문제에서 요구한 조건이나 관점을 놓쳐 오답으로 이어지는 경우가 잦습니다.'
          );
        }

        // 지도 방향
        analysis.guidanceDirection.push(
          '지문을 구조적으로 읽고, 문제에서 요구하는 기준을 먼저 확인하는 훈련을 진행할 예정입니다.'
        );
        analysis.guidanceDirection.push('속도보다는 정확도를 우선으로 하여 실전에서 안정적인 점수를 낼 수 있도록 지도합니다.');
      } else if (subject === '영어') {
        // 학습 스타일
        analysis.studyStyle.push(
          '영어는 아는 단어와 익숙한 표현 위주로 해석하는 편이며, 문장 구조가 복잡해질수록 의미를 추측해 문제를 푸는 경향이 있습니다.'
        );

        // 취약한 부분
        const 독해Rate =
          detailStats['독해'] && detailStats['독해'].total > 0
            ? (detailStats['독해'].completed / detailStats['독해'].total) * 100
            : 0;
        const 문법Rate =
          detailStats['문법'] && detailStats['문법'].total > 0
            ? (detailStats['문법'].completed / detailStats['문법'].total) * 100
            : 0;

        if (독해Rate < 70 || completionRate < 70) {
          analysis.weakAreas.push('긴 문장 구조 분석 능력이 부족해 해석이 중간에서 끊기는 경우가 있습니다.');
        }
        if (문법Rate < 70 || completionRate < 70) {
          analysis.weakAreas.push('문법은 개념은 알고 있으나 문제에 적용하는 과정에서 실수가 발생합니다.');
        }
        if (detailStats['어휘'] && detailStats['어휘'].total > 0 && detailStats['어휘'].completed < detailStats['어휘'].total * 0.8) {
          analysis.weakAreas.push('어휘의 정확한 의미와 뉘앙스 구분이 약한 편입니다.');
        }

        // 실수 유형
        if (독해Rate < 80 || completionRate < 80) {
          analysis.mistakeTypes.push(
            '문장을 끝까지 해석하지 않고 일부 의미만으로 답을 선택해 오답이 발생하는 경우가 있습니다.'
          );
        }

        // 지도 방향
        analysis.guidanceDirection.push(
          '모든 문제를 문장 구조 분석 후 해석하는 습관을 기르는 데 집중할 예정입니다.'
        );
        analysis.guidanceDirection.push('단어와 문법은 단순 암기가 아닌, 실제 문제 적용 위주로 반복 학습을 진행합니다.');
      } else if (subject === '수학') {
        // 학습 스타일
        analysis.studyStyle.push(
          '수학은 개념 이해 속도는 빠른 편이나, 문제를 풀 때 풀이 과정을 정리하지 않고 바로 답을 구하려는 경향이 있습니다.'
        );

        // 취약한 부분
        if (subjectStat.urgent > 0 || completionRate < 80) {
          analysis.weakAreas.push('계산 실수가 잦고, 문제 조건을 놓치는 경우가 있습니다.');
        }
        if (completionRate < 80) {
          analysis.weakAreas.push('풀이 과정이 생략되어 스스로 오류를 발견하지 못하는 경우가 많습니다.');
        }

        // 실수 유형
        if (completionRate < 85) {
          analysis.mistakeTypes.push(
            '풀 수 있는 문제임에도 불구하고 사소한 실수로 점수를 잃는 비중이 높은 학생입니다.'
          );
          analysis.mistakeTypes.push('시험 후에는 아는 문제였다는 반응이 자주 나타납니다.');
        }

        // 지도 방향
        analysis.guidanceDirection.push(
          '문제 풀이 시 조건 확인, 풀이 단계 정리, 검산 과정을 반드시 거치도록 지도할 예정입니다.'
        );
        analysis.guidanceDirection.push('실전 문제를 통해 시간 관리와 안정적인 풀이 습관을 함께 훈련합니다.');
      }

      if (
        analysis.studyStyle.length > 0 ||
        analysis.weakAreas.length > 0 ||
        analysis.mistakeTypes.length > 0 ||
        analysis.guidanceDirection.length > 0
      ) {
        subjectDetailedAnalysis[subject] = analysis;
      }
    });

    // 종합 평가 및 상담 마무리 멘트
    const overallGuidance = [];
    if (avgCompletionRate >= 50) {
      overallGuidance.push(
        '학생은 학습 능력이 부족하다기보다는, 고등 과정에 맞는 공부 방식과 시험 전략이 아직 완전히 정립되지 않은 상태입니다.'
      );
      overallGuidance.push(
        '약점과 실수 유형이 비교적 명확하기 때문에, 이를 중심으로 지도할 경우 내신과 수능 모두에서 성적 향상을 기대할 수 있습니다.'
      );
      overallGuidance.push(
        '학습량을 무작정 늘리기보다는, 정확한 문제 해석과 실수 관리에 초점을 맞춰 지도할 계획입니다.'
      );
    } else {
      overallGuidance.push(
        '학생은 기본 학습 능력 보완과 함께, 고등 과정에 맞는 공부 방식과 시험 전략을 정립할 필요가 있습니다.'
      );
      overallGuidance.push(
        '약점과 실수 유형을 중심으로 지도하여 내신과 수능 모두에서 성적 향상을 기대할 수 있습니다.'
      );
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

  const tabs = [
    { id: 'templates' as TabType, label: '과제 템플릿', icon: Layers },
    { id: 'materials' as TabType, label: '학습 자료', icon: FolderOpen },
    { id: 'planner' as TabType, label: '플래너 관리', icon: Calendar },
    { id: 'analytics' as TabType, label: '통계 분석', icon: BarChart3 },
  ];

  return (
    <div className="min-w-0 space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-500">
            과제를 관리하고 피드백을 작성하세요
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/mentor/assignments/new">
            <Button size="sm">
              <Plus className="h-4 w-4" />
              새 과제 등록
            </Button>
          </Link>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-slate-800 text-slate-900'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 탭별 콘텐츠 */}
      {/* 과제 템플릿 탭 */}
      {activeTab === 'templates' && (
        <PlaceholderSection
          title="과제 템플릿"
          description="자주 사용하는 과제 템플릿을 저장하고 재사용할 수 있습니다."
          icon={<Layers className="h-8 w-8" />}
        />
      )}

      {/* 학습 자료 탭 */}
      {activeTab === 'materials' && (
        <PlaceholderSection
          title="학습 자료"
          description="PDF, 이미지 등 학습 자료를 관리하고 과제에 첨부할 수 있습니다."
          icon={<FolderOpen className="h-8 w-8" />}
        />
      )}

      {/* 플래너 관리 탭 */}
      {activeTab === 'planner' && (
        <PlaceholderSection
          title="플래너 관리"
          description="멘티별 학습 플래너를 생성하고 관리할 수 있습니다. 주간/월간 학습 계획을 수립하고 추적하세요."
          icon={<Calendar className="h-8 w-8" />}
        />
      )}

      {/* 통계 분석 탭 */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* 멘티 선택 */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              분석할 멘티 선택
            </label>
            <select
              value={selectedMenteeId}
              onChange={(e) => setSelectedMenteeId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400 sm:max-w-xs"
            >
              <option value="">멘티를 선택하세요</option>
              {mentees.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.grade} · {m.track})
                </option>
              ))}
            </select>
          </div>

          {selectedMenteeId && analysis ? (
            <>
              {/* PDF 다운로드 버튼 */}
              <div className="flex justify-end">
                <Button
                  onClick={() => {
                    const printWindow = window.open('', '_blank');
                    if (!printWindow) return;
                    const reportContent = document.getElementById('analysis-report');
                    if (!reportContent) return;
                    printWindow.document.write(`
                      <!DOCTYPE html>
                      <html>
                        <head>
                          <title>학생 분석 리포트 - ${selectedMentee?.name || ''}</title>
                          <style>
                            @page { size: A4; margin: 1cm; }
                            body { font-family: 'Malgun Gothic', sans-serif; font-size: 11pt; line-height: 1.6; color: #1e293b; }
                            .header { border-bottom: 3px solid #1e293b; padding-bottom: 15px; margin-bottom: 20px; }
                            .header h1 { margin: 0; font-size: 24pt; font-weight: bold; }
                            .header .meta { margin-top: 8px; font-size: 10pt; color: #64748b; }
                            .section { margin-bottom: 20px; page-break-inside: avoid; }
                            .section-title { font-size: 14pt; font-weight: bold; margin-bottom: 10px; padding-bottom: 5px; border-bottom: 2px solid #e2e8f0; }
                            .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 20px; }
                            .kpi-item { text-align: center; padding: 10px; background: #f8fafc; border-radius: 8px; }
                            .kpi-label { font-size: 9pt; color: #64748b; margin-bottom: 5px; }
                            .kpi-value { font-size: 18pt; font-weight: bold; color: #1e293b; }
                            .kpi-change { font-size: 9pt; margin-top: 3px; }
                            .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                            .content-box { background: #f8fafc; padding: 12px; border-radius: 6px; margin-bottom: 10px; }
                            .content-box h4 { font-size: 10pt; font-weight: bold; margin-bottom: 8px; color: #475569; }
                            .content-box ul { margin: 0; padding-left: 20px; }
                            .content-box li { margin-bottom: 5px; font-size: 10pt; }
                            .subject-analysis { margin-bottom: 15px; padding: 15px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; page-break-inside: avoid; }
                            .subject-title { font-size: 13pt; font-weight: bold; margin-bottom: 12px; }
                            .subject-section { margin-bottom: 15px; }
                            .subject-section-title { font-size: 9pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; color: #475569; }
                            .subject-content { background: #f8fafc; padding: 12px; border-radius: 6px; }
                            .badge { display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 9pt; margin-right: 5px; margin-bottom: 5px; }
                            .pattern-chart { display: flex; justify-content: space-between; margin: 10px 0; }
                            .pattern-day { text-align: center; flex: 1; }
                            .pattern-bar { height: 60px; background: #475569; margin: 5px 0; border-radius: 4px; }
                            .page-break { page-break-after: always; }
                            @media print {
                              .no-print { display: none; }
                              .page-break { page-break-after: always; }
                            }
                          </style>
                        </head>
                        <body>
                          ${reportContent.innerHTML}
                        </body>
                      </html>
                    `);
                    printWindow.document.close();
                    setTimeout(() => {
                      printWindow.print();
                    }, 250);
                  }}
                  className="no-print"
                >
                  <Download className="h-4 w-4" />
                  PDF 다운로드
                </Button>
              </div>

              {/* 리포트 내용 */}
              <div
                id="analysis-report"
                className="mx-auto max-w-4xl rounded-xl border border-slate-200 bg-white p-8 shadow-lg"
              >
                {/* 헤더 */}
                <div className="mb-6 border-b-2 border-slate-800 pb-4">
                  <h1 className="mb-2 text-2xl font-bold text-slate-900">
                    학생 학습 분석 리포트
                  </h1>
                  <div className="text-sm text-slate-600">
                    <p>
                      학생명: <span className="font-semibold">{selectedMentee?.name}</span> | 학년: {selectedMentee?.grade} | 과정: {selectedMentee?.track}
                    </p>
                    <p>작성일: {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                </div>

                {/* KPI 요약 */}
                {kpi && (
                  <div className="mb-6 grid grid-cols-4 gap-3">
                    <div className="rounded-lg bg-slate-50 p-3 text-center">
                      <p className="mb-1 text-xs text-slate-600">총 학습 시간</p>
                      <p className="text-lg font-bold text-slate-900">{kpi.totalStudyHours}시간</p>
                      {kpi.studyHoursChange !== 0 && (
                        <p className="mt-1 text-xs text-slate-600">
                          {kpi.studyHoursChange > 0 ? '+' : ''}
                          {kpi.studyHoursChange}시간
                        </p>
                      )}
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3 text-center">
                      <p className="mb-1 text-xs text-slate-600">과제 완료율</p>
                      <p className="text-lg font-bold text-slate-900">{kpi.assignmentCompletionRate}%</p>
                      {kpi.completionRateChange !== 0 && (
                        <p className="mt-1 text-xs text-slate-600">
                          {kpi.completionRateChange > 0 ? '+' : ''}
                          {kpi.completionRateChange}%p
                        </p>
                      )}
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3 text-center">
                      <p className="mb-1 text-xs text-slate-600">평균 점수</p>
                      <p className="text-lg font-bold text-slate-900">{kpi.averageScore}점</p>
                      {kpi.scoreChange !== 0 && (
                        <p className="mt-1 text-xs text-slate-600">
                          {kpi.scoreChange > 0 ? '+' : ''}
                          {kpi.scoreChange}점
                        </p>
                      )}
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3 text-center">
                      <p className="mb-1 text-xs text-slate-600">출석률</p>
                      <p className="text-lg font-bold text-slate-900">{kpi.attendanceRate}%</p>
                      {kpi.attendanceChange !== 0 && (
                        <p className="mt-1 text-xs text-slate-600">
                          {kpi.attendanceChange > 0 ? '+' : ''}
                          {kpi.attendanceChange}%p
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* 생활패턴 분석 */}
                {weeklyPatterns.length > 0 && (
                  <div className="mb-6">
                    <h2 className="mb-3 border-b-2 border-slate-200 pb-2 text-base font-bold text-slate-900">
                      생활패턴 분석
                    </h2>
                    <div className="grid grid-cols-7 gap-2">
                      {weeklyPatterns.map((pattern) => {
                        const maxHours = Math.max(...weeklyPatterns.map((p) => p.hours || 0), 1);
                        const height = ((pattern.hours || 0) / maxHours) * 100;
                        return (
                          <div key={pattern.day} className="text-center">
                            <div className="mb-2 text-xs font-medium text-slate-600">{pattern.day}</div>
                            <div className="relative mx-auto h-20 w-full rounded-t bg-slate-100">
                              <div
                                className="absolute bottom-0 w-full rounded-t bg-slate-600 transition-all"
                                style={{ height: `${Math.max(height, 5)}%` }}
                              />
                            </div>
                            <div className="mt-1 text-xs text-slate-700">{pattern.hours || 0}h</div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                      <div className="rounded-lg bg-slate-50 p-3">
                        <p className="mb-1 font-semibold text-slate-700">주간 총 학습 시간</p>
                        <p className="text-lg font-bold text-slate-900">
                          {weeklyPatterns.reduce((sum, p) => sum + (p.hours || 0), 0)}시간
                        </p>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-3">
                        <p className="mb-1 font-semibold text-slate-700">평균 일일 학습 시간</p>
                        <p className="text-lg font-bold text-slate-900">
                          {(
                            weeklyPatterns.reduce((sum, p) => sum + (p.hours || 0), 0) /
                            weeklyPatterns.filter((p) => (p.hours || 0) > 0).length || 1
                          ).toFixed(1)}시간
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 과목별 학습 시간 */}
                {subjectStudyTimes.length > 0 && (
                  <div className="mb-6">
                    <h2 className="mb-3 border-b-2 border-slate-200 pb-2 text-base font-bold text-slate-900">
                      과목별 학습 시간
                    </h2>
                    <div className="space-y-2">
                      {subjectStudyTimes
                        .sort((a, b) => b.hours - a.hours)
                        .map((item) => {
                          const maxHours = Math.max(...subjectStudyTimes.map((s) => s.hours), 1);
                          const percentage = (item.hours / maxHours) * 100;
                          return (
                            <div key={item.subject} className="flex items-center gap-3">
                              <div className="w-20 text-sm font-medium text-slate-700">{item.subject}</div>
                              <div className="flex-1">
                                <div className="h-6 overflow-hidden rounded-full bg-slate-100">
                                  <div
                                    className="h-full rounded-full bg-slate-600"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                              </div>
                              <div className="w-16 text-right text-sm font-semibold text-slate-900">
                                {item.hours}시간
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* 전반적인 학습 태도 및 공부 스타일 */}
                {analysis.overallAnalysis && analysis.overallAnalysis.summary.length > 0 && (
                  <div className="mb-6">
                    <h2 className="mb-3 border-b-2 border-slate-200 pb-2 text-base font-bold text-slate-900">
                      전반적인 학습 태도 및 공부 스타일
                    </h2>
                    <div className="space-y-3 text-sm leading-relaxed text-slate-700">
                      {analysis.overallAnalysis.summary.map((text, idx) => (
                        <p key={idx}>{text}</p>
                      ))}
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      {analysis.overallAnalysis.strengths.length > 0 && (
                        <div className="rounded-lg bg-slate-50 p-3">
                          <p className="mb-2 text-xs font-semibold text-slate-700">장점</p>
                          <div className="flex flex-wrap gap-1.5">
                            {analysis.overallAnalysis.strengths.map((strength, idx) => (
                              <span
                                key={idx}
                                className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700"
                              >
                                {strength}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {analysis.overallAnalysis.weaknesses.length > 0 && (
                        <div className="rounded-lg bg-slate-50 p-3">
                          <p className="mb-2 text-xs font-semibold text-slate-700">약점</p>
                          <div className="flex flex-wrap gap-1.5">
                            {analysis.overallAnalysis.weaknesses.map((weakness, idx) => (
                              <span
                                key={idx}
                                className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700"
                              >
                                {weakness}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    {analysis.overallAnalysis.guidancePoints.length > 0 && (
                      <div className="mt-4 rounded-lg bg-slate-50 p-3">
                        <p className="mb-1 text-xs font-semibold text-slate-700">지도 포인트</p>
                        <p className="text-sm text-slate-800">
                          {analysis.overallAnalysis.guidancePoints.join(', ')}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* 과목별 상세 분석 */}
                {analysis.subjectDetailedAnalysis &&
                  Object.keys(analysis.subjectDetailedAnalysis).length > 0 && (
                    <div className="mb-6">
                      <h2 className="mb-3 border-b-2 border-slate-200 pb-2 text-base font-bold text-slate-900">
                        과목별 상세 분석
                      </h2>
                      <div className="grid grid-cols-2 gap-4">
                        {Object.entries(analysis.subjectDetailedAnalysis).map(([subject, details]) => (
                          <div key={subject} className="rounded-lg border border-slate-200 bg-white p-4">
                            <h3 className="mb-3 text-sm font-bold text-slate-900">
                              {subject} 과목 분석 {subject === '국어' ? '(내신·수능 연계)' : subject === '영어' ? '(내신·수능 공통)' : '(내신·수능 공통)'}
                            </h3>
                            {details.studyStyle.length > 0 && (
                              <div className="mb-3">
                                <p className="mb-1 text-xs font-semibold text-slate-600">학습 스타일</p>
                                {details.studyStyle.map((style, idx) => (
                                  <p key={idx} className="text-xs leading-relaxed text-slate-700">
                                    {style}
                                  </p>
                                ))}
                              </div>
                            )}
                            {details.weakAreas.length > 0 && (
                              <div className="mb-3">
                                <p className="mb-1 text-xs font-semibold text-slate-600">취약한 부분</p>
                                <ul className="space-y-0.5">
                                  {details.weakAreas.map((area, idx) => (
                                    <li key={idx} className="text-xs text-slate-700">• {area}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {details.mistakeTypes.length > 0 && (
                              <div className="mb-3">
                                <p className="mb-1 text-xs font-semibold text-slate-600">실수 유형</p>
                                {details.mistakeTypes.map((mistake, idx) => (
                                  <p key={idx} className="text-xs leading-relaxed text-slate-700">
                                    {mistake}
                                  </p>
                                ))}
                              </div>
                            )}
                            {details.guidanceDirection.length > 0 && (
                              <div>
                                <p className="mb-1 text-xs font-semibold text-slate-600">지도 방향</p>
                                {details.guidanceDirection.map((direction, idx) => (
                                  <p key={idx} className="text-xs leading-relaxed text-slate-700">
                                    {direction}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* 종합 평가 및 상담 마무리 멘트 */}
                {analysis.overallGuidance && analysis.overallGuidance.length > 0 && (
                  <div className="rounded-lg border-2 border-slate-300 bg-slate-50 p-4">
                    <h2 className="mb-3 text-base font-bold text-slate-900">
                      종합 평가 및 상담 마무리 멘트
                    </h2>
                    <div className="space-y-2 text-sm leading-relaxed text-slate-700">
                      {analysis.overallGuidance.map((guidance, idx) => (
                        <p key={idx}>{guidance}</p>
                      ))}
                    </div>
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
            <PlaceholderSection
              title="통계 분석"
              description="멘티를 선택하면 학습 스타일, 강점, 약점, 개선점을 분석해드립니다."
              icon={<BarChart3 className="h-8 w-8" />}
            />
          )}
        </div>
      )}

    </div>
  );
}

function PlaceholderSection({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-12">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-slate-800">{title}</h3>
      <p className="mt-2 text-center text-sm text-slate-500 max-w-md">{description}</p>
      <p className="mt-6 text-xs text-slate-400">준비 중입니다.</p>
    </div>
  );
}
