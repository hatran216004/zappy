import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ListFilter,
  Search,
  Sun,
  Moon,
  ThumbsUp,
  MessageSquare,
  Share2,
  MoreHorizontal,
  Bookmark,
  Flame,
  Tag,
} from "lucide-react";

//
// Discord-inspired Posts page
// - shadcn/ui + TailwindCSS
// - Light/Dark theme toggle via next-themes
// - Responsive toolbar, tabs, filters
// - Post cards with actions
// - Skeleton loading + empty states
//

// --- Mock data (replace with your API calls) -------------------------------
export type Post = {
  id: string;
  title: string;
  excerpt: string;
  author: { name: string; avatar?: string };
  createdAt: string; // ISO
  tags: string[];
  likes: number;
  comments: number;
  saved?: boolean;
  trendingScore?: number;
  image?: string; // <-- added
};

const MOCK_POSTS: Post[] = [
  {
    id: "1",
    title: "Giữ lối đi trong bếp rõ ràng – 7 mẹo nhỏ cho căn hộ 70m²",
    excerpt:
      "Quy hoạch lối đi 900–1200mm giúp di chuyển thoải mái, hạn chế va chạm khi nấu nướng. Đây là checklist nhanh để tối ưu không gian.",
    author: { name: "LU Design" },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    tags: ["Kitchen", "Tips", "Apartment"],
    likes: 124,
    comments: 12,
    saved: true,
    trendingScore: 0.82,
    image:
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=1600&auto=format&fit=crop", // kitchen aisle
  },
  {
    id: "2",
    title: "Kệ bếp I hay L cho căn hộ nhỏ? Nguyên tắc chọn trong 30s",
    excerpt:
      "Nếu chiều ngang <2.4m, ưu tiên kệ I để tối ưu lối đi; từ 2.4–3.2m, kệ L giúp thêm mặt bàn và vùng chuẩn bị.",
    author: { name: "Planner Nhi" },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    tags: ["Layout", "Kitchen"],
    likes: 88,
    comments: 9,
    trendingScore: 0.67,
    image:
      "https://images.unsplash.com/photo-1616597098430-5d6c1be0c8a0?q=80&w=1600&auto=format&fit=crop", // kitchen layout
  },
  {
    id: "3",
    title: "Tối ưu ánh sáng: 3 lớp – nền, điểm, nhấn",
    excerpt:
      "Phối hợp downlight (ambient), strip LED (task) và spot (accent) để tạo chiều sâu mà vẫn tiết kiệm điện.",
    author: { name: "KTS Minh" },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    tags: ["Lighting", "Wabi-sabi"],
    likes: 231,
    comments: 31,
    trendingScore: 0.91,
    image:
      "https://images.unsplash.com/photo-1505691723518-36a5ac3b2d52?q=80&w=1600&auto=format&fit=crop", // lighting
  },
];

// --- Toolbar ---------------------------------------------------------------
function Toolbar({
  onSearch,
  onSortChange,
}: {
  onSearch: (q: string) => void;
  onSortChange: (s: SortKey) => void;
}) {
  const [q, setQ] = useState("");
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2 w-full sm:w-[480px]">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-60" />
          <Input
            placeholder="Search posts, tags, authors…"
            className="pl-9"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSearch(q.trim());
            }}
          />
        </div>
        <Button variant="secondary" onClick={() => onSearch(q.trim())}>
          Search
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <ListFilter className="h-4 w-4" /> Sort
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuLabel>Sort by</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onSortChange("latest")}>
              Latest
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSortChange("trending")}>
              Trending
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSortChange("most_liked")}>
              Most liked
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSortChange("most_commented")}>
              Most commented
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// --- Filters (Tags) --------------------------------------------------------
function TagFilters({
  active,
  onToggle,
}: {
  active: string[];
  onToggle: (tag: string) => void;
}) {
  const allTags = ["Kitchen", "Tips", "Apartment", "Layout", "Lighting", "Wabi-sabi"];
  return (
    <div className="flex flex-wrap gap-2">
      {allTags.map((t) => {
        const selected = active.includes(t);
        return (
          <Badge
            key={t}
            variant={selected ? "default" : "secondary"}
            className="cursor-pointer select-none"
            onClick={() => onToggle(t)}
          >
            <Tag className="h-3.5 w-3.5 mr-1.5" /> {t}
          </Badge>
        );
      })}
    </div>
  );
}

