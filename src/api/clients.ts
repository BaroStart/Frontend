import {
  AssignmentAPIApi,
  AssignmentTemplateAPIApi,
  AuthAPIApi,
  CommentAPIApi,
  Configuration,
  ExampleAPIApi,
  MenteeAPIApi,
  ObjectStorageAPIApi,
  ToDoAPIApi,
} from '@/generated';

import axiosInstance from './axiosInstance';

const config = new Configuration();

export const assignmentsApi = new AssignmentAPIApi(config, '', axiosInstance);
export const authApi = new AuthAPIApi(config, '', axiosInstance);
export const commentsApi = new CommentAPIApi(config, '', axiosInstance);
export const examplesApi = new ExampleAPIApi(config, '', axiosInstance);
export const menteeApi = new MenteeAPIApi(config, '', axiosInstance);
export const storagesApi = new ObjectStorageAPIApi(config, '', axiosInstance);
export const todosApi = new ToDoAPIApi(config, '', axiosInstance);
export const assignmentTemplatesApi = new AssignmentTemplateAPIApi(config, '', axiosInstance);
