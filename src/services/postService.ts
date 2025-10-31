import { supabase } from "@/lib/supabase";
import { Database } from "@/types/supabase.type";

export type PostReactionType = "like" | "love" | "haha" | "wow" | "sad" | "angry";

export interface Post {
  id: string;
  author_id: string;
  content: string;
  image_url?: string | null;
  created_at: string;
  updated_at?: string | null;
  author?: {
    id: string;
    display_name: string;
    avatar_url?: string | null;
    username?: string | null;
  };
  reactions?: PostReaction[];
  comments_count?: number;
  reactions_count?: number;
}

export interface PostReaction {
  id: string;
  post_id: string;
  user_id: string;
  reaction_type: PostReactionType;
  created_at: string;
  user?: {
    id: string;
    display_name: string;
    avatar_url?: string | null;
  };
}

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at?: string | null;
  user?: {
    id: string;
    display_name: string;
    avatar_url?: string | null;
    username?: string | null;
  };
}

export interface CreatePostData {
  content: string;
  image_url?: string;
}

// Tạo post mới
export const createPost = async (data: CreatePostData): Promise<Post> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Không tìm thấy người dùng");

  const { data: post, error } = await supabase
    .from("posts")
    .insert({
      author_id: user.id,
      content: data.content,
      image_url: data.image_url || null,
    })
    .select(
      `
      *,
      author:profiles!posts_author_id_fkey(id, display_name, avatar_url, username)
    `
    )
    .single();

  if (error) throw error;
  return post as Post;
};

// Lấy posts của bạn bè
export const getPostsByFriends = async (userId: string): Promise<Post[]> => {
  // Lấy danh sách bạn bè
  const { data: friends, error: friendsError } = await supabase
    .from("friends")
    .select("friend_id")
    .eq("user_id", userId);

  if (friendsError) throw friendsError;

  const friendIds = friends?.map((f) => f.friend_id) || [];
  if (friendIds.length === 0) return [];

  // Lấy posts của bạn bè + posts của chính user
  const allUserIds = [userId, ...friendIds];

  const { data: posts, error: postsError } = await supabase
    .from("posts")
    .select(
      `
      *,
      author:profiles!posts_author_id_fkey(id, display_name, avatar_url, username)
    `
    )
    .in("author_id", allUserIds)
    .order("created_at", { ascending: false })
    .limit(50);

  if (postsError) throw postsError;

  // Lấy reactions và comments count cho mỗi post
  const postIds = posts?.map((p) => p.id) || [];
  if (postIds.length === 0) return [];

  const [reactionsRes, commentsRes] = await Promise.all([
    supabase
      .from("post_reactions")
      .select("post_id, reaction_type")
      .in("post_id", postIds),
    supabase
      .from("post_comments")
      .select("post_id")
      .in("post_id", postIds),
  ]);

  const reactionsByPost = new Map<string, PostReaction[]>();
  reactionsRes.data?.forEach((r) => {
    if (!reactionsByPost.has(r.post_id)) {
      reactionsByPost.set(r.post_id, []);
    }
    reactionsByPost.get(r.post_id)!.push(r as PostReaction);
  });

  const commentsCountByPost = new Map<string, number>();
  commentsRes.data?.forEach((c) => {
    commentsCountByPost.set(
      c.post_id,
      (commentsCountByPost.get(c.post_id) || 0) + 1
    );
  });

  // Gắn reactions và comments count vào posts
  const postsWithDetails = posts?.map((post) => ({
    ...post,
    reactions: reactionsByPost.get(post.id) || [],
    reactions_count: reactionsByPost.get(post.id)?.length || 0,
    comments_count: commentsCountByPost.get(post.id) || 0,
  }));

  return (postsWithDetails as Post[]) || [];
};

// Thêm reaction vào post
export const addPostReaction = async (
  postId: string,
  reactionType: PostReactionType
): Promise<void> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Không tìm thấy người dùng");

  // Kiểm tra xem user đã reaction chưa
  const { data: existing } = await supabase
    .from("post_reactions")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .single();

  if (existing) {
    // Update reaction type
    const { error } = await supabase
      .from("post_reactions")
      .update({ reaction_type: reactionType })
      .eq("id", existing.id);

    if (error) throw error;
  } else {
    // Insert new reaction
    const { error } = await supabase.from("post_reactions").insert({
      post_id: postId,
      user_id: user.id,
      reaction_type: reactionType,
    });

    if (error) throw error;
  }
};

// Xóa reaction khỏi post
export const removePostReaction = async (postId: string): Promise<void> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Không tìm thấy người dùng");

  const { error } = await supabase
    .from("post_reactions")
    .delete()
    .eq("post_id", postId)
    .eq("user_id", user.id);

  if (error) throw error;
};

// Lấy reactions của post với user info
export const getPostReactions = async (
  postId: string
): Promise<PostReaction[]> => {
  const { data, error } = await supabase
    .from("post_reactions")
    .select(
      `
      *,
      user:profiles!post_reactions_user_id_fkey(id, display_name, avatar_url)
    `
    )
    .eq("post_id", postId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as PostReaction[]) || [];
};

// Lấy comments của post
export const getPostComments = async (
  postId: string
): Promise<PostComment[]> => {
  const { data, error } = await supabase
    .from("post_comments")
    .select(
      `
      *,
      user:profiles!post_comments_user_id_fkey(id, display_name, avatar_url, username)
    `
    )
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data as PostComment[]) || [];
};

// Thêm comment vào post
export const addPostComment = async (
  postId: string,
  content: string
): Promise<PostComment> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Không tìm thấy người dùng");

  const { data, error } = await supabase
    .from("post_comments")
    .insert({
      post_id: postId,
      user_id: user.id,
      content,
    })
    .select(
      `
      *,
      user:profiles!post_comments_user_id_fkey(id, display_name, avatar_url, username)
    `
    )
    .single();

  if (error) throw error;
  return data as PostComment;
};

// Upload image cho post
export const uploadPostImage = async (file: File): Promise<string> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Không tìm thấy người dùng");

  const fileExt = file.name.split(".").pop();
  const fileName = `${user.id}-${Date.now()}.${fileExt}`;
  const filePath = `posts/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("post-images")
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const {
    data: { publicUrl },
  } = supabase.storage.from("post-images").getPublicUrl(filePath);

  return publicUrl;
};

// Cập nhật post
export interface UpdatePostData {
  content?: string;
  image_url?: string | null;
}

export const updatePost = async (
  postId: string,
  data: UpdatePostData
): Promise<Post> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Không tìm thấy người dùng");

  const { data: post, error } = await supabase
    .from("posts")
    .update({
      content: data.content,
      image_url: data.image_url ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", postId)
    .eq("author_id", user.id) // Chỉ cho phép update post của chính mình
    .select(
      `
      *,
      author:profiles!posts_author_id_fkey(id, display_name, avatar_url, username)
    `
    )
    .single();

  if (error) throw error;
  return post as Post;
};

// Xóa post
export const deletePost = async (postId: string): Promise<void> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Không tìm thấy người dùng");

  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId)
    .eq("author_id", user.id); // Chỉ cho phép xóa post của chính mình

  if (error) throw error;
};
