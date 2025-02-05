
import { handler } from "./handler"


handler.onmessage = (data) => {
    console.log("Message From Main: ", data);
    if (data.type === "ping") {
        handler.postMessage({ type: "pong" });
    }
}



