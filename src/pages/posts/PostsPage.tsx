import { useMemo, useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  ThumbsUp,
  MessageSquare,
  MoreHorizontal,
  Home,
  Users,
  Bookmark,
  Clock,
  TrendingUp,
  Settings,
  Link as LinkIcon,
  Calendar,
  Video as VideoIcon,
  Sparkles,
  Image as ImageIcon,
  X,
  Edit,
  Trash2,
  Video,
} from "lucide-react";
import { useAuth } from "@/stores/user";
import { useProfile } from "@/hooks/useProfile";
import { useFriends } from "@/hooks/useFriends";
import { useConversations } from "@/hooks/useChat";
import { useUserStatus } from "@/hooks/usePresence";
import { useConfirm } from "@/components/modal/ModalConfirm";
import toast from "react-hot-toast";
import {
  usePostsByFriends,
  useCreatePost,
  useAddPostReaction,
  useRemovePostReaction,
  usePostReactions,
  usePostComments,
  useAddPostComment,
  useUpdatePost,
  useDeletePost,
  uploadPostImage,
} from "@/hooks/usePosts";
import { uploadPostImages, uploadPostVideo } from "@/services/postService";
import type { Post, PostReactionType } from "@/services/postService";
import { supabaseUrl } from "@/lib/supabase";

const REACTION_EMOJIS: Record<PostReactionType, string> = {
  like: "👍",
  love: "❤️",
  haha: "😂",
  wow: "😮",
  sad: "😢",
  angry: "😠",
};

const REACTION_COLORS: Record<PostReactionType, string> = {
  like: "bg-blue-500",
  love: "bg-red-500",
  haha: "bg-yellow-500",
  wow: "bg-purple-500",
  sad: "bg-blue-400",
  angry: "bg-red-600",
};


function Toolbar({
  onSearch,
}: {
  onSearch: (q: string) => void;
}) {
  const [q, setQ] = useState("");
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2 flex-1">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Tìm kiếm bài viết..."
            className="pl-10 bg-white dark:bg-[#242526] border-gray-300 dark:border-gray-600"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSearch(q.trim());
            }}
          />
        </div>
      </div>

    </div>
  );
}


