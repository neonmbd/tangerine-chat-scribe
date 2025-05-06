
import React from "react";
import { Message } from "@/lib/supabase";
import { MessageItem } from "./MessageItem";

interface MessageListProps {
  messages: Message[];
}

export const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  // Group consecutive messages by the same role
  const groupedMessages: Message[][] = [];
  let currentGroup: Message[] = [];

  messages.forEach((message, index) => {
    if (index === 0 || messages[index - 1].role !== message.role) {
      if (currentGroup.length > 0) {
        groupedMessages.push([...currentGroup]);
        currentGroup = [];
      }
    }
    currentGroup.push(message);
    
    if (index === messages.length - 1) {
      groupedMessages.push([...currentGroup]);
    }
  });

  return (
    <div className="space-y-6">
      {groupedMessages.map((group, groupIndex) => (
        <div key={groupIndex} className="space-y-2">
          {group.map((message, msgIndex) => (
            <MessageItem 
              key={message.id} 
              message={message} 
              isFirstInGroup={msgIndex === 0}
              className={`animate-fade-in`}
              style={{ animationDelay: `${msgIndex * 100}ms` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};
