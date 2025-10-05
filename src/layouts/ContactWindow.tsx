// import { useState } from "react";
// import { Input } from "@/components/ui/input";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
//   DropdownMenuSub,
//   DropdownMenuSubTrigger,
//   DropdownMenuSubContent,
// } from "@/components/ui/dropdown-menu";
// import { Button } from "@/components/ui/button";
// import {
//   ChevronDown,
//   Filter,
//   MoreHorizontal,
//   Check,
//   ArrowUpDownIcon,
// } from "lucide-react";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { avatarVariants } from "@/lib/variants";
// import { cn } from "@/lib/utils";

// import {
//   Tooltip,
//   TooltipContent,
//   TooltipProvider,
//   TooltipTrigger,
// } from "@/components/ui/tooltip";

// // Mock data data
// const data = [
//   {
//     id: 1,
//     name: "Nguyễn Văn A",
//     avatar: "/default_user.jpg",
//     tags: ["Thực tập", "Backend"],
//   },
//   {
//     id: 2,
//     name: "Trần Thị B",
//     avatar: "/default_user.jpg",
//     tags: ["Khóa luận cử nhân"],
//   },
//   {
//     id: 3,
//     name: "Lê Minh C",
//     avatar: "/default_user.jpg",
//     tags: ["Frontend", "ReactJS", "Nhóm 5"],
//   },
//   {
//     id: 4,
//     name: "Phạm Anh D",
//     avatar: "/default_user.jpg",
//     tags: ["ReactJS", "Frontend", "NodeJS", "TypeScript", "Next.js"],
//   },
//   {
//     id: 5,
//     name: "Hoàng Thảo E",
//     avatar: "/default_user.jpg",
//     tags: ["Mobile", "Flutter", "Firebase", "Supabase"],
//   },
//   {
//     id: 6,
//     name: "Đỗ Trung F",
//     avatar: "/default_user.jpg",
//     tags: ["Thiết kế UI", "UX", "Figma"],
//   },
// ];

// const classifyTags = [
//   { color: "bg-red-500", label: "Khóa luận cử nhân" },
//   { color: "bg-blue-500", label: "Thực tập" },
// ];

// type ContactWindowProps = {
//   contentContact?: {
//     id?: string;
//     title?: string;
//     icon?: React.ElementType;
//   };
// };

// export default function ContactWindow({ contentContact }: ContactWindowProps) {
//   const [filter, setFilter] = useState("Tất cả");
//   const [sort, setSort] = useState("Tên (A-Z)");

//   return (
//     <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-sm">
//       <div className="px-3 py-2 select-none">
//         {contentContact?.title
//           ?.replace(/^Danh sách\s*/i, "")
//           ?.trim()
//           ?.replace(/^./, (c) => c.toUpperCase())}{" "}
//         ({data.length})
//       </div>

//       {/* Search + Controls */}
//       <div className="flex gap-2 p-3">
//         {/* Search */}
//         <Input
//           placeholder="Tìm bạn..."
//           className="flex-1 h-9 rounded-lg bg-gray-100 dark:bg-gray-800
//                  focus:ring-2 focus:ring-blue-500 transition"
//         />
//         {/* Sort dropdown */}
//         <DropdownMenu>
//           <DropdownMenuTrigger asChild>
//             <Button
//               variant="outline"
//               size="sm"
//               className="flex items-center justify-between w-1/4 h-9 rounded-lg
//                      bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
//             >
//               <ArrowUpDownIcon className="size-4 mr-1 shrink-0 opacity-70" />
//               <span className="truncate">{sort}</span>
//               <ChevronDown className="size-4 ml-1 shrink-0 opacity-70" />
//             </Button>
//           </DropdownMenuTrigger>
//           <DropdownMenuContent
//             align="end"
//             className="w-[var(--radix-dropdown-menu-trigger-width)]
//                    bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100
//                    border border-gray-200 dark:border-gray-700 shadow-lg rounded-lg"
//           >
//             {["Tên (A-Z)", "Tên (Z-A)"].map((option) => (
//               <DropdownMenuItem
//                 key={option}
//                 onClick={() => setSort(option)}
//                 className="flex justify-between items-center px-3 py-2 rounded-md
//                          hover:bg-gray-100 dark:hover:bg-gray-700 transition truncate"
//               >
//                 {option}
//                 {sort === option && (
//                   <Check className="size-4 text-blue-500 shrink-0" />
//                 )}
//               </DropdownMenuItem>
//             ))}
//           </DropdownMenuContent>
//         </DropdownMenu>
//         {/* Filter dropdown */}

//         <DropdownMenu>
//           <DropdownMenuTrigger asChild>
//             <Button
//               variant="outline"
//               size="sm"
//               className="flex items-center justify-between w-1/4 h-9 rounded-lg
//                      bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
//             >
//               <Filter className="size-4 mr-1 shrink-0 opacity-70" />
//               <span className="truncate">{filter}</span>
//               <ChevronDown className="size-4 ml-1 shrink-0 opacity-70" />
//             </Button>
//           </DropdownMenuTrigger>
//           <DropdownMenuContent
//             align="end"
//             className="w-[var(--radix-dropdown-menu-trigger-width)]
//                    bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100
//                    border border-gray-200 dark:border-gray-700 shadow-lg rounded-lg overflow-hidden"
//           >
//             <DropdownMenuItem
//               onClick={() => setFilter("Tất cả")}
//               className="flex justify-between items-center px-3 py-2 rounded-md
//                        hover:bg-gray-100 dark:hover:bg-gray-700 transition"
//             >
//               Tất cả
//               {filter === "Tất cả" && (
//                 <Check className="size-4 text-blue-500 shrink-0" />
//               )}
//             </DropdownMenuItem>

