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
  updatePost,
  deletePost,
  type Post,
  type CreatePostData,
  type UpdatePostData,
  type PostReactionType,
  type PostComment,
} from "@/services/postService";

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
      let imageUrl = data.image_url;
      
      // Nếu có file, upload trước
      if (data.image_url && data.image_url.startsWith("blob:") || data.image_url instanceof File) {
        const file = data.image_url instanceof File ? data.image_url : await fetch(data.image_url).then(r => r.blob()).then(blob => new File([blob], "image.jpg"));
        imageUrl = await uploadPostImage(file);
      }

      return createPost({
        content: data.content,
        image_url: imageUrl,
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

// Export uploadPostImage for direct use
export { uploadPostImage };
