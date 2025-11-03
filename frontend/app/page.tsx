"use client";

import { MultiAgentChatInterface } from "../src/components/chat/MultiAgentChatInterface";

export default function Home() {
  return (
    <MultiAgentChatInterface
      initialAgentId="expert_web_searcher"
      title="AI Assistant Hub"
      description="Choose your AI assistant and start chatting"
    />
  );
}
