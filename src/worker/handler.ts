

declare const worker: WechatMinigame.Worker | undefined;

declare var onmessage: (event: { data: MainMessage }) => void;
declare function postMessage(data: WorkerMessage): void;


const isBrowser = typeof worker === "undefined"
const handler: {
    onmessage: ((data: MainMessage) => void),
    postMessage: ((data: WorkerMessage) => void)
} = {
    onmessage: null!,
    postMessage: null!
}
if (isBrowser) {
    onmessage = (event) => handler.onmessage && handler.onmessage(event.data);
    handler.postMessage = (data) => postMessage(data);
} else {

    worker.onMessage((event) => handler.onmessage && handler.onmessage(event as unknown as MainMessage));
    handler.postMessage = (data) => worker.postMessage(data);
}
export { handler }