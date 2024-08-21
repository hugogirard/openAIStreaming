import { useEffect, useState } from "react";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import "./App.css";

function App() {
  const [data, setData] = useState<string>("");
  const serverBaseURL = " http://127.0.0.1:5000/chat/stream";

  useEffect(() => {
  
    const fetchData = async () => {

      const requestBody = {
        prompt: "Tell me the hisotry of France in 5000 words"
      };
      await fetchEventSource(`${serverBaseURL}`, {
        method: "POST",
        headers: { Accept: "text/event-stream", "Content-Type": "application/json"},
        body: JSON.stringify(requestBody),
        async onopen(res): Promise<void> {
          if (res.ok && res.status === 200) {
            console.log("Connection made ", res);
          } else if (
            res.status >= 400 &&
            res.status < 500 &&
            res.status !== 429
          ) {
            console.log("Client-side error ", res);
          }
        },
        onmessage(event) {
          console.log(event.data);
          const parsedData = JSON.parse(event.data);
          const content = parsedData.content;
          setData((data) => data + content);
        },
        onclose() {
          console.log("Connection closed by the server");
        },
        onerror(err) {
          console.log("There was an error from server", err);
        },
      });
    };
    fetchData();
  }, []);

  // async function sendChatRequest(
  //   promptDTO: PromptDTO
  // ): Promise<AIResponseDTO | undefined> {
  //   console.log("Sending prompt: ", promptDTO);

  //   try {
  //     const response = await fetch(serverBaseURL, {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify(promptDTO),
  //     });

  //     if (!response.body) {
  //       throw new Error("ReadableStream not supported in this environment.");
  //     }

  //     const reader = response.body.getReader();
  //     const decoder = new TextDecoder("utf-8");
  //     let result = "";

  //     while (true) {
  //       const { done, value } = await reader.read();
  //       if (done) break;
  //       result += decoder.decode(value, { stream: true });
  //     }

  //     const data: AIResponseDTO = JSON.parse(result);
  //     return data;
  //   } catch (error) {
  //     console.error("Error:", error);
  //   }
  //   return undefined;
  // }

  return (
    <>
      <h1>Content</h1>
      <p>{data}</p>
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