// --- Post Card -------------------------------------------------------------
function PostCard({ post }: { post: Post }) {
  return (
    <Card className="hover:bg-muted/50 transition-colors">
      <CardHeader className="flex flex-row items-start gap-4">
        <Avatar className="h-9 w-9">
          <AvatarImage src={post.author.avatar} alt={post.author.name} />
          <AvatarFallback>
            {post.author.name
              .split(" ")
              .map((s) => s[0])
              .join("")}
          </AvatarFallback>
        </Avatar>
        <div className="grid gap-1">
          <CardTitle className="leading-tight text-base sm:text-lg">
            {post.title}
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            by <span className="font-medium">{post.author.name}</span> · {timeAgo(post.createdAt)} ·
            <span className="ml-1">{post.tags.join(" • ")}</span>
          </CardDescription>
        </div>
        <div className="ml-auto">
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* --- Added image (only) --- */}
        {post.image && (
          <div className="mb-3 overflow-hidden rounded-lg">
            <img
              src={post.image}
              alt={post.title}
              className="w-full h-auto object-cover max-h-72"
              loading="lazy"
            />
          </div>
        )}
        <p className="text-sm text-muted-foreground line-clamp-3">{post.excerpt}</p>
      </CardContent>
      <CardFooter className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="gap-2">
            <ThumbsUp className="h-4 w-4" /> {formatNumber(post.likes)}
          </Button>
          <Button variant="ghost" size="sm" className="gap-2">
            <MessageSquare className="h-4 w-4" /> {formatNumber(post.comments)}
          </Button>
          <Button variant="ghost" size="sm" className="gap-2">
            <Share2 className="h-4 w-4" /> Share
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {post.trendingScore && (
            <Badge variant="outline" className="gap-1">
              <Flame className="h-3.5 w-3.5" /> Trending
            </Badge>
          )}
          <Button variant={post.saved ? "secondary" : "outline"} size="sm" className="gap-2">
            <Bookmark className="h-4 w-4" /> {post.saved ? "Saved" : "Save"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

// --- Skeletons & Empty -----------------------------------------------------
function PostSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start gap-4">
        <Skeleton className="h-9 w-9 rounded-full" />
        <div className="w-full space-y-2">
          <Skeleton className="h-4 w-[50%]" />
          <Skeleton className="h-3 w-[35%]" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-3 w-[95%]" />
        <Skeleton className="h-3 w-[80%]" />
        <Skeleton className="h-3 w-[70%]" />
      </CardContent>
      <CardFooter className="flex items-center gap-3">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-16" />
      </CardFooter>
    </Card>
  );
}

function EmptyState({ label = "No posts found." }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 gap-3">
      <div className="rounded-full p-3 bg-muted">
        <MessageSquare className="h-6 w-6" />
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

// --- Sorting ---------------------------------------------------------------
type SortKey = "latest" | "trending" | "most_liked" | "most_commented";

function sortPosts(posts: Post[], key: SortKey): Post[] {
  switch (key) {
    case "latest":
      return [...posts].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    case "trending":
      return [...posts].sort((a, b) => (b.trendingScore ?? 0) - (a.trendingScore ?? 0));
    case "most_liked":
      return [...posts].sort((a, b) => b.likes - a.likes);
    case "most_commented":
      return [...posts].sort((a, b) => b.comments - a.comments);
    default:
      return posts;
  }
}

// --- Utils -----------------------------------------------------------------
function timeAgo(iso: string): string {
  const diff = Date.now() - +new Date(iso);
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function formatNumber(n: number) {
  return new Intl.NumberFormat(undefined, { notation: "compact" }).format(n);
}

// --- Main Page -------------------------------------------------------------
export default function PostsPage() {
  const [sort, setSort] = useState<SortKey>("latest");
  const [search, setSearch] = useState("");
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Simulate fetch with filters
  const posts = useMemo(() => {
    let list = sortPosts(MOCK_POSTS, sort);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.excerpt.toLowerCase().includes(q) ||
          p.author.name.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (activeTags.length) {
      list = list.filter((p) => p.tags.some((t) => activeTags.includes(t)));
    }
    return list;
  }, [sort, search, activeTags]);

  const handleSearch = (q: string) => {
    setLoading(true);
    setTimeout(() => {
      setSearch(q);
      setLoading(false);
    }, 350);
  };

  const handleSort = (s: SortKey) => {
    setSort(s);
  };

  const toggleTag = (t: string) => {
    setActiveTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  return (
    <div className="col-span-12 px-4 py-6 h-screen overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-muted p-2">
          <MessageSquare className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Posts</h1>
          <p className="text-sm text-muted-foreground">Discord-inspired feed with filters</p>
        </div>
      </div>

      <Separator className="my-6" />

      {/* Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="grid grid-cols-3 w-full sm:w-auto">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="trending">Trending</TabsTrigger>
            <TabsTrigger value="saved">Saved</TabsTrigger>
          </TabsList>
          <Toolbar onSearch={handleSearch} onSortChange={handleSort} />
        </div>

        <div className="mt-4">
          <TagFilters active={activeTags} onToggle={toggleTag} />
        </div>

        <TabsContent value="all" className="mt-6">
          <PostList posts={posts} loading={loading} />
        </TabsContent>
        <TabsContent value="trending" className="mt-6">
          <PostList
            posts={posts.filter((p) => (p.trendingScore ?? 0) > 0.7)}
            loading={loading}
            emptyLabel="No trending posts right now."
          />
        </TabsContent>
        <TabsContent value="saved" className="mt-6">
          <PostList posts={posts.filter((p) => p.saved)} loading={loading} emptyLabel="No saved posts yet." />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PostList({ posts, loading, emptyLabel }: { posts: Post[]; loading?: boolean; emptyLabel?: string }) {
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
        <ScrollArea className="max-h-[70vh] pr-2">
          <div className="space-y-4">
            {posts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