function EditPostDialog({
  post,
  open,
  onOpenChange,
  onSave,
}: {
  post: Post;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (content: string, imageUrl?: string | null) => Promise<void>;
}) {
  const [content, setContent] = useState(post.content || "");
  const [imagePreview, setImagePreview] = useState<string | null>(post.image_url || null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const updatePostMutation = useUpdatePost();

  useEffect(() => {
    if (open) {
      setContent(post.content || "");
      setImagePreview(post.image_url || null);
      setImageFile(null);
    }
  }, [open, post]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() && !imagePreview) return;

    try {
      let imageUrl = post.image_url;
      if (imageFile) {
        try {
          imageUrl = await uploadPostImage(imageFile);
        } catch (error) {
          console.error("Error uploading image:", error);
          alert("Không thể upload ảnh. Vui lòng thử lại.");
          return;
        }
      }
      await onSave(content.trim(), imageUrl);
    } catch (error) {
      console.error("Error updating post:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa bài viết</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            placeholder="Bạn đang nghĩ gì?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[150px] resize-none bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
          />
          {imagePreview && (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full rounded-lg max-h-96 object-cover"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 bg-black/50 hover:bg-black/70 text-white"
                onClick={() => {
                  setImagePreview(null);
                  setImageFile(null);
                }}
              >
                <X className="h-4 w-4" />
        </Button>
      </div>
          )}
          <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
              <Button
                variant="ghost"
                size="sm"
                type="button"
                className="text-gray-600 dark:text-gray-400"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon className="h-5 w-5 mr-2" />
                {imagePreview ? "Thay đổi ảnh" : "Thêm ảnh"}
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={updatePostMutation.isPending}
              >
                Hủy
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={(!content.trim() && !imagePreview) || updatePostMutation.isPending}
                size="sm"
              >
                {updatePostMutation.isPending ? "Đang lưu..." : "Lưu"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// --- Create Post Component --------------------------------------------------
function CreatePostCard({ userId, onPostCreated }: { userId: string; onPostCreated?: () => void }) {
  const { data: profile } = useProfile(userId);
  const createPostMutation = useCreatePost();
  const [content, setContent] = useState("");
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
  const MAX_VIDEO_SIZE = 20 * 1024 * 1024; // 20MB

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validate file size
    const invalidFiles = files.filter(file => file.size > MAX_IMAGE_SIZE);
    if (invalidFiles.length > 0) {
      toast.error(`Một số ảnh vượt quá 2MB. Vui lòng chọn ảnh nhỏ hơn.`);
      return;
    }

    // Validate file type
    const invalidTypes = files.filter(file => !file.type.startsWith("image/"));
    if (invalidTypes.length > 0) {
      toast.error("Chỉ được chọn file ảnh");
      return;
    }

    // Nếu đã có video, không cho chọn ảnh
    if (videoFile) {
      toast.error("Chỉ được chọn ảnh hoặc video, không thể chọn cả hai");
      return;
    }

    const newFiles = [...imageFiles, ...files];
    setImageFiles(newFiles);

    // Create previews
    const newPreviews: string[] = [];
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result as string);
        if (newPreviews.length === files.length) {
          setImagePreviews([...imagePreviews, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > MAX_VIDEO_SIZE) {
      toast.error("Kích thước video không được vượt quá 20MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("video/")) {
      toast.error("Chỉ được chọn file video");
      return;
    }

    // Nếu đã có ảnh, không cho chọn video
    if (imageFiles.length > 0) {
      toast.error("Chỉ được chọn ảnh hoặc video, không thể chọn cả hai");
      return;
    }

    setVideoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setVideoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (index: number) => {
    const newFiles = imageFiles.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
  };

  const removeVideo = () => {
    setVideoFile(null);
    setVideoPreview(null);
  };

  const handleSubmit = async () => {
    if (!content.trim() && imageFiles.length === 0 && !videoFile) return;

    try {
      let imageUrls: string[] | undefined = undefined;
      let videoUrl: string | undefined = undefined;

      if (imageFiles.length > 0) {
        try {
          imageUrls = await uploadPostImages(imageFiles);
        } catch (error: any) {
          console.error("Error uploading images:", error);
          toast.error(error?.message || "Lỗi khi upload ảnh");
          return;
        }
      }

      if (videoFile) {
        try {
          videoUrl = await uploadPostVideo(videoFile);
        } catch (error: any) {
          console.error("Error uploading video:", error);
          toast.error(error?.message || "Lỗi khi upload video");
          return;
        }
      }
      
      await createPostMutation.mutateAsync({
        content: content.trim(),
        image_urls: imageUrls,
        video_url: videoUrl,
      });
      setContent("");
      setImagePreviews([]);
      setImageFiles([]);
      setVideoPreview(null);
      setVideoFile(null);
      onPostCreated?.();
    } catch (error) {
      console.error("Error creating post:", error);
    }
  };

  return (
    <div className="bg-white dark:bg-[#242526] rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-4">
      <div className="flex gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={profile?.avatar_url} />
          <AvatarFallback className="bg-blue-500 text-white">
            {profile?.display_name?.[0] || "U"}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <Textarea
            placeholder="Bạn đang nghĩ gì?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[100px] resize-none bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
          />
          
          {/* Multiple Images Preview */}
          {imagePreviews.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full rounded-lg h-48 object-cover"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 bg-black/50 hover:bg-black/70 text-white"
                    onClick={() => removeImage(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Video Preview */}
          {videoPreview && (
            <div className="mt-3 relative">
              <video
                src={videoPreview}
                controls
                className="w-full rounded-lg max-h-96"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 bg-black/50 hover:bg-black/70 text-white"
                onClick={removeVideo}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageSelect}
              />
              <Button
                variant="ghost"
                size="sm"
                type="button"
                className="text-gray-600 dark:text-gray-400"
                onClick={() => imageInputRef.current?.click()}
                disabled={!!videoFile}
              >
                <ImageIcon className="h-5 w-5 mr-2" />
                Ảnh
              </Button>
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleVideoSelect}
              />
              <Button
                variant="ghost"
                size="sm"
                type="button"
                className="text-gray-600 dark:text-gray-400"
                onClick={() => videoInputRef.current?.click()}
                disabled={imageFiles.length > 0}
              >
                <Video className="h-5 w-5 mr-2" />
                Video
              </Button>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={(!content.trim() && imageFiles.length === 0 && !videoFile) || createPostMutation.isPending}
              size="sm"
            >
              {createPostMutation.isPending ? "Đang đăng..." : "Đăng"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Comment Modal ---------------------------------------------------------
function CommentModal({
  post,
  open,
  onOpenChange,
}: {
  post: Post;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { user } = useAuth();
  const { data: comments } = usePostComments(post.id);
  const addCommentMutation = useAddPostComment();
  const [commentText, setCommentText] = useState("");

  const handleAddComment = async () => {
    if (!commentText.trim()) return;

    try {
      await addCommentMutation.mutateAsync({
        postId: post.id,
        content: commentText.trim(),
      });
      setCommentText("");
    } catch (error: any) {
      console.error("Error adding comment:", error);
      // Hiển thị toast thông báo lỗi
      const errorMessage = error?.message || "Không thể thêm bình luận. Vui lòng thử lại.";
      toast.error(errorMessage);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0 border-b border-gray-200 dark:border-gray-700">
          <DialogTitle>Bình luận</DialogTitle>
        </DialogHeader>
        
        {/* Scrollable content area */}
        <div 
          className="flex-1 overflow-y-auto"
          style={{ minHeight: 0 }}
        >
          <div className="px-6 py-4 space-y-4">
            {/* Post content - có thể scroll qua */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="flex gap-3">
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarImage src={post.author?.avatar_url || undefined} />
                  <AvatarFallback>
                    {post.author?.display_name?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm">{post.author?.display_name || "Người dùng"}</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                    {post.content || ""}
                  </p>
                  {post.image_urls && post.image_urls.length > 0 && (
                    <div className="mt-2 grid grid-cols-2 gap-1">
                      {post.image_urls.slice(0, 4).map((url, index) => (
                        <img
                          key={index}
                          src={url}
                          alt={`Post ${index + 1}`}
                          className="rounded-lg h-32 object-cover w-full"
                        />
                      ))}
                    </div>
                  )}
                  {(!post.image_urls || post.image_urls.length === 0) && post.image_url && (
                    <img
                      src={post.image_url}
                      alt="Post"
                      className="mt-2 rounded-lg max-h-64 object-cover w-full"
                    />
                  )}
                  {post.video_url && (
                    <video
                      src={post.video_url}
                      controls
                      className="mt-2 rounded-lg max-h-64 w-full"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Comments list */}
            {comments?.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={comment.user?.avatar_url || undefined} />
                  <AvatarFallback>
                    {comment.user?.display_name?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                    <h5 className="font-semibold text-sm mb-1 break-words">
                      {comment.user?.display_name}
                    </h5>
                    <p className="text-sm text-gray-900 dark:text-gray-100 break-words whitespace-pre-wrap">
                      {comment.content}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {timeAgo(comment.created_at)}
                      {comment.updated_at && comment.updated_at !== comment.created_at && (
                        <>
                          <span className="mx-1">•</span>
                          <span className="italic">Đã chỉnh sửa</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add comment - không scroll, luôn ở dưới */}
        <div className="px-6 pb-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex gap-2">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarImage src={user?.user_metadata?.avatar_url ? String(user.user_metadata.avatar_url) : undefined} />
              <AvatarFallback>{user?.email?.[0] || "U"}</AvatarFallback>
            </Avatar>
            <div className="flex-1 flex gap-2 min-w-0">
              <Input
                placeholder="Viết bình luận..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleAddComment();
                  }
                }}
                className="bg-gray-100 dark:bg-gray-700 flex-1 min-w-0"
              />
              <Button
                onClick={handleAddComment}
                disabled={!commentText.trim() || addCommentMutation.isPending}
                size="sm"
                className="flex-shrink-0"
              >
                Gửi
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// --- Post Card -------------------------------------------------------------
function PostCard({ post, currentUserId }: { post: Post; currentUserId: string }) {
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { data: reactions } = usePostReactions(post.id);
  const addReactionMutation = useAddPostReaction();
  const removeReactionMutation = useRemovePostReaction();
  const updatePostMutation = useUpdatePost();
  const deletePostMutation = useDeletePost();
  const confirm = useConfirm();
  
  const isOwner = post.author_id === currentUserId;
  
  const userReaction = reactions?.find((r: any) => r.user_id === currentUserId);
  const reactionsCount = reactions?.length || 0;
  
  // Group reactions by type
  const reactionsByType = reactions?.reduce((acc: Partial<Record<PostReactionType, any[]>>, r: any) => {
    const type = r.reaction_type as PostReactionType;
    if (!acc[type]) acc[type] = [];
    acc[type]!.push(r);
    return acc;
  }, {} as Partial<Record<PostReactionType, any[]>>) || {};

  const handleReactionClick = async () => {
    if (userReaction) {
      await removeReactionMutation.mutateAsync(post.id);
    } else {
      await addReactionMutation.mutateAsync({
        postId: post.id,
        reactionType: "like",
      });
    }
  };

  const reactionEmojis: PostReactionType[] = ["like", "love", "haha", "wow", "sad", "angry"];
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const hideReactionPickerTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear timeout when component unmounts
  useEffect(() => {
    return () => {
      if (hideReactionPickerTimeoutRef.current) {
        clearTimeout(hideReactionPickerTimeoutRef.current);
      }
    };
  }, []);

  const handleShowReactionPicker = () => {
    // Clear any pending hide timeout
    if (hideReactionPickerTimeoutRef.current) {
      clearTimeout(hideReactionPickerTimeoutRef.current);
      hideReactionPickerTimeoutRef.current = null;
    }
    setShowReactionPicker(true);
  };

  const handleHideReactionPicker = () => {
    // Delay hiding to allow mouse to move to picker
    hideReactionPickerTimeoutRef.current = setTimeout(() => {
      setShowReactionPicker(false);
    }, 200); // 200ms delay
  };

  const handleDeletePost = async () => {
    try {
      await deletePostMutation.mutateAsync(post.id);
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Không thể xóa bài viết. Vui lòng thử lại.");
    }
  };

  const handleUpdatePost = async (content: string, imageUrl?: string | null) => {
    try {
      await updatePostMutation.mutateAsync({
        postId: post.id,
        data: {
          content,
          image_url: imageUrl,
        },
      });
      setShowEditDialog(false);
    } catch (error) {
      console.error("Error updating post:", error);
      alert("Không thể cập nhật bài viết. Vui lòng thử lại.");
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-[#242526] rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="p-3 pb-0">
          <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={post.author?.avatar_url || undefined} />
            <AvatarFallback className="bg-blue-500 text-white text-sm font-semibold">
              {post.author?.display_name?.[0] || "?"}
          </AvatarFallback>
        </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900 dark:text-white text-[15px] hover:underline cursor-pointer">
                  {post.author?.display_name || "Người dùng"}
                </h3>
        </div>
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <span>{timeAgo(post.created_at)}</span>
                {post.updated_at && post.updated_at !== post.created_at && (
                  <>
                    <span>•</span>
                    <span className="italic">Đã chỉnh sửa</span>
                  </>
                )}
              </div>
        </div>
            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="h-9 w-9 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 flex items-center justify-center transition-colors"
                  >
            <MoreHorizontal className="h-5 w-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      setShowEditDialog(true);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Chỉnh sửa
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={async (e) => {
                      e.preventDefault();
                      const confirmed = await confirm({
                        title: "Xóa bài viết",
                        description: "Bạn có chắc muốn xóa bài viết này? Hành động này không thể hoàn tác.",
                        confirmText: "Xóa",
                        cancelText: "Hủy",
                        destructive: true,
                      });
                      if (confirmed) {
                        handleDeletePost();
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Xóa
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
        </div>
        </div>

        {/* Content */}
        <div className="px-4 pb-3">
          <p className="text-[15px] text-gray-900 dark:text-white leading-relaxed whitespace-pre-wrap">
            {post.content}
          </p>
        </div>

        {/* Multiple Images */}
        {post.image_urls && post.image_urls.length > 0 && (
          <div className="w-full">
            {post.image_urls.length === 1 ? (
              <img
                src={post.image_urls[0]}
                alt="Post"
                className="w-full h-auto object-cover"
                loading="lazy"
              />
            ) : (
              <div className={`grid gap-1 ${
                post.image_urls.length === 2 ? 'grid-cols-2' :
                post.image_urls.length === 3 ? 'grid-cols-2' :
                post.image_urls.length === 4 ? 'grid-cols-2' :
                'grid-cols-3'
              }`}>
                {post.image_urls.slice(0, 4).map((url, index) => (
                  <div key={index} className="relative">
                    <img
                      src={url}
                      alt={`Post ${index + 1}`}
                      className={`w-full h-64 object-cover ${
                        post.image_urls.length === 3 && index === 0 ? 'row-span-2' : ''
                      }`}
                      loading="lazy"
                    />
                    {post.image_urls.length > 4 && index === 3 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white text-2xl font-bold">
                          +{post.image_urls.length - 4}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Fallback to old image_url for backward compatibility */}
        {(!post.image_urls || post.image_urls.length === 0) && post.image_url && (
          <div className="w-full">
            <img
              src={post.image_url}
              alt="Post"
              className="w-full h-auto object-cover"
              loading="lazy"
            />
          </div>
        )}

        {/* Video */}
        {post.video_url && (
          <div className="w-full">
            <video
              src={post.video_url}
              controls
              className="w-full h-auto max-h-96"
            />
          </div>
        )}

        {/* Reactions and Comments Count */}
        {(reactionsCount > 0 || (post.comments_count ?? 0) > 0) && (
          <div className="px-4 py-2 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              {reactionsCount > 0 && (
                <div className="flex items-center gap-1">
                  <div className="flex -space-x-1">
                    {Object.keys(reactionsByType).slice(0, 3).map((type) => {
                      const reactionType = type as PostReactionType;
                      if (!reactionsByType[reactionType]) return null;
                      const color = REACTION_COLORS[reactionType] || "bg-gray-500";
                      const emoji = REACTION_EMOJIS[reactionType] || "👍";
                      return (
                        <div
                          key={type}
                          className={`w-5 h-5 rounded-full ${color} flex items-center justify-center border-2 border-white dark:border-[#242526] text-xs`}
                        >
                          {emoji}
                        </div>
                      );
                    }).filter(Boolean)}
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {reactionsCount}
                  </span>
                </div>
              )}
            </div>
            {(post.comments_count ?? 0) > 0 && (
              <button
                onClick={() => setShowCommentModal(true)}
                className="text-sm text-gray-600 dark:text-gray-400 hover:underline cursor-pointer"
              >
                {post.comments_count} bình luận
              </button>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="px-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="flex-1 relative">
              <Button
                variant="ghost"
                onClick={handleReactionClick}
                onMouseEnter={handleShowReactionPicker}
                onMouseLeave={handleHideReactionPicker}
                className={`w-full h-9 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 font-medium text-sm ${
                  userReaction ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-400"
                }`}
              >
                {userReaction ? (
                  <>
                    <span className="mr-2">{REACTION_EMOJIS[userReaction.reaction_type]}</span>
                    {userReaction.reaction_type === "like" ? "Thích" : 
                     userReaction.reaction_type === "love" ? "Yêu thích" :
                     userReaction.reaction_type === "haha" ? "Haha" :
                     userReaction.reaction_type === "wow" ? "Wow" :
                     userReaction.reaction_type === "sad" ? "Buồn" : "Tức giận"}
                  </>
                ) : (
                  <>
                    <ThumbsUp className="h-5 w-5 mr-2" />
                    Thích
                  </>
                )}
          </Button>
              {showReactionPicker && (
                <div
                  className="absolute bottom-full mb-2 left-0 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 p-1 flex gap-1 z-10"
                  onMouseEnter={handleShowReactionPicker}
                  onMouseLeave={handleHideReactionPicker}
                >
                  {reactionEmojis.map((type) => (
                    <button
                      key={type}
                      onClick={async () => {
                        await addReactionMutation.mutateAsync({
                          postId: post.id,
                          reactionType: type,
                        });
                        setShowReactionPicker(false);
                      }}
                      className="w-10 h-10 rounded-full hover:scale-125 transition-transform flex items-center justify-center text-2xl"
                    >
                      {REACTION_EMOJIS[type]}
                    </button>
                  ))}
        </div>
              )}
            </div>
            <Button
              variant="ghost"
              onClick={() => setShowCommentModal(true)}
              className="flex-1 h-9 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 font-medium text-sm"
            >
              <MessageSquare className="h-5 w-5 mr-2" />
              Bình luận
          </Button>
        </div>
        </div>
      </div>
      <CommentModal
        post={post}
        open={showCommentModal}
        onOpenChange={setShowCommentModal}
      />
      <EditPostDialog
        post={post}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSave={handleUpdatePost}
      />
    </>
  );
}

// --- Skeletons & Empty -----------------------------------------------------
function PostSkeleton() {
  return (
    <div className="bg-white dark:bg-[#242526] rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-3 pb-0">
        <div className="flex items-start gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-[40%]" />
            <Skeleton className="h-3 w-[30%]" />
        </div>
        </div>
      </div>
      <div className="px-4 pb-3 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-[90%]" />
        <Skeleton className="h-4 w-[80%]" />
      </div>
      <div className="px-2 pb-2 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-1">
          <Skeleton className="flex-1 h-9 rounded-lg" />
          <Skeleton className="flex-1 h-9 rounded-lg" />
          <Skeleton className="flex-1 h-9 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

function EmptyState({ label = "Không tìm thấy bài viết nào." }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 gap-3 bg-white dark:bg-[#242526] rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="rounded-full p-4 bg-gray-100 dark:bg-gray-700">
        <MessageSquare className="h-8 w-8 text-gray-400" />
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
    </div>
  );
}

// --- Utils -----------------------------------------------------------------
function timeAgo(iso: string): string {
  const diff = Date.now() - +new Date(iso);
  const m = Math.floor(diff / 60000);
  if (m < 1) return "vừa xong";
  if (m < 60) return `${m} phút`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} ngày`;
  const w = Math.floor(d / 7);
  if (w < 4) return `${w} tuần`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo} tháng`;
  const y = Math.floor(d / 365);
  return `${y} năm`;
}


// --- Left Sidebar ---------------------------------------------------------
function LeftSidebar() {
  const { user } = useAuth();
  const userId = user?.id;
  const { data: profile } = useProfile(userId as string);

  const shortcuts = [
    { icon: Home, label: "Trang chủ", active: true },
    { icon: Users, label: "Nhóm", active: false },
    { icon: Bookmark, label: "Đã lưu", active: false },
    { icon: Clock, label: "Gần đây", active: false },
    { icon: Video, label: "Video", active: false },
    { icon: Calendar, label: "Sự kiện", active: false },
  ];

  return (
    <aside className="flex-1 flex-shrink-0 sticky top-0 h-screen overflow-y-auto pt-6 px-3">
      <div className="space-y-4">
        {/* User Profile Card */}
        <div className="bg-white dark:bg-[#242526] rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className="bg-blue-500 text-white">
                {profile?.display_name?.[0] || user?.email?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-[15px] text-gray-900 dark:text-white truncate">
                {profile?.display_name || user?.email || "Người dùng"}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user?.email}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
            size="sm"
          >
            <LinkIcon className="h-4 w-4 mr-2" />
            Xem trang cá nhân
          </Button>
        </div>

        {/* Shortcuts */}
        <div className="bg-white dark:bg-[#242526] rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-3">
            <h3 className="font-semibold text-[15px] text-gray-900 dark:text-white mb-2">
              Lối tắt
            </h3>
            <div className="space-y-1">
              {shortcuts.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={idx}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      item.active
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Groups */}
        <GroupsSection userId={userId || ""} />
      </div>
    </aside>
  );
}

// --- Contact Item ---------------------------------------------------------
function ContactItem({ friend }: { friend: any }) {
  const { data: statusProfile } = useUserStatus(friend.id);
  const isOnline = statusProfile?.status === "online";

  // Simple: count mutual friends (could be improved with actual query)
  const mutualCount = Math.floor(Math.random() * 15); // TODO: Calculate real mutual friends

  return (
    <button className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
      <div className="relative">
        <Avatar className="h-9 w-9">
          <AvatarImage src={friend.avatar_url} />
          <AvatarFallback className="bg-blue-500 text-white">
            {friend.display_name?.[0] || friend.username?.[0] || "?"}
          </AvatarFallback>
        </Avatar>
        {isOnline && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-[#242526]" />
        )}
      </div>
      <div className="flex-1 min-w-0 text-left">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {friend.display_name || friend.username || "Người dùng"}
        </p>
        {mutualCount > 0 && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {mutualCount} bạn chung
          </p>
        )}
      </div>
    </button>
  );
}

// --- Groups Section -------------------------------------------------------
function GroupsSection({ userId }: { userId: string }) {
  const { data: conversations } = useConversations(userId);
  const groups = conversations?.filter((c) => c.type === "group") || [];

  return (
    <div className="bg-white dark:bg-[#242526] rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-[15px] text-gray-900 dark:text-white">
            Nhóm của bạn
          </h3>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-2">
          {groups.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-2">
              Chưa có nhóm nào
            </p>
          ) : (
            groups.slice(0, 5).map((group) => (
              <button
                key={group.id}
                className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {group.photo_url ? (
                  <img
                    src={`${supabaseUrl}/storage/v1/object/public/chat-attachments/${group.photo_url}`}
                    alt={group.title || "Group"}
                    className="h-9 w-9 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                )}
                <span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1 text-left">
                  {group.title || "Nhóm không tên"}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// --- Right Sidebar --------------------------------------------------------
function RightSidebar({ userId }: { userId: string }) {
  const { data: friends, isLoading: friendsLoading } = useFriends(userId);

  return (
    <aside className="flex-1 flex-shrink-0 sticky top-0 h-screen overflow-y-auto pt-6 px-3">
      <div className="space-y-4">
        {/* Sponsored */}
        <div className="bg-white dark:bg-[#242526] rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4">
            <h3 className="font-semibold text-[15px] text-gray-900 dark:text-white mb-3">
              Được tài trợ
            </h3>
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="aspect-video bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Quảng cáo
                    </p>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      Tiêu đề quảng cáo {i}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      example.com
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Birthdays */}
        <div className="bg-white dark:bg-[#242526] rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              <h3 className="font-semibold text-[15px] text-gray-900 dark:text-white">
                Sinh nhật
              </h3>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Hôm nay là sinh nhật của <span className="font-semibold">Nguyễn Văn A</span> và{" "}
              <span className="font-semibold">Trần Thị B</span>
            </p>
            <Button
              variant="ghost"
              className="w-full mt-3 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              size="sm"
            >
              Gửi lời chúc
            </Button>
          </div>
        </div>

        {/* Contacts */}
        <div className="bg-white dark:bg-[#242526] rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-[15px] text-gray-900 dark:text-white">
                Người liên hệ
              </h3>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  <Video className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  <Search className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              {friendsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 px-2 py-2">
                      <Skeleton className="h-9 w-9 rounded-full" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-2 w-16" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : friends && friends.length > 0 ? (
                friends.slice(0, 8).map((friend) => (
                  <ContactItem key={friend.id} friend={friend} />
                ))
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 py-2">
                  Chưa có bạn bè
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Trending Topics */}
        <div className="bg-white dark:bg-[#242526] rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <h3 className="font-semibold text-[15px] text-gray-900 dark:text-white">
                Chủ đề đang thịnh hành
              </h3>
            </div>
            <div className="space-y-2">
              {["Thiết kế nội thất", "Kiến trúc", "Nội thất nhỏ"].map((topic, idx) => (
                <button
                  key={idx}
                  className="w-full flex items-start gap-3 px-2 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                >
                  <TrendingUp className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {topic}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {Math.floor(Math.random() * 100 + 50)}K bài viết
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

// --- Main Page -------------------------------------------------------------
export default function PostsPage() {
  const { user } = useAuth();
  const userId = user?.id as string;
  const { data: friends } = useFriends(userId);
  const { data: posts, isLoading: postsLoading, refetch } = usePostsByFriends(userId || "");
  const [search, setSearch] = useState("");

  const filteredPosts = useMemo(() => {
    if (!posts) return [];
    let list = [...posts];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.content?.toLowerCase().includes(q) ||
          p.author?.display_name?.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [posts, search]);

  const handleSearch = (q: string) => {
      setSearch(q);
  };

  // Hiển thị message nếu không có bạn bè
  if (friends && friends.length === 0) {
  return (
      <div className="col-span-12 bg-gray-100 dark:bg-[#18191a] h-screen overflow-y-auto">
        <div className="max-w-[680px] mx-auto px-4 py-6">
          <div className="bg-white dark:bg-[#242526] rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
            <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Chưa có bạn bè
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Bạn cần kết bạn để thấy các bài viết. Hãy tìm kiếm và thêm bạn bè để bắt đầu!
            </p>
        </div>
        </div>
      </div>
    );
  }

  return (
    <div className="col-span-12 bg-gray-100 dark:bg-[#18191a] h-screen overflow-hidden">
      <div className="flex gap-4 h-full max-w-[1920px] mx-auto px-4">
        {/* Left Sidebar */}
        <LeftSidebar />

        {/* Main Content */}
        <main className="flex-2 min-w-0 overflow-y-auto py-6">
          <div className="max-w-[680px] mx-auto px-4">
            {/* Header */}
            <div className="mb-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Bài viết</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">Khám phá các bài viết mới nhất</p>
        </div>

            {/* Create Post */}
            {userId && <CreatePostCard userId={userId} onPostCreated={() => refetch()} />}

            {/* Search */}
            <div className="mb-4">
              <Toolbar onSearch={handleSearch} />
        </div>

            {/* Posts List */}
            <PostList posts={filteredPosts} loading={postsLoading} currentUserId={userId || ""} />
          </div>
        </main>

        {/* Right Sidebar */}
        <RightSidebar userId={userId || ""} />
      </div>
    </div>
  );
}

function PostList({ 
  posts, 
  loading, 
  emptyLabel = "Chưa có bài viết nào.",
  currentUserId 
}: { 
  posts: Post[]; 
  loading?: boolean; 
  emptyLabel?: string;
  currentUserId: string;
}) {
  return (
    <div>
      {loading ? (
        <div className="space-y-4">
          <PostSkeleton />
          <PostSkeleton />
          <PostSkeleton />
        </div>
      ) : posts.length === 0 ? (
        <EmptyState label={emptyLabel} />
      ) : (
          <div className="space-y-4">
            {posts.map((p) => (
            <PostCard key={p.id} post={p} currentUserId={currentUserId} />
            ))}
          </div>
      )}
    </div>
  );
}
