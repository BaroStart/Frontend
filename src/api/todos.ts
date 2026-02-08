import type {
  CreateToDoReq,
  ToDoRes,
  UpdateToDoReq,
  UpdateToDoStatusReq,
} from '@/generated';

import type { ApiEnvelope } from './auth';
import axiosInstance from './axiosInstance';
import { todosApi } from './clients';

// generated ToDoRes에 id가 없어서 확장 (실제 응답에는 포함됨)
export type ToDoResWithId = ToDoRes & { id?: number };

export async function fetchTodos(): Promise<ApiEnvelope<ToDoResWithId[]>> {
  const { data } = await todosApi.getTodayToDoList();
  return data as unknown as ApiEnvelope<ToDoResWithId[]>;
}

export async function createTodo(body: CreateToDoReq): Promise<ApiEnvelope<null>> {
  const { data } = await todosApi.createToDo({ createToDoReq: body });
  return data as unknown as ApiEnvelope<null>;
}

export async function updateTodo(body: UpdateToDoReq): Promise<ApiEnvelope<null>> {
  const { data } = await todosApi.updateToDo({ updateToDoReq: body });
  return data as unknown as ApiEnvelope<null>;
}

// changeTodoStatus: generated 코드에 {id} path parameter 누락 (백엔드 스펙 이슈) -> 수동 호출 유지
export async function changeTodoStatus(
  id: number,
  body: UpdateToDoStatusReq,
): Promise<ApiEnvelope<null>> {
  const { data } = await axiosInstance.patch<ApiEnvelope<null>>(
    `/api/v1/todos/${id}/status`,
    body,
  );
  return data;
}

export async function deleteTodo(id: number): Promise<ApiEnvelope<null>> {
  const { data } = await todosApi.deleteToDo({ id });
  return data as unknown as ApiEnvelope<null>;
}
