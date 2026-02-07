import type {
  IncompleteAssignment,
  SubmittedAssignment,
} from '@/types';

import { API_CONFIG } from './config';
import axiosInstance from './axiosInstance';
import { generateId, useAssignmentStore } from '@/stores/useAssignmentStore';

/** 과제 등록 폼 데이터 */
export interface RegisterAssignmentPayload {
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
}

export interface RegisterAssignmentResult {
  success: boolean;
  taskIds: string[];
  message?: string;
}

export async function fetchSubmittedAssignments(menteeId?: string): Promise<SubmittedAssignment[]> {
  const url = menteeId
    ? `/mentor/mentees/${menteeId}/assignments/submitted`
    : '/mentor/assignments/submitted';
  const { data } = await axiosInstance.get<SubmittedAssignment[]>(url);
  return data;
}


export async function registerAssignment(
  payload: RegisterAssignmentPayload
): Promise<RegisterAssignmentResult> {
  if (API_CONFIG.useMock) {
    const { addIncomplete } = useAssignmentStore.getState();
    const incomplete: IncompleteAssignment[] = [];

    if (payload.dateMode === 'single' && payload.singleDate) {
      const deadlineTime = payload.singleEndTime ?? '23:59';
      const deadlineStr = formatDeadlineKr(deadlineTime);
      const taskId = generateId('t');
      incomplete.push({
        id: taskId,
        menteeId: payload.menteeId,
        title: payload.title,
        subject: payload.subject,
        description: payload.description || payload.goal,
        content: payload.content,
        deadline: deadlineStr,
        deadlineDate: payload.singleDate,
        status: 'not_started',
      });
    } else if (
      payload.dateMode === 'recurring' &&
      payload.recurringStartDate &&
      payload.recurringEndDate &&
      payload.recurringDays?.length
    ) {
      const deadlineTime = payload.recurringEndTime ?? '23:59';
      const deadlineStr = formatDeadlineKr(deadlineTime);
      const start = new Date(payload.recurringStartDate);
      const end = new Date(payload.recurringEndDate);
      const days = payload.recurringDays;

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dayOfWeek = d.getDay();
        if (!days.includes(dayOfWeek)) continue;

        const dateStr = d.toISOString().split('T')[0];
        const taskId = generateId('t');

        incomplete.push({
          id: taskId,
          menteeId: payload.menteeId,
          title: payload.title,
          subject: payload.subject,
          description: payload.description || payload.goal,
          content: payload.content,
          deadline: deadlineStr,
          deadlineDate: dateStr,
          status: 'not_started',
        });
      }
    }

    addIncomplete(incomplete);

    return {
      success: true,
      taskIds: incomplete.map((a) => a.id),
    };
  }

  const { data } = await axiosInstance.post<RegisterAssignmentResult>(
    `/mentor/mentees/${payload.menteeId}/assignments`,
    payload
  );
  return data;
}

function formatDeadlineKr(time: string): string {
  const [h, m] = time.split(':').map(Number);
  if (h < 12) return `오전 ${h === 0 ? 12 : h}:${String(m).padStart(2, '0')}`;
  return `오후 ${h === 12 ? 12 : h - 12}:${String(m).padStart(2, '0')}`;
}
