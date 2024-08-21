import { useEffect, useState } from "react";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import "./App.css";

function App() {
  const [data, setData] = useState<string>("");

  useEffect(() => {
    const serverBaseURL = "http://localhost:5000";
    const fetchData = async () => {
      await fetchEventSource(`${serverBaseURL}/sse`, {
        method: "POST",
        headers: { Accept: "text/event-stream" },
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

  return (
    <>
      <h1>Content</h1>
      <p>{data}</p>
    </>
  );
}

export default App;
