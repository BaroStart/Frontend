import type {
  AssignmentCreateReq,
  AssignmentSubmitReq,
  AssignmentTemplateFileListRes,
  GetAllMaterialsSubjectEnum,
  GetMenteeAssignmentsSubjectEnum,
  GetTemplateFileListSubjectEnum,
} from '@/generated';
import { getSubjectEnum } from '@/lib/subjectLabels';

import { assignmentsApi, assignmentTemplateFilesApi } from './clients';

// 과제 생성 (멘토)
export async function createAssignment(body: AssignmentCreateReq) {
  const { data } = await assignmentsApi.createAssignment({ assignmentCreateReq: body });
  return data;
}

// 멘티 과제 목록 조회
export async function fetchMenteeAssignments(params?: {
  subject?: AssignmentCreateReq['subject'];
  dueDate?: string;
}) {
  const { data } = await assignmentsApi.getMenteeAssignments({
    subject: params?.subject as GetMenteeAssignmentsSubjectEnum,
    dueDate: params?.dueDate,
  });
  return data.result ?? [];
}

// 멘티 과제 상세 조회
export async function fetchMenteeAssignmentDetail(assignmentId: number) {
  const { data } = await assignmentsApi.getMenteeAssignmentDetail({ assignmentId });
  return data.result ?? null;
}

// 과제 제출 (멘티)
export async function submitAssignment(assignmentId: number, body: AssignmentSubmitReq) {
  const { data } = await assignmentsApi.submitAssignment({
    assignmentId,
    assignmentSubmitReq: body,
  });
  return data;
}

// 학습자료 전체 조회 (멘토)
export async function fetchAssignmentMaterials(params?: {
  subject?: AssignmentCreateReq['subject'];
}) {
  const { data } = await assignmentsApi.getAllMaterials({
    subject: params?.subject as GetAllMaterialsSubjectEnum,
  });
  return data.result ?? [];
}

// 과제 템플릿 학습자료 목록 조회 (멘토 전용)
export async function fetchTemplateFileList(
  subject?: string,
): Promise<AssignmentTemplateFileListRes[]> {
  const { data } = await assignmentTemplateFilesApi.getTemplateFileList({
    subject: subject as GetTemplateFileListSubjectEnum,
  });
  return data.result ?? [];
}

// 파일 다운로드 URL 조회
export async function fetchAssignmentFileDownloadUrl(assignmentFileId: number) {
  const { data } = await assignmentsApi.getAssignmentFileDownloadUrl({ assignmentFileId });
  return data.result ?? null;
}

// 과제 등록 헬퍼 (AssignmentRegisterPage 전용)
// 폼 데이터 -> API 요청 변환 후 과제 등록
export async function registerAssignment(payload: {
  menteeId: string;
  dateMode: 'single' | 'recurring';
  singleDate?: string;
  singleEndTime?: string;
  recurringDays?: number[];
  recurringStartDate?: string;
  recurringEndDate?: string;
  recurringEndTime?: string;
  title: string;
  templateName: string;
  subject: string;
  content?: string;
  seolStudyColumn?: string;
  fileUrls?: string[];
}): Promise<{ success: boolean; taskIds: string[] }> {
  const menteeId = Number(payload.menteeId);
  const subject = getSubjectEnum(payload.subject) as AssignmentCreateReq['subject'];

  const toReq = (date: string, time: string): AssignmentCreateReq => ({
    menteeId,
    title: payload.title,
    subject,
    dueDate: `${date}T${time}`,
    templateName: payload.templateName,
    content: payload.content,
    seolStudyColumn: payload.seolStudyColumn,
    fileUrls: payload.fileUrls,
  });

  const ids: string[] = [];

  if (payload.dateMode === 'single' && payload.singleDate) {
    const res = await createAssignment(toReq(payload.singleDate, payload.singleEndTime ?? '23:59'));
    if (res.result?.assignmentId != null) ids.push(String(res.result.assignmentId));
  } else if (
    payload.dateMode === 'recurring' &&
    payload.recurringStartDate &&
    payload.recurringEndDate &&
    payload.recurringDays?.length
  ) {
    const time = payload.recurringEndTime ?? '23:59';
    const start = new Date(payload.recurringStartDate);
    const end = new Date(payload.recurringEndDate);
    const dates: string[] = [];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      if (payload.recurringDays.includes(d.getDay())) {
        dates.push(d.toISOString().split('T')[0]);
      }
    }

    const results = await Promise.all(dates.map((date) => createAssignment(toReq(date, time))));
    for (const res of results) {
      if (res.result?.assignmentId != null) ids.push(String(res.result.assignmentId));
    }
  }

  return { success: true, taskIds: ids };
}
