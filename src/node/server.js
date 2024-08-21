const http = require("http"); // Use 'http' for HTTP endpoints

const data = JSON.stringify({
  prompt: "Tell me the story of Canada in 5000 words",
});

const options = {
  hostname: "127.0.0.1", // Only the hostname or IP address
  port: 5000, // Specify the port separately
  path: "/chat/stream", // Replace with the actual path
  method: "POST", // Use the appropriate HTTP method
  headers: {
    "Content-Type": "application/json",
    "Content-Length": data.length,
  },
};

const req = http.request(options, (res) => {
  res.on("data", (chunk) => {
    console.log(`Data chunk: ${chunk}`);
  });

  res.on("end", () => {
    console.log("No more data in response.");
  });
});

req.on("error", (e) => {
  console.error(`Problem with request: ${e.message}`);
});

// Write data to request body
req.write(data);
req.end();
