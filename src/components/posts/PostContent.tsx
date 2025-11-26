import { useMemo } from 'react';

interface PostContentProps {
  content: string;
  className?: string;
}

export const PostContent: React.FC<PostContentProps> = ({ content, className = '' }) => {
  // Parse content and highlight mentions
  const parsedContent = useMemo(() => {
    if (!content) return [];

    const parts = [];
    const mentionRegex = /@(\w+)/g;
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      // Add text before mention
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: content.slice(lastIndex, match.index),
          key: `text-${lastIndex}`
        });
      }

      // Add mention
      parts.push({
        type: 'mention',
        content: match[0], // @username
        username: match[1], // username
        key: `mention-${match.index}`
      });

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        content: content.slice(lastIndex),
        key: `text-${lastIndex}`
      });
    }

    return parts;
  }, [content]);

  return (
    <div className={className}>
      {parsedContent.map((part) => {
        if (part.type === 'mention') {
          return (
            <span
              key={part.key}
              className="text-blue-600 dark:text-blue-400 font-medium hover:underline cursor-pointer"
              onClick={() => {
                // TODO: Navigate to user profile or show user info
                console.log('Navigate to user:', part.username);
              }}
            >
              {part.content}
            </span>
          );
        }
        
        return (
          <span key={part.key}>
            {part.content}
          </span>
        );
      })}
    </div>
  );
};
