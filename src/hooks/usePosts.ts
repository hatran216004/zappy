import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createPost,
  getPostsByFriends,
  addPostReaction,
  removePostReaction,
  getPostReactions,
  getPostComments,
  addPostComment,
  uploadPostImage,
  uploadPostImages,
  uploadPostVideo,
  updatePost,
  deletePost,
  reportPost,
  getUserPostReports,
  type Post,
  type CreatePostData,
  type UpdatePostData,
  type PostReactionType,
  type PostComment,
  type ReportReason,
} from "@/services/postService";
import toast from "react-hot-toast";

export const postKeys = {
  all: ["posts"] as const,
  list: (userId: string) => [...postKeys.all, "list", userId] as const,
  reactions: (postId: string) => [...postKeys.all, "reactions", postId] as const,
  comments: (postId: string) => [...postKeys.all, "comments", postId] as const,
};

// Hook lấy posts của bạn bè
export const usePostsByFriends = (userId: string) => {
  return useQuery({
    queryKey: postKeys.list(userId),
    queryFn: () => getPostsByFriends(userId),
    enabled: !!userId,
    staleTime: 30000, // 30 seconds
  });
};

// Hook tạo post
export const useCreatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePostData) => {
      console.log('🔄 usePosts hook received data:', data);
      // Support both old (image_url) and new (image_urls, video_url) format
      return createPost({
        content: data.content,
        image_url: data.image_url, // Backward compatibility
        image_urls: data.image_urls,
        video_url: data.video_url,
        mentionedUserIds: data.mentionedUserIds, // Add this line
      });
    },
    onSuccess: (_, variables) => {
      // Invalidate và refetch posts
      queryClient.invalidateQueries({ queryKey: postKeys.all });
    },
  });
};

// Hook thêm reaction
export const useAddPostReaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, reactionType }: { postId: string; reactionType: PostReactionType }) =>
      addPostReaction(postId, reactionType),
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: postKeys.list("") });
      queryClient.invalidateQueries({ queryKey: postKeys.reactions(postId) });
    },
  });
};

// Hook xóa reaction
export const useRemovePostReaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => removePostReaction(postId),
    onSuccess: (_, postId) => {
      queryClient.invalidateQueries({ queryKey: postKeys.list("") });
      queryClient.invalidateQueries({ queryKey: postKeys.reactions(postId) });
    },
  });
};

// Hook lấy reactions của post
export const usePostReactions = (postId: string) => {
  return useQuery({
    queryKey: postKeys.reactions(postId),
    queryFn: () => getPostReactions(postId),
    enabled: !!postId,
  });
};

// Hook lấy comments của post
export const usePostComments = (postId: string) => {
  return useQuery({
    queryKey: postKeys.comments(postId),
    queryFn: () => getPostComments(postId),
    enabled: !!postId,
  });
};

// Hook thêm comment
export const useAddPostComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, content }: { postId: string; content: string }) =>
      addPostComment(postId, content),
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: postKeys.comments(postId) });
      queryClient.invalidateQueries({ queryKey: postKeys.list("") });
    },
  });
};

// Hook cập nhật post
export const useUpdatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, data }: { postId: string; data: UpdatePostData }) =>
      updatePost(postId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.all });
    },
  });
};

// Hook xóa post
export const useDeletePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => deletePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.all });
    },
  });
};

// ============================================
// POST REPORTS
// ============================================

// Hook to report a post
export const useReportPost = () => {
  return useMutation({
    mutationFn: ({
      postId,
      reportedBy,
      reason,
      description
    }: {
      postId: string;
      reportedBy: string;
      reason: ReportReason;
      description?: string;
    }) => reportPost(postId, reportedBy, reason, description),
    onSuccess: () => {
      toast.success('Đã gửi báo cáo thành công. Cảm ơn bạn đã giúp cải thiện cộng đồng!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Không thể gửi báo cáo');
    }
  });
};

// Hook to get user's post reports
export const useUserPostReports = (userId: string) => {
  return useQuery({
    queryKey: ['postReports', userId],
    queryFn: () => getUserPostReports(userId),
    enabled: !!userId
  });
};

// Export upload functions for direct use
export { uploadPostImage, uploadPostImages, uploadPostVideo };
