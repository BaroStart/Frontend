import type {
  CreateCommentRequestDto,
  CreateCommentResponseDto,
  GetCommentResponseDto,
  UpdateCommentRequestDto,
} from '@/generated';

import type { ApiEnvelope } from './auth';
import { commentsApi } from './clients';

// 코멘트 조회
export async function fetchComments(mentorId: number): Promise<GetCommentResponseDto[]> {
  const { data } = await commentsApi.getComment({ mentorId });
  return (data as unknown as ApiEnvelope<GetCommentResponseDto[]>).result ?? [];
}

// 코멘트 생성
export async function createComment(
  body: CreateCommentRequestDto,
): Promise<CreateCommentResponseDto> {
  const { data } = await commentsApi.createComment({ createCommentRequestDto: body });
  return (data as unknown as ApiEnvelope<CreateCommentResponseDto>).result ?? {};
}

// 코멘트 수정
export async function updateComment(
  commentId: number,
  body: UpdateCommentRequestDto,
): Promise<ApiEnvelope<null>> {
  const { data } = await commentsApi.updateComment({ commentId, updateCommentRequestDto: body });
  return data as unknown as ApiEnvelope<null>;
}

// 코멘트 삭제
export async function deleteComment(commentId: number): Promise<ApiEnvelope<null>> {
  const { data } = await commentsApi.deleteComment({ commentId });
  return data as unknown as ApiEnvelope<null>;
}