//             <DropdownMenuSub>
//               <DropdownMenuSubTrigger className="px-3 py-2 rounded-md">
//                 Phân loại
//               </DropdownMenuSubTrigger>
//               <DropdownMenuSubContent
//                 className="w-[var(--radix-dropdown-menu-trigger-width)]
//              bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100
//              border border-gray-200 dark:border-gray-700 shadow-lg rounded-lg
//              overflow-hidden max-h-[300px]"
//               >
//                 {classifyTags.map((tag) => (
//                   <DropdownMenuItem
//                     key={tag.label}
//                     onClick={() => setFilter(tag.label)}
//                     className="flex justify-between items-center px-3 py-2 rounded-md
//                  hover:bg-gray-100 dark:hover:bg-gray-700 transition truncate"
//                   >
//                     <span className="flex items-center">
//                       <span
//                         className={`w-2 h-2 rounded-full inline-block mr-2 ${tag.color}`}
//                       />
//                       {tag.label}
//                     </span>
//                     {filter === tag.label && (
//                       <Check className="size-4 text-blue-500 shrink-0" />
//                     )}
//                   </DropdownMenuItem>
//                 ))}
//                 <DropdownMenuSeparator />
//                 <DropdownMenuItem className="px-3 py-2">
//                   Quản lý thẻ phân loại
//                 </DropdownMenuItem>
//               </DropdownMenuSubContent>
//             </DropdownMenuSub>
//           </DropdownMenuContent>
//         </DropdownMenu>
//       </div>

//       {/* Friend list */}
//       <div className="flex-1 overflow-y-auto scrollbar-custom">
//         {data.map((friend) => (
//           <div
//             key={friend.id}
//             className=" relative flex items-center justify-between p-3
//                      hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
//           >
//             <div className="flex items-center gap-3 relative z-10">
//               <Avatar className={cn(avatarVariants({ size: "md" }))}>
//                 <AvatarImage src={friend.avatar} />
//                 <AvatarFallback className="bg-zinc-300">MD</AvatarFallback>
//               </Avatar>
//               <div className="flex flex-col gap-1">
//                 <span className="text-sm font-medium">{friend.name}</span>

//                 <div className="flex flex-col gap-1">
//                   <div className="text-xs text-gray-500 dark:text-gray-400">
//                     5 thành viên
//                   </div>

//                   <div className="flex flex-wrap items-center gap-1">
//                     {friend.tags.slice(0, 3).map((tag, index) => (
//                       <span
//                         key={index}
//                         className="px-2 py-0.5 text-xs font-medium rounded-full
//                    bg-gray-100 text-gray-700
//                    dark:bg-gray-700 dark:text-gray-200
//                    hover:bg-gray-200 dark:hover:bg-gray-600
//                    transition-colors"
//                       >
//                         {tag}
//                       </span>
//                     ))}

//                     {/* Tooltip cho phần tag ẩn */}
//                     {friend.tags.length > 3 && (
//                       <TooltipProvider>
//                         <Tooltip>
//                           <TooltipTrigger asChild>
//                             <span
//                               className="px-2 py-0.5 text-xs font-medium rounded-full
//                          bg-gray-200 text-gray-700
//                          dark:bg-gray-600 dark:text-gray-200
//                          cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-500
//                          transition-colors"
//                             >
//                               +{friend.tags.length - 3}
//                             </span>
//                           </TooltipTrigger>
//                           <TooltipContent side="top">
//                             {friend.tags.slice(3).map((tag, i) => (
//                               <div key={i} className="p-1">
//                                 {tag}
//                               </div>
//                             ))}
//                           </TooltipContent>
//                         </Tooltip>
//                       </TooltipProvider>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             </div>
//             <Button
//               variant="ghost"
//               size="icon"
//               className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 relative z-10"
//             >
//               <MoreHorizontal className="size-4" />
//             </Button>

//             {/* Border custom */}
//             <div className="absolute bottom-0 left-[60px] right-0 border-b border-gray-700"></div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

import { ContactHeader } from "../components/Contacts/ContactHeader";
import { ContactList } from "../components/Contacts/ContactList";

const data = [
  {
    id: 1,
    name: "Nguyễn Văn A",
    avatar: "/default_user.jpg",
    tags: ["Thực tập", "Backend"],
  },
  {
    id: 2,
    name: "Trần Thị B",
    avatar: "/default_user.jpg",
    tags: ["Khóa luận cử nhân"],
  },
  {
    id: 3,
    name: "Lê Minh C",
    avatar: "/default_user.jpg",
    tags: ["Frontend", "ReactJS", "Nhóm 5"],
  },
  {
    id: 4,
    name: "Phạm Anh D",
    avatar: "/default_user.jpg",
    tags: ["ReactJS", "Frontend", "NodeJS", "TypeScript", "Next.js"],
  },
  {
    id: 5,
    name: "Hoàng Thảo E",
    avatar: "/default_user.jpg",
    tags: ["Mobile", "Flutter", "Firebase", "Supabase"],
  },
  {
    id: 6,
    name: "Đỗ Trung F",
    avatar: "/default_user.jpg",
    tags: ["Thiết kế UI", "UX", "Figma"],
  },
];

export default function ContactWindow({
  contentContact,
}: {
  contentContact?: {
    id?: string;
    title?: string;
    icon?: React.ElementType;
  };
}) {
  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-sm">
      <ContactHeader title={contentContact?.title} count={data.length} />
      <ContactList data={data} />
    </div>
  );
}
