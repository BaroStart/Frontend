import type {
  CreateSubCommentRequestDto,
  CreateSubCommentResponseDto,
  GetSubCommentResponseDto,
  UpdateSubCommentRequestDto,
} from '@/generated';

import type { ApiEnvelope } from './auth';
import { commentsApi } from './clients';

// 댓글 조회
export async function fetchSubComments(commentId: number): Promise<GetSubCommentResponseDto[]> {
  const { data } = await commentsApi.getSubComments({ commentId });
  return (data as unknown as ApiEnvelope<GetSubCommentResponseDto[]>).result ?? [];
}

// 댓글 작성
export async function createSubComment(
  body: CreateSubCommentRequestDto,
): Promise<CreateSubCommentResponseDto> {
  const { data } = await commentsApi.createSubComment({ createSubCommentRequestDto: body });
  return (data as unknown as ApiEnvelope<CreateSubCommentResponseDto>).result ?? {};
}

// 댓글 수정
export async function updateSubComment(
  subCommentId: number,
  body: UpdateSubCommentRequestDto,
): Promise<ApiEnvelope<null>> {
  const { data } = await commentsApi.updateSubComment({ subCommentId, updateSubCommentRequestDto: body });
  return data as unknown as ApiEnvelope<null>;
}

// 댓글 삭제
export async function deleteSubComment(subCommentId: number): Promise<ApiEnvelope<null>> {
  const { data } = await commentsApi.deleteSubComment({ subCommentId });
  return data as unknown as ApiEnvelope<null>;
}
