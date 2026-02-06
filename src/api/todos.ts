import axiosInstance from './axiosInstance';
import type { ApiEnvelope } from './auth';

export type TodoStatus = 'COMPLETED' | 'NOT_COMPLETED';

export type TimeSlot = {
  startTime: string; // date-time
  endTime: string; // date-time
};

export type TodoRes = {
  /** swagger schema엔 없지만, 실제로는 내려올 가능성이 높아서 optional로 둠 */
  id?: number;
  title: string;
  status: TodoStatus;
  timeList?: TimeSlot[];
};

export type CreateTodoReq = {
  title: string;
};

export type UpdateTodoReq = {
  id: number;
  title: string;
  timeList?: TimeSlot[];
};

export type UpdateTodoStatusReq = {
  id: number;
  status: TodoStatus;
  timeList?: TimeSlot[];
};

export async function fetchTodos(): Promise<ApiEnvelope<TodoRes[]>> {
  const { data } = await axiosInstance.get<ApiEnvelope<TodoRes[]>>('/api/v1/todos');
  return data;
}

export async function createTodo(body: CreateTodoReq): Promise<ApiEnvelope<null>> {
  const { data } = await axiosInstance.post<ApiEnvelope<null>>('/api/v1/todos', body);
  return data;
}

export async function updateTodo(body: UpdateTodoReq): Promise<ApiEnvelope<null>> {
  const { data } = await axiosInstance.put<ApiEnvelope<null>>('/api/v1/todos', body);
  return data;
}

export async function changeTodoStatus(id: number, body: UpdateTodoStatusReq): Promise<ApiEnvelope<null>> {
  const { data } = await axiosInstance.patch<ApiEnvelope<null>>(`/api/v1/todos/${id}/status`, body);
  return data;
}

export async function deleteTodo(id: number): Promise<ApiEnvelope<null>> {
  const { data } = await axiosInstance.delete<ApiEnvelope<null>>(`/api/v1/todos/${id}`);
  return data;
}

