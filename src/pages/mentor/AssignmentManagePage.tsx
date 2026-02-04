import {
  BarChart3,
  Calendar,
  Download,
  Edit,
  File,
  FileText,
  FolderOpen,
  Image,
  Layers,
  Plus,
  Save,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import { useMemo, useState, useEffect, useRef } from 'react';
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
import {
  MOCK_LEARNING_MATERIALS,
  SUBJECT_SUBCATEGORIES,
} from '@/data/assignmentRegisterMock';
import {
  getPlannerRecordsByMenteeAndDate,
  formatPlannerDuration,
  type PlannerRecord,
} from '@/data/plannerMock';
import { getPlannerFeedback, savePlannerFeedback } from '@/lib/plannerFeedbackStorage';
import {
  deleteMaterial,
  getMaterialsMeta,
  saveMaterial,
  type MaterialMeta,
} from '@/lib/materialStorage';

type TabType = 'templates' | 'materials' | 'planner' | 'analytics';

interface MaterialItem extends MaterialMeta {}

export function AssignmentManagePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>('templates');
  const [selectedMenteeId, setSelectedMenteeId] = useState<string>('');
  
  // 학습 자료 관리 상태
  const [materials, setMaterials] = useState<MaterialItem[]>(() => {
    const stored = getMaterialsMeta();
    if (stored.length > 0) {
      return stored.map((m) => ({
        ...m,
        subCategory: m.subCategory || '기타',
      }));
    }
    // 초기 Mock 데이터
    return MOCK_LEARNING_MATERIALS.map((mat, idx) => {
      const subject = mat.subject || '기타';
      let subCategory = '기타';
      if (subject === '국어') {
        if (mat.title.includes('비문학')) subCategory = '비문학';
        else if (mat.title.includes('문학')) subCategory = '문학';
        else subCategory = '문법';
      } else if (subject === '영어') subCategory = '독해/듣기/어휘';
      else if (subject === '수학') subCategory = mat.title.includes('기하') ? '기하' : '미적분';
      return {
        id: mat.id,
        title: mat.title,
        fileName: mat.title,
        fileSize: mat.fileSize || '0 MB',
        fileType: (mat.title.toLowerCase().endsWith('.pdf') ? 'pdf' : 
                  /\.(jpg|jpeg|png|gif)$/i.test(mat.title) ? 'image' :
                  /\.(doc|docx|xls|xlsx)$/i.test(mat.title) ? 'document' : 'other') as MaterialItem['fileType'],
        subject,
        subCategory,
        uploadedAt: new Date(Date.now() - idx * 86400000).toISOString().split('T')[0],
      };
    });
  });
  const [materialSubjectFilter, setMaterialSubjectFilter] = useState<string>('전체');
  const [materialSubCategoryFilter, setMaterialSubCategoryFilter] = useState<string>('전체');
  const [materialSearchQuery, setMaterialSearchQuery] = useState<string>('');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<{ file: File; meta: Partial<MaterialMeta> }[]>([]);
  const materialFileInputRef = useRef<HTMLInputElement>(null);

  // 플래너 관리 상태
  const [plannerMenteeId, setPlannerMenteeId] = useState<string>('');
  const [plannerDate, setPlannerDate] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [plannerFeedbackText, setPlannerFeedbackText] = useState<string>('');
  
  // 편집 상태 관리
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editedAnalysis, setEditedAnalysis] = useState<{
    overallAnalysis?: {
      summary: string[];
      strengths: string[];
      weaknesses: string[];
      guidancePoints: string[];
    };
    subjectDetailedAnalysis?: Record<
      string,
      {
        studyStyle: string[];
        weakAreas: string[];
        mistakeTypes: string[];
        guidanceDirection: string[];
      }
    >;
    overallGuidance?: string[];
  } | null>(null);

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

  const computedAnalysis = useMemo(() => {
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

  // 분석 데이터를 상태로 관리 (편집 가능하도록)
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
  const [analysis, setAnalysis] = useState<AnalysisType | null>(null);
  
  useEffect(() => {
    if (computedAnalysis) {
      setAnalysis(computedAnalysis as AnalysisType);
      setEditedAnalysis(null);
      setEditingSection(null);
    } else {
      setAnalysis(null);
    }
  }, [computedAnalysis]);

  // 플래너 피드백 로드
  useEffect(() => {
    if (plannerMenteeId && plannerDate) {
      const saved = getPlannerFeedback(plannerMenteeId, plannerDate);
      setPlannerFeedbackText(saved?.feedbackText ?? '');
    } else {
      setPlannerFeedbackText('');
    }
  }, [plannerMenteeId, plannerDate]);

  // 편집된 분석 데이터 사용 (편집 중이면 편집된 데이터, 아니면 원본)
  const displayAnalysis = editedAnalysis && editingSection ? {
    ...analysis!,
    ...editedAnalysis,
  } : analysis;

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
        <div className="space-y-6">
          {/* 상단: 필터 및 검색 */}
          <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4">
            {/* 과목 필터 */}
            <div className="flex flex-wrap gap-2">
              {['전체', '국어', '영어', '수학', '과학', '사회'].map((subject) => (
                <button
                  key={subject}
                  type="button"
                  onClick={() => {
                    setMaterialSubjectFilter(subject);
                    setMaterialSubCategoryFilter('전체');
                  }}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    materialSubjectFilter === subject
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {subject}
                </button>
              ))}
            </div>
            {/* 세부 카테고리 필터 (과목 선택 시) */}
            {materialSubjectFilter !== '전체' && SUBJECT_SUBCATEGORIES[materialSubjectFilter] && (
              <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                <span className="text-xs font-medium text-slate-500">세부 분류:</span>
                {['전체', ...SUBJECT_SUBCATEGORIES[materialSubjectFilter]].map((sub) => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => setMaterialSubCategoryFilter(sub)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                      materialSubCategoryFilter === sub
                        ? 'bg-slate-700 text-white'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            )}
            {/* 검색 및 업로드 */}
            <div className="flex gap-2 border-t border-slate-100 pt-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="자료 검색..."
                  value={materialSearchQuery}
                  onChange={(e) => setMaterialSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                />
              </div>
              <input
                ref={materialFileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  if (files.length === 0) return;
                  setPendingFiles(files.map((file) => ({
                    file,
                    meta: {
                      title: file.name,
                      fileName: file.name,
                      fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
                      fileType: (file.type.includes('pdf') ? 'pdf' :
                                file.type.startsWith('image/') ? 'image' :
                                file.type.includes('document') || file.type.includes('word') || file.type.includes('excel') ? 'document' : 'other') as MaterialMeta['fileType'],
                      subject: '국어',
                      subCategory: '비문학',
                      uploadedAt: new Date().toISOString().split('T')[0],
                    },
                  })));
                  setUploadModalOpen(true);
                  e.target.value = '';
                }}
              />
              <Button
                type="button"
                className="whitespace-nowrap"
                onClick={() => materialFileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
                파일 업로드
              </Button>
            </div>
          </div>

          {/* 업로드 모달 */}
          {uploadModalOpen && (
            <MaterialUploadModal
              pendingFiles={pendingFiles}
              onClose={() => {
                setUploadModalOpen(false);
                setPendingFiles([]);
              }}
              onConfirm={async (itemsToSave) => {
                for (const { file, meta } of itemsToSave) {
                  const fullMeta: MaterialMeta = {
                    ...meta,
                    id: `mat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  };
                  await saveMaterial(fullMeta, file);
                  setMaterials((prev) => [fullMeta, ...prev]);
                }
                setUploadModalOpen(false);
                setPendingFiles([]);
              }}
            />
          )}

          {/* 자료 목록 */}
          {(() => {
            const filteredMaterials = materials.filter((mat) => {
              const matchesSubject = materialSubjectFilter === '전체' || mat.subject === materialSubjectFilter;
              const matchesSubCategory = materialSubCategoryFilter === '전체' || mat.subCategory === materialSubCategoryFilter;
              const matchesSearch = materialSearchQuery === '' || 
                mat.title.toLowerCase().includes(materialSearchQuery.toLowerCase()) ||
                mat.fileName.toLowerCase().includes(materialSearchQuery.toLowerCase());
              return matchesSubject && matchesSubCategory && matchesSearch;
            });

            if (filteredMaterials.length === 0) {
              return (
                <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-12">
                  <FolderOpen className="h-12 w-12 text-slate-300" />
                  <p className="mt-4 text-sm text-slate-500">
                    {materialSearchQuery || materialSubjectFilter !== '전체' || materialSubCategoryFilter !== '전체'
                      ? '검색 결과가 없습니다.'
                      : '등록된 학습 자료가 없습니다.'}
                  </p>
                </div>
              );
            }

            return (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredMaterials.map((material) => {
                  const FileIcon = material.fileType === 'pdf' ? FileText :
                                 material.fileType === 'image' ? Image :
                                 material.fileType === 'document' ? File : File;
                  
                  return (
                    <div
                      key={material.id}
                      className="group relative rounded-xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                          <FileIcon className="h-6 w-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate font-semibold text-slate-900">{material.title}</h3>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span className="rounded-full bg-slate-100 px-2 py-0.5">{material.subject}</span>
                            {material.subCategory && material.subCategory !== '기타' && (
                              <span className="rounded-full bg-slate-100 px-2 py-0.5">{material.subCategory}</span>
                            )}
                            <span>{material.fileSize}</span>
                            <span>•</span>
                            <span>{material.uploadedAt}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            if (window.confirm(`"${material.title}" 자료를 삭제하시겠습니까?`)) {
                              await deleteMaterial(material.id);
                              setMaterials((prev) => prev.filter((m) => m.id !== material.id));
                            }
                          }}
                          className="shrink-0 rounded p-1 text-slate-400 opacity-0 transition-opacity hover:text-red-600 group-hover:opacity-100"
                          title="삭제"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* 플래너 관리 탭 */}
      {activeTab === 'planner' && (
        <div className="space-y-6">
          {/* 멘티 및 날짜 선택 */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
              <div className="flex-1">
                <label className="mb-1 block text-sm font-medium text-slate-700">멘티 선택</label>
                <select
                  value={plannerMenteeId}
                  onChange={(e) => setPlannerMenteeId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
                >
                  <option value="">멘티를 선택하세요</option>
                  {mentees.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.grade} · {m.track})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-sm font-medium text-slate-700">날짜 선택</label>
                <input
                  type="date"
                  value={plannerDate}
                  onChange={(e) => setPlannerDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>
            </div>
          </div>

          {plannerMenteeId ? (
            <>
              {/* 학생 기록 (과제/학습 시간) */}
              {(() => {
                const records = getPlannerRecordsByMenteeAndDate(plannerMenteeId, plannerDate);
                const totalMinutes = records.reduce((sum, r) => sum + r.durationMinutes, 0);
                const totalHours = (totalMinutes / 60).toFixed(1);
                const selectedMenteeName = mentees.find((m) => m.id === plannerMenteeId)?.name ?? '';

                return (
                  <div className="grid gap-6 lg:grid-cols-2">
                    {/* 좌측: 과제 목록 + 피드백 */}
                    <div className="space-y-6">
                      <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <h3 className="mb-3 text-base font-semibold text-slate-900">과제 (학습 기록)</h3>
                        {records.length === 0 ? (
                          <p className="py-6 text-center text-sm text-slate-500">
                            해당 날짜에 기록된 학습이 없습니다.
                          </p>
                        ) : (
                          <>
                            <div className="mb-3 flex items-center justify-between text-sm text-slate-600">
                              <span>총 학습 시간: {totalHours}시간</span>
                            </div>
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
                          </>
                        )}
                      </div>

                      {/* 피드백 작성 */}
                      <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <h3 className="mb-3 text-base font-semibold text-slate-900">플래너 피드백</h3>
                        <p className="mb-3 text-sm text-slate-500">
                          {selectedMenteeName}님의 학습 기록을 확인하고 피드백을 작성해주세요.
                        </p>
                        <textarea
                          value={plannerFeedbackText}
                          onChange={(e) => setPlannerFeedbackText(e.target.value)}
                          placeholder="예: 오늘 수학 학습 시간이 가장 많았네요. 내일은 영어 독해 비중을 늘려보면 좋겠습니다. 휴식 시간도 충분히 갖는 것이 중요해요."
                          rows={5}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
                        />
                        <div className="mt-3 flex justify-end">
                          <Button
                            type="button"
                            onClick={() => {
                              if (!plannerMenteeId || !plannerDate) return;
                              savePlannerFeedback({
                                id: `pf-${plannerMenteeId}-${plannerDate}`,
                                menteeId: plannerMenteeId,
                                date: plannerDate,
                                feedbackText: plannerFeedbackText,
                                createdAt: new Date().toISOString(),
                              });
                              alert('피드백이 저장되었습니다.');
                            }}
                          >
                            피드백 저장
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* 우측: 타임라인 */}
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
              })()}
            </>
          ) : (
            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-12">
              <Calendar className="h-12 w-12 text-slate-300" />
              <p className="mt-4 text-sm text-slate-500">멘티를 선택하면 플래너를 확인하고 피드백을 작성할 수 있습니다.</p>
            </div>
          )}
        </div>
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

          {selectedMenteeId && analysis && displayAnalysis ? (
            <>
              {/* 다운로드 버튼 */}
              <div className="flex justify-end gap-2">
                <Button
                  onClick={async () => {
                    // 편집 모드일 때는 경고
                    if (editingSection) {
                      alert('편집 모드를 종료한 후 PDF를 다운로드해주세요.');
                      return;
                    }

                    const reportContent = document.getElementById('analysis-report');
                    if (!reportContent) return;

                    // 리포트 내용 복제
                    const clonedContent = reportContent.cloneNode(true) as HTMLElement;
                    
                    // 모든 버튼 제거
                    const allButtons = clonedContent.querySelectorAll('button');
                    allButtons.forEach((btn) => {
                      btn.remove();
                    });

                    // 모든 SVG 아이콘 제거
                    const allSvgs = clonedContent.querySelectorAll('svg');
                    allSvgs.forEach((svg) => {
                      svg.remove();
                    });

                    // textarea를 일반 텍스트로 변환
                    const allTextareas = clonedContent.querySelectorAll('textarea');
                    allTextareas.forEach((textarea) => {
                      const text = textarea.value || textarea.textContent || '';
                      const lines = text.split('\n').filter((line) => line.trim());
                      const parent = textarea.parentElement;
                      if (parent) {
                        const textDiv = document.createElement('div');
                        textDiv.className = 'text-sm leading-relaxed text-slate-700';
                        lines.forEach((line) => {
                          const p = document.createElement('p');
                          p.textContent = line;
                          p.style.marginBottom = '0.5rem';
                          textDiv.appendChild(p);
                        });
                        parent.replaceChild(textDiv, textarea);
                      }
                    });

                    // 편집 버튼이 있는 헤더 div 정리
                    const headerDivs = clonedContent.querySelectorAll('div.flex.items-center.justify-between');
                    headerDivs.forEach((div) => {
                      const title = div.querySelector('h2');
                      if (title && div.parentElement) {
                        const newDiv = document.createElement('div');
                        newDiv.className = 'mb-3 border-b-2 border-slate-200 pb-2';
                        newDiv.appendChild(title.cloneNode(true));
                        div.parentElement.replaceChild(newDiv, div);
                      }
                    });

                    // 모든 입력 필드 제거
                    const allInputs = clonedContent.querySelectorAll('input, textarea, select');
                    allInputs.forEach((input) => {
                      input.remove();
                    });

                    // 텍스트 영역의 높이 제한 제거 및 자동 높이 설정
                    const textContainers = clonedContent.querySelectorAll('div.space-y-3, div.space-y-2, p, li');
                    textContainers.forEach((container) => {
                      const el = container as HTMLElement;
                      el.style.height = 'auto';
                      el.style.minHeight = 'auto';
                      el.style.maxHeight = 'none';
                      el.style.overflow = 'visible';
                      el.style.whiteSpace = 'normal';
                      el.style.wordWrap = 'break-word';
                    });

                    // 페이지 나누기 스타일 추가
                    const sections = clonedContent.querySelectorAll('div.mb-6, div.rounded-lg, div.border-2, div.border');
                    sections.forEach((section) => {
                      const el = section as HTMLElement;
                      el.style.pageBreakInside = 'avoid';
                      el.style.breakInside = 'avoid';
                      el.style.overflow = 'visible';
                      el.style.height = 'auto';
                      el.style.minHeight = 'auto';
                    });

                    // 단락이 중간에 잘리지 않도록
                    const paragraphs = clonedContent.querySelectorAll('p, li, div');
                    paragraphs.forEach((p) => {
                      const el = p as HTMLElement;
                      el.style.pageBreakInside = 'avoid';
                      el.style.breakInside = 'avoid';
                      el.style.overflow = 'visible';
                      el.style.height = 'auto';
                    });

                    // 임시 컨테이너에 추가
                    const tempContainer = document.createElement('div');
                    tempContainer.style.position = 'absolute';
                    tempContainer.style.left = '-9999px';
                    tempContainer.style.top = '0';
                    tempContainer.style.width = clonedContent.scrollWidth + 'px';
                    tempContainer.appendChild(clonedContent);
                    document.body.appendChild(tempContainer);

                    // 스타일 적용을 위한 대기
                    await new Promise((resolve) => setTimeout(resolve, 100));

                    const opt = {
                      margin: [10, 10, 10, 10] as [number, number, number, number],
                      filename: `학생분석리포트_${selectedMentee?.name || '학생'}_${new Date().toISOString().slice(0, 10)}.pdf`,
                      image: { type: 'jpeg' as const, quality: 0.98 },
                      html2canvas: { 
                        scale: 2, 
                        useCORS: true, 
                        logging: false,
                        windowWidth: clonedContent.scrollWidth,
                        windowHeight: clonedContent.scrollHeight,
                        allowTaint: true,
                      },
                      jsPDF: { 
                        unit: 'mm' as const, 
                        format: 'a4' as const, 
                        orientation: 'portrait' as const,
                      },
                      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
                    };

                    try {
                      await html2pdf().set(opt).from(clonedContent).save();
                    } catch (error) {
                      console.error('PDF 생성 실패:', error);
                      alert('PDF 다운로드 중 오류가 발생했습니다.');
                    } finally {
                      // 임시 컨테이너 제거
                      if (document.body.contains(tempContainer)) {
                        document.body.removeChild(tempContainer);
                      }
                    }
                  }}
                  className="no-print"
                >
                  <Download className="h-4 w-4" />
                  PDF 다운로드
                </Button>
                <Button
                  onClick={async () => {
                    if (!selectedMentee || !displayAnalysis || !kpi) return;

                    const children: Paragraph[] = [];

                    // 헤더
                    children.push(
                      new Paragraph({
                        text: '학생 학습 분석 리포트',
                        heading: HeadingLevel.TITLE,
                        alignment: AlignmentType.LEFT,
                        spacing: { after: 200 },
                      })
                    );

                    children.push(
                      new Paragraph({
                        children: [
                          new TextRun({ text: `학생명: ${selectedMentee.name}`, bold: true }),
                          new TextRun({ text: ` | 학년: ${selectedMentee.grade} | 과정: ${selectedMentee.track}` }),
                        ],
                        spacing: { after: 100 },
                      })
                    );

                    children.push(
                      new Paragraph({
                        text: `작성일: ${new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}`,
                        spacing: { after: 400 },
                      })
                    );

                    // KPI 요약
                    if (kpi) {
                      children.push(
                        new Paragraph({
                          text: 'KPI 요약',
                          heading: HeadingLevel.HEADING_1,
                          spacing: { before: 200, after: 200 },
                        })
                      );

                      const kpiText = `총 학습 시간: ${kpi.totalStudyHours}시간 | 과제 완료율: ${kpi.assignmentCompletionRate}% | 평균 점수: ${kpi.averageScore}점 | 출석률: ${kpi.attendanceRate}%`;
                      children.push(new Paragraph({ text: kpiText, spacing: { after: 300 } }));
                    }

                    // 생활패턴 분석
                    if (weeklyPatterns.length > 0) {
                      children.push(
                        new Paragraph({
                          text: '생활패턴 분석',
                          heading: HeadingLevel.HEADING_1,
                          spacing: { before: 200, after: 200 },
                        })
                      );

                      const weeklyText = weeklyPatterns.map((p) => `${p.day}: ${p.hours || 0}시간`).join(' | ');
                      children.push(new Paragraph({ text: weeklyText, spacing: { after: 300 } }));
                    }

                    // 과목별 학습 시간
                    if (subjectStudyTimes.length > 0) {
                      children.push(
                        new Paragraph({
                          text: '과목별 학습 시간',
                          heading: HeadingLevel.HEADING_1,
                          spacing: { before: 200, after: 200 },
                        })
                      );

                      subjectStudyTimes
                        .sort((a, b) => b.hours - a.hours)
                        .forEach((item) => {
                          children.push(new Paragraph({ text: `${item.subject}: ${item.hours}시간`, spacing: { after: 100 } }));
                        });
                    }

                    // 전반적인 학습 태도 및 공부 스타일
                    if (displayAnalysis.overallAnalysis && displayAnalysis.overallAnalysis.summary.length > 0) {
                      children.push(
                        new Paragraph({
                          text: '전반적인 학습 태도 및 공부 스타일',
                          heading: HeadingLevel.HEADING_1,
                          spacing: { before: 200, after: 200 },
                        })
                      );

                      displayAnalysis.overallAnalysis.summary.forEach((text: string) => {
                        children.push(new Paragraph({ text, spacing: { after: 150 } }));
                      });
                    }

                    // 과목별 상세 분석
                    if (displayAnalysis.subjectDetailedAnalysis && Object.keys(displayAnalysis.subjectDetailedAnalysis).length > 0) {
                      Object.entries(displayAnalysis.subjectDetailedAnalysis).forEach(([subject, details]) => {
                        const subjectDetails = details as {
                          studyStyle: string[];
                          weakAreas: string[];
                          mistakeTypes: string[];
                          guidanceDirection: string[];
                        };
                        children.push(
                          new Paragraph({
                            text: `${subject} 과목 분석`,
                            heading: HeadingLevel.HEADING_1,
                            spacing: { before: 200, after: 200 },
                          })
                        );

                        if (subjectDetails.studyStyle.length > 0) {
                          children.push(
                            new Paragraph({
                              text: '학습 스타일',
                              heading: HeadingLevel.HEADING_2,
                              spacing: { before: 100, after: 100 },
                            })
                          );
                          subjectDetails.studyStyle.forEach((style: string) => {
                            children.push(new Paragraph({ text: style, spacing: { after: 100 } }));
                          });
                        }

                        if (subjectDetails.weakAreas.length > 0) {
                          children.push(
                            new Paragraph({
                              text: '취약한 부분',
                              heading: HeadingLevel.HEADING_2,
                              spacing: { before: 100, after: 100 },
                            })
                          );
                          subjectDetails.weakAreas.forEach((area: string) => {
                            children.push(new Paragraph({ text: `• ${area}`, spacing: { after: 100 } }));
                          });
                        }

                        if (subjectDetails.mistakeTypes.length > 0) {
                          children.push(
                            new Paragraph({
                              text: '실수 유형',
                              heading: HeadingLevel.HEADING_2,
                              spacing: { before: 100, after: 100 },
                            })
                          );
                          subjectDetails.mistakeTypes.forEach((mistake: string) => {
                            children.push(new Paragraph({ text: mistake, spacing: { after: 100 } }));
                          });
                        }

                        if (subjectDetails.guidanceDirection.length > 0) {
                          children.push(
                            new Paragraph({
                              text: '지도 방향',
                              heading: HeadingLevel.HEADING_2,
                              spacing: { before: 100, after: 100 },
                            })
                          );
                          subjectDetails.guidanceDirection.forEach((direction: string) => {
                            children.push(new Paragraph({ text: direction, spacing: { after: 100 } }));
                          });
                        }
                      });
                    }

                    // 종합 평가 및 상담 마무리 멘트
                    if (displayAnalysis.overallGuidance && displayAnalysis.overallGuidance.length > 0) {
                      children.push(
                        new Paragraph({
                          text: '종합 평가 및 상담 마무리 멘트',
                          heading: HeadingLevel.HEADING_1,
                          spacing: { before: 200, after: 200 },
                        })
                      );

                      displayAnalysis.overallGuidance.forEach((guidance: string) => {
                        children.push(new Paragraph({ text: guidance, spacing: { after: 150 } }));
                      });
                    }

                    const doc = new Document({
                      sections: [
                        {
                          children: children as any,
                        },
                      ],
                    });

                    try {
                      const blob = await Packer.toBlob(doc);
                      saveAs(blob, `학생분석리포트_${selectedMentee.name}_${new Date().toISOString().slice(0, 10)}.docx`);
                    } catch (error) {
                      console.error('Word 문서 생성 실패:', error);
                      alert('Word 다운로드 중 오류가 발생했습니다.');
                    }
                  }}
                  variant="outline"
                  className="no-print"
                >
                  <FileText className="h-4 w-4" />
                  Word 다운로드
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
                {displayAnalysis.overallAnalysis && displayAnalysis.overallAnalysis.summary.length > 0 && (
                  <div className="mb-6" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                    <div className="mb-3 flex items-center justify-between border-b-2 border-slate-200 pb-2">
                      <h2 className="text-base font-bold text-slate-900">
                        전반적인 학습 태도 및 공부 스타일
                      </h2>
                      {editingSection !== 'overall' ? (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingSection('overall');
                            setEditedAnalysis({
                              overallAnalysis: { ...displayAnalysis.overallAnalysis },
                              subjectDetailedAnalysis: displayAnalysis.subjectDetailedAnalysis,
                              overallGuidance: displayAnalysis.overallGuidance,
                            });
                          }}
                          className="flex items-center gap-1 rounded px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
                        >
                          <Edit className="h-3 w-3" />
                          편집
                        </button>
                      ) : (
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              if (editedAnalysis?.overallAnalysis && analysis) {
                                setAnalysis({
                                  ...analysis,
                                  overallAnalysis: editedAnalysis.overallAnalysis,
                                });
                              }
                              setEditingSection(null);
                            }}
                            className="flex items-center gap-1 rounded px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
                          >
                            <Save className="h-3 w-3" />
                            저장
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSection(null);
                              setEditedAnalysis(null);
                            }}
                            className="flex items-center gap-1 rounded px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
                          >
                            <X className="h-3 w-3" />
                            취소
                          </button>
                        </div>
                      )}
                    </div>
                    {editingSection === 'overall' && editedAnalysis?.overallAnalysis ? (
                      <div className="space-y-4">
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-slate-700">요약</label>
                          <textarea
                            value={editedAnalysis.overallAnalysis.summary.join('\n')}
                            onChange={(e) =>
                              setEditedAnalysis({
                                ...editedAnalysis,
                                overallAnalysis: {
                                  ...editedAnalysis.overallAnalysis!,
                                  summary: e.target.value.split('\n').filter((t) => t.trim()),
                                },
                              })
                            }
                            rows={4}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-700">장점 (쉼표로 구분)</label>
                            <textarea
                              value={editedAnalysis.overallAnalysis.strengths.join(', ')}
                              onChange={(e) =>
                                setEditedAnalysis({
                                  ...editedAnalysis,
                                  overallAnalysis: {
                                    ...editedAnalysis.overallAnalysis!,
                                    strengths: e.target.value.split(',').map((s) => s.trim()).filter((s) => s),
                                  },
                                })
                              }
                              rows={2}
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-700">약점 (쉼표로 구분)</label>
                            <textarea
                              value={editedAnalysis.overallAnalysis.weaknesses.join(', ')}
                              onChange={(e) =>
                                setEditedAnalysis({
                                  ...editedAnalysis,
                                  overallAnalysis: {
                                    ...editedAnalysis.overallAnalysis!,
                                    weaknesses: e.target.value.split(',').map((s) => s.trim()).filter((s) => s),
                                  },
                                })
                              }
                              rows={2}
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-slate-700">지도 포인트 (쉼표로 구분)</label>
                          <textarea
                            value={editedAnalysis.overallAnalysis.guidancePoints.join(', ')}
                            onChange={(e) =>
                              setEditedAnalysis({
                                ...editedAnalysis,
                                overallAnalysis: {
                                  ...editedAnalysis.overallAnalysis!,
                                  guidancePoints: e.target.value.split(',').map((s) => s.trim()).filter((s) => s),
                                },
                              })
                            }
                            rows={2}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-3 text-sm leading-relaxed text-slate-700">
                          {displayAnalysis.overallAnalysis.summary.map((text: string, idx: number) => (
                            <p key={idx}>{text}</p>
                          ))}
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-4">
                          {displayAnalysis.overallAnalysis.strengths.length > 0 && (
                            <div className="rounded-lg bg-slate-50 p-3">
                              <p className="mb-2 text-xs font-semibold text-slate-700">장점</p>
                              <div className="flex flex-wrap gap-1.5">
                                {displayAnalysis.overallAnalysis.strengths.map((strength: string, idx: number) => (
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
                          {displayAnalysis.overallAnalysis.weaknesses.length > 0 && (
                            <div className="rounded-lg bg-slate-50 p-3">
                              <p className="mb-2 text-xs font-semibold text-slate-700">약점</p>
                              <div className="flex flex-wrap gap-1.5">
                                {displayAnalysis.overallAnalysis.weaknesses.map((weakness: string, idx: number) => (
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
                        {displayAnalysis.overallAnalysis.guidancePoints.length > 0 && (
                          <div className="mt-4 rounded-lg bg-slate-50 p-3">
                            <p className="mb-1 text-xs font-semibold text-slate-700">지도 포인트</p>
                            <p className="text-sm text-slate-800">
                              {displayAnalysis.overallAnalysis.guidancePoints.join(', ')}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* 과목별 상세 분석 */}
                {displayAnalysis?.subjectDetailedAnalysis &&
                  Object.keys(displayAnalysis.subjectDetailedAnalysis).length > 0 && (
                    <div className="mb-6" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                      <div className="mb-3 flex items-center justify-between border-b-2 border-slate-200 pb-2">
                        <h2 className="text-base font-bold text-slate-900">과목별 상세 분석</h2>
                        {editingSection !== 'subject' ? (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSection('subject');
                              setEditedAnalysis({
                                overallAnalysis: displayAnalysis.overallAnalysis,
                                subjectDetailedAnalysis: { ...displayAnalysis.subjectDetailedAnalysis },
                                overallGuidance: displayAnalysis.overallGuidance,
                              });
                            }}
                            className="flex items-center gap-1 rounded px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
                          >
                            <Edit className="h-3 w-3" />
                            편집
                          </button>
                        ) : (
                          <div className="flex gap-1">
                            <button
                              type="button"
                            onClick={() => {
                              if (editedAnalysis?.subjectDetailedAnalysis && analysis) {
                                setAnalysis({
                                  ...analysis,
                                  subjectDetailedAnalysis: editedAnalysis.subjectDetailedAnalysis,
                                });
                              }
                              setEditingSection(null);
                            }}
                              className="flex items-center gap-1 rounded px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
                            >
                              <Save className="h-3 w-3" />
                              저장
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingSection(null);
                                setEditedAnalysis(null);
                              }}
                              className="flex items-center gap-1 rounded px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
                            >
                              <X className="h-3 w-3" />
                              취소
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {Object.entries(displayAnalysis.subjectDetailedAnalysis).map(([subject, details]) => {
                          const subjectDetails = details as {
                            studyStyle: string[];
                            weakAreas: string[];
                            mistakeTypes: string[];
                            guidanceDirection: string[];
                          };
                          return (
                          <div key={subject} className="rounded-lg border border-slate-200 bg-white p-4" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                            <h3 className="mb-3 text-sm font-bold text-slate-900">
                              {subject} 과목 분석 {subject === '국어' ? '(내신·수능 연계)' : subject === '영어' ? '(내신·수능 공통)' : '(내신·수능 공통)'}
                            </h3>
                            {editingSection === 'subject' && editedAnalysis?.subjectDetailedAnalysis ? (
                              <div className="space-y-3">
                                <div>
                                  <label className="mb-1 block text-xs font-semibold text-slate-600">학습 스타일 (줄바꿈으로 구분)</label>
                                  <textarea
                                    value={editedAnalysis.subjectDetailedAnalysis[subject]?.studyStyle.join('\n') || ''}
                                    onChange={(e) =>
                                      setEditedAnalysis({
                                        ...editedAnalysis,
                                        subjectDetailedAnalysis: {
                                          ...editedAnalysis.subjectDetailedAnalysis!,
                                          [subject]: {
                                            ...editedAnalysis.subjectDetailedAnalysis![subject],
                                            studyStyle: e.target.value.split('\n').filter((t) => t.trim()),
                                          },
                                        },
                                      })
                                    }
                                    rows={2}
                                    className="w-full rounded-lg border border-slate-300 px-2 py-1 text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="mb-1 block text-xs font-semibold text-slate-600">취약한 부분 (줄바꿈으로 구분)</label>
                                  <textarea
                                    value={editedAnalysis.subjectDetailedAnalysis[subject]?.weakAreas.join('\n') || ''}
                                    onChange={(e) =>
                                      setEditedAnalysis({
                                        ...editedAnalysis,
                                        subjectDetailedAnalysis: {
                                          ...editedAnalysis.subjectDetailedAnalysis!,
                                          [subject]: {
                                            ...editedAnalysis.subjectDetailedAnalysis![subject],
                                            weakAreas: e.target.value.split('\n').filter((t) => t.trim()),
                                          },
                                        },
                                      })
                                    }
                                    rows={2}
                                    className="w-full rounded-lg border border-slate-300 px-2 py-1 text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="mb-1 block text-xs font-semibold text-slate-600">실수 유형 (줄바꿈으로 구분)</label>
                                  <textarea
                                    value={editedAnalysis.subjectDetailedAnalysis[subject]?.mistakeTypes.join('\n') || ''}
                                    onChange={(e) =>
                                      setEditedAnalysis({
                                        ...editedAnalysis,
                                        subjectDetailedAnalysis: {
                                          ...editedAnalysis.subjectDetailedAnalysis!,
                                          [subject]: {
                                            ...editedAnalysis.subjectDetailedAnalysis![subject],
                                            mistakeTypes: e.target.value.split('\n').filter((t) => t.trim()),
                                          },
                                        },
                                      })
                                    }
                                    rows={2}
                                    className="w-full rounded-lg border border-slate-300 px-2 py-1 text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="mb-1 block text-xs font-semibold text-slate-600">지도 방향 (줄바꿈으로 구분)</label>
                                  <textarea
                                    value={editedAnalysis.subjectDetailedAnalysis[subject]?.guidanceDirection.join('\n') || ''}
                                    onChange={(e) =>
                                      setEditedAnalysis({
                                        ...editedAnalysis,
                                        subjectDetailedAnalysis: {
                                          ...editedAnalysis.subjectDetailedAnalysis!,
                                          [subject]: {
                                            ...editedAnalysis.subjectDetailedAnalysis![subject],
                                            guidanceDirection: e.target.value.split('\n').filter((t) => t.trim()),
                                          },
                                        },
                                      })
                                    }
                                    rows={2}
                                    className="w-full rounded-lg border border-slate-300 px-2 py-1 text-xs"
                                  />
                                </div>
                              </div>
                            ) : (
                              <>
                                {subjectDetails.studyStyle.length > 0 && (
                                  <div className="mb-3">
                                    <p className="mb-1 text-xs font-semibold text-slate-600">학습 스타일</p>
                                    {subjectDetails.studyStyle.map((style: string, idx: number) => (
                                      <p key={idx} className="text-xs leading-relaxed text-slate-700">
                                        {style}
                                      </p>
                                    ))}
                                  </div>
                                )}
                                {subjectDetails.weakAreas.length > 0 && (
                                  <div className="mb-3">
                                    <p className="mb-1 text-xs font-semibold text-slate-600">취약한 부분</p>
                                    <ul className="space-y-0.5">
                                      {subjectDetails.weakAreas.map((area: string, idx: number) => (
                                        <li key={idx} className="text-xs text-slate-700">• {area}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {subjectDetails.mistakeTypes.length > 0 && (
                                  <div className="mb-3">
                                    <p className="mb-1 text-xs font-semibold text-slate-600">실수 유형</p>
                                    {subjectDetails.mistakeTypes.map((mistake: string, idx: number) => (
                                      <p key={idx} className="text-xs leading-relaxed text-slate-700">
                                        {mistake}
                                      </p>
                                    ))}
                                  </div>
                                )}
                                {subjectDetails.guidanceDirection.length > 0 && (
                                  <div>
                                    <p className="mb-1 text-xs font-semibold text-slate-600">지도 방향</p>
                                    {subjectDetails.guidanceDirection.map((direction: string, idx: number) => (
                                      <p key={idx} className="text-xs leading-relaxed text-slate-700">
                                        {direction}
                                      </p>
                                    ))}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        );
                        })}
                      </div>
                    </div>
                  )}

                {/* 종합 평가 및 상담 마무리 멘트 */}
                {displayAnalysis?.overallGuidance && displayAnalysis.overallGuidance.length > 0 && (
                  <div className="rounded-lg border-2 border-slate-300 bg-slate-50 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h2 className="text-base font-bold text-slate-900">
                        종합 평가 및 상담 마무리 멘트
                      </h2>
                      {editingSection !== 'guidance' ? (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingSection('guidance');
                            setEditedAnalysis({
                              overallAnalysis: displayAnalysis.overallAnalysis,
                              subjectDetailedAnalysis: displayAnalysis.subjectDetailedAnalysis,
                              overallGuidance: [...displayAnalysis.overallGuidance],
                            });
                          }}
                          className="flex items-center gap-1 rounded px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
                        >
                          <Edit className="h-3 w-3" />
                          편집
                        </button>
                      ) : (
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              if (editedAnalysis?.overallGuidance && analysis) {
                                setAnalysis({
                                  ...analysis,
                                  overallGuidance: editedAnalysis.overallGuidance,
                                });
                              }
                              setEditingSection(null);
                            }}
                            className="flex items-center gap-1 rounded px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
                          >
                            <Save className="h-3 w-3" />
                            저장
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSection(null);
                              setEditedAnalysis(null);
                            }}
                            className="flex items-center gap-1 rounded px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
                          >
                            <X className="h-3 w-3" />
                            취소
                          </button>
                        </div>
                      )}
                    </div>
                    {editingSection === 'guidance' && editedAnalysis?.overallGuidance ? (
                      <textarea
                        value={editedAnalysis.overallGuidance.join('\n')}
                        onChange={(e) =>
                          setEditedAnalysis({
                            ...editedAnalysis,
                            overallGuidance: e.target.value.split('\n').filter((t) => t.trim()),
                          })
                        }
                        rows={6}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      />
                    ) : (
                      <div className="space-y-2 text-sm leading-relaxed text-slate-700">
                        {displayAnalysis.overallGuidance.map((guidance: string, idx: number) => (
                          <p key={idx}>{guidance}</p>
                        ))}
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

function PlannerTimeline({ records }: { records: PlannerRecord[] }) {
  const SUBJECT_COLORS: Record<string, string> = {
    수학: 'bg-rose-200',
    영어: 'bg-violet-200',
    국어: 'bg-amber-200',
    문학: 'bg-amber-100',
    사탐: 'bg-emerald-200',
    한국사: 'bg-emerald-100',
    과탐: 'bg-sky-200',
    과학: 'bg-sky-200',
  };
  const hours = Array.from({ length: 15 }, (_, i) => i + 6); // 6시~20시
  const sortedRecords = [...records].sort((a, b) => (a.startHour ?? 0) - (b.startHour ?? 0));

  return (
    <div className="space-y-1">
      {hours.map((hour) => {
        const blocks = sortedRecords.filter((r) => {
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
                  className={`h-6 flex-1 rounded ${SUBJECT_COLORS[r.subject] ?? 'bg-slate-200'}`}
                  title={`${r.subject} ${formatPlannerDuration(r.durationMinutes)}`}
                />
              ))}
              {blocks.length === 0 && (
                <div className="h-6 flex-1 rounded bg-slate-50" />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MaterialUploadModal({
  pendingFiles,
  onClose,
  onConfirm,
}: {
  pendingFiles: { file: File; meta: Partial<MaterialMeta> }[];
  onClose: () => void;
  onConfirm: (items: { file: File; meta: MaterialMeta }[]) => Promise<void>;
}) {
  const [items, setItems] = useState(pendingFiles);
  const [saving, setSaving] = useState(false);

  const updateItem = (index: number, updates: Partial<MaterialMeta>) => {
    setItems((prev) =>
      prev.map((p, i) =>
        i === index ? { ...p, meta: { ...p.meta, ...updates } } : p
      )
    );
  };

  const handleConfirm = async () => {
    setSaving(true);
    try {
      const validItems = items.map((p) => ({
        file: p.file,
        meta: {
          ...p.meta,
          subject: p.meta.subject || '국어',
          subCategory: p.meta.subCategory || '비문학',
          title: p.meta.title || p.file.name,
          fileName: p.meta.fileName || p.file.name,
          fileSize: p.meta.fileSize || `${(p.file.size / 1024 / 1024).toFixed(2)} MB`,
          fileType: (p.meta.fileType || 'other') as MaterialMeta['fileType'],
          uploadedAt: p.meta.uploadedAt || new Date().toISOString().split('T')[0],
        } as MaterialMeta,
      }));
      await onConfirm(validItems);
    } finally {
      setSaving(false);
    }
  };

  const subjects = ['국어', '영어', '수학', '과학', '사회'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="border-b border-slate-200 p-4">
          <h2 className="text-lg font-semibold text-slate-900">학습 자료 업로드</h2>
          <p className="mt-1 text-sm text-slate-500">
            각 파일의 과목과 세부 분류를 선택한 후 업로드하세요.
          </p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.map((item, index) => (
            <div
              key={index}
              className="rounded-lg border border-slate-200 p-4"
            >
              <p className="mb-3 truncate text-sm font-medium text-slate-900">{item.file.name}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">과목</label>
                  <select
                    value={item.meta.subject || '국어'}
                    onChange={(e) => {
                      const subject = e.target.value;
                      updateItem(index, {
                        subject,
                        subCategory: SUBJECT_SUBCATEGORIES[subject]?.[0] ?? '기타',
                      });
                    }}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  >
                    {subjects.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">세부 분류</label>
                  <select
                    value={item.meta.subCategory || '비문학'}
                    onChange={(e) => updateItem(index, { subCategory: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  >
                    {(SUBJECT_SUBCATEGORIES[item.meta.subject || '국어'] ?? ['기타']).map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-200 p-4">
          <Button type="button" variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={saving}
          >
            {saving ? '업로드 중...' : '업로드'}
          </Button>
        </div>
      </div>
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
