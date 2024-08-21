import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import "./App.css";

function App() {
  const [data, setData] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      const userUrl = "http://127.0.0.1:5000/chat/stream";

      const data = {
        "prompt": "Who is the pm of canada?"
      };

      try {
        const response = await fetch(userUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (response.ok) {
          const reader = response.body?.getReader();
          const decoder = new TextDecoder("utf-8");

          while (true) {
            const { value, done } = (await reader?.read()) ?? { done: true };
            if (done) break;

            const lines = decoder.decode(value, { stream: true }).split("\n");
            lines.forEach((line) => {
              if (line.trim()) {
                console.log("Received Line:", line);
                const jsonResponse = JSON.parse(line);
                setData((prevData) => prevData + jsonResponse.content);
              }
            });
          }
        } else {
          const errorText = await response.text();
          console.error("Error:", errorText);
        }
      } catch (error) {
        console.error("Error while processing streaming response:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <>
      <h1>Content</h1>
      <ReactMarkdown>{data}</ReactMarkdown>
    </>
  );
}

// MODELS

// Generate/Update API Request body
export interface PromptDTO {
  messages: ChatMessage[];
  conversation_id?: string;
}

// Generate API Response body
export interface HistoryMetadata {
  conversation_id: string;
  date: string;
}

export interface Choice {
  messages: AIMessage[];
}

export interface AIResponseDTO {
  "apim-request-id": string;
  choices: Choice[];
  created: number;
  history_metadata: HistoryMetadata;
  id: string;
  model: string;
  object: string;
  "reset-conversation": boolean;
}

// Update API Response body
export interface UpdateResponse {
  success: boolean;
}

// Feedback API Request body
export interface FeedbackRequest {
  message_id: string | undefined;
  message_feedback: string;
}

// Feedback API Response body
export interface FeedbackResponse {
  message: string;
  message_id: string;
}

// Base model for chat
export interface Citation {
  content: string;
  title: string;
  url: string;
  filepath: string | null;
  chunk_id: string;
}

export interface BaseMessage {
  role: "user" | "assistant" | "tool";
  content: string;
  id?: string;
  context?: {
    citations: Citation[];
    intent?: string;
  };
  date?: string;
}

export interface PromptMessage extends BaseMessage {
  role: "user";
}

export interface AIMessage extends BaseMessage {
  role: "assistant" | "tool";
}

export type ChatMessage = PromptMessage | AIMessage;

export default App;
