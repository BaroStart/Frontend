import type { components } from '@/types/api.generated';

import type { ApiEnvelope } from './auth';
import axiosInstance from './axiosInstance';

// ── generated 타입 re-export ──

export type AssignmentCreateReq = components['schemas']['AssignmentCreateReq'];
export type AssignmentCreateRes = components['schemas']['AssignmentCreateRes'];
export type AssignmentSubmitReq = components['schemas']['AssignmentSubmitReq'];
export type AssignmentMenteeListRes = components['schemas']['AssignmentMenteeListRes'];
export type AssignmentFileRes = components['schemas']['AssignmentFileRes'];
export type AssignmentMenteeDetailRes = components['schemas']['AssignmentMenteeDetailRes'];
export type AssignmentMaterialRes = components['schemas']['AssignmentMaterialRes'];

// ── API 함수 ──

/** 과제 생성 (멘토) */
export async function createAssignment(body: AssignmentCreateReq) {
  const { data } = await axiosInstance.post<ApiEnvelope<AssignmentCreateRes>>(
    '/api/v1/assignments',
    body,
  );
  return data;
}

/** 멘티 과제 목록 조회 */
export async function fetchMenteeAssignments(params?: {
  subject?: AssignmentCreateReq['subject'];
  dueDate?: string;
}) {
  const { data } = await axiosInstance.get<ApiEnvelope<AssignmentMenteeListRes[]>>(
    '/api/v1/assignments/mentee',
    { params },
  );
  return data.result ?? [];
}

/** 멘티 과제 상세 조회 */
export async function fetchMenteeAssignmentDetail(assignmentId: number) {
  const { data } = await axiosInstance.get<ApiEnvelope<AssignmentMenteeDetailRes>>(
    `/api/v1/assignments/mentee/${assignmentId}`,
  );
  return data.result ?? null;
}

/** 과제 제출 (멘티) */
export async function submitAssignment(assignmentId: number, body: AssignmentSubmitReq) {
  const { data } = await axiosInstance.post<ApiEnvelope<null>>(
    `/api/v1/assignments/${assignmentId}/submit`,
    body,
  );
  return data;
}

/** 학습자료 전체 조회 (멘토) */
export async function fetchAssignmentMaterials(params?: {
  subject?: AssignmentCreateReq['subject'];
}) {
  const { data } = await axiosInstance.get<ApiEnvelope<AssignmentMaterialRes[]>>(
    '/api/v1/assignments/materials',
    { params },
  );
  return data.result ?? [];
}

/** 파일 다운로드 URL 조회 */
export async function fetchAssignmentFileDownloadUrl(assignmentFileId: number) {
  const { data } = await axiosInstance.get<ApiEnvelope<string>>(
    `/api/v1/assignments/files/${assignmentFileId}/download`,
  );
  return data.result ?? null;
}

// ── 과제 등록 헬퍼 (AssignmentRegisterPage 전용) ──

const SUBJECT_MAP: Record<string, AssignmentCreateReq['subject']> = {
  국어: 'KOREAN',
  영어: 'ENGLISH',
  수학: 'MATH',
};

export type RegisterAssignmentPayload = {
  menteeId: string;
  dateMode: 'single' | 'recurring';
  singleDate?: string;
  singleEndTime?: string;
  recurringDays?: number[];
  recurringStartDate?: string;
  recurringEndDate?: string;
  recurringEndTime?: string;
  title: string;
  goal: string;
  subject: string;
  description?: string;
  content?: string;
  fileUrls?: string[];
};

export type RegisterAssignmentResult = {
  success: boolean;
  taskIds: string[];
  message?: string;
};

/** 폼 데이터 → API 요청 변환 후 과제 등록 */
export async function registerAssignment(
  payload: RegisterAssignmentPayload,
): Promise<RegisterAssignmentResult> {
  const menteeId = Number(payload.menteeId);
  const subject = SUBJECT_MAP[payload.subject] ?? 'COMMON';

  const toReq = (date: string, time: string): AssignmentCreateReq => ({
    menteeId,
    title: payload.title,
    subject,
    dueDate: `${date}T${time}`,
    goal: payload.goal || undefined,
    content: payload.description || undefined,
    seolStudyColumn: payload.content || undefined,
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
