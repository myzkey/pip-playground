import { useState, useRef, useCallback, useEffect } from "react";
import { mountToPip, closePip, PipHandle } from "./pip/mount-to-pip";
import { mountToIframe, closeIframe, IframeHandle } from "./iframe/mount-to-iframe";

type PipStatus = "idle" | "opened" | "closed" | "unsupported";
type IframeStatus = "idle" | "opened" | "closed";

const appStyles = `
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 24px;
    font-family: system-ui, sans-serif;
    background: #0f0f23;
    color: #eee;
    min-height: 100vh;
  }
  h1 { margin: 0 0 24px; }
  h2 { margin: 0 0 16px; font-size: 18px; color: #888; }
  .container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    max-width: 1200px;
  }
  @media (max-width: 800px) {
    .container { grid-template-columns: 1fr; }
  }
  .panel {
    background: #1a1a2e;
    padding: 20px;
    border-radius: 12px;
  }
  .panel-pip { border-top: 4px solid #4361ee; }
  .panel-iframe { border-top: 4px solid #f39c12; }
  .controls { margin-bottom: 16px; }
  button {
    padding: 10px 20px;
    margin-right: 8px;
    margin-bottom: 8px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    transition: opacity 0.2s;
  }
  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .btn-open-pip { background: #4361ee; color: white; }
  .btn-open-iframe { background: #f39c12; color: #111; }
  .btn-close { background: #e63946; color: white; }
  .status {
    padding: 6px 12px;
    background: #0f0f23;
    border-radius: 4px;
    display: inline-block;
    margin-bottom: 16px;
    font-size: 14px;
  }
  .status-idle { border-left: 3px solid #888; }
  .status-opened { border-left: 3px solid #2ecc71; }
  .status-closed { border-left: 3px solid #f39c12; }
  .status-unsupported { border-left: 3px solid #e74c3c; }
  .logs {
    background: #0f0f23;
    padding: 12px;
    border-radius: 6px;
    max-height: 150px;
    overflow-y: auto;
    font-size: 12px;
  }
  .log-entry {
    font-family: monospace;
    padding: 3px 0;
    border-bottom: 1px solid #333;
  }
  .log-entry:last-child { border-bottom: none; }
  .iframe-container {
    margin-top: 16px;
    min-height: 260px;
  }
  .comparison {
    grid-column: 1 / -1;
    background: #1a1a2e;
    padding: 20px;
    border-radius: 12px;
  }
  .comparison h2 { color: #eee; }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
  }
  th, td {
    padding: 10px 12px;
    text-align: left;
    border-bottom: 1px solid #333;
  }
  th { color: #888; font-weight: normal; }
  td:first-child { color: #888; }
  .highlight-pip { color: #4361ee; }
  .highlight-iframe { color: #f39c12; }
`;

function App() {
  // PiP state
  const [pipStatus, setPipStatus] = useState<PipStatus>("idle");
  const [pipLogs, setPipLogs] = useState<string[]>([]);
  const pipHandleRef = useRef<PipHandle | null>(null);

  // iframe state
  const [iframeStatus, setIframeStatus] = useState<IframeStatus>("idle");
  const [iframeLogs, setIframeLogs] = useState<string[]>([]);
  const iframeHandleRef = useRef<IframeHandle | null>(null);
  const iframeContainerRef = useRef<HTMLDivElement>(null);

  const addPipLog = useCallback((message: string) => {
    const time = new Date().toLocaleTimeString();
    setPipLogs((prev) => [`[${time}] ${message}`, ...prev].slice(0, 20));
  }, []);

  const addIframeLog = useCallback((message: string) => {
    const time = new Date().toLocaleTimeString();
    setIframeLogs((prev) => [`[${time}] ${message}`, ...prev].slice(0, 20));
  }, []);

  // Check PiP support on mount
  useEffect(() => {
    if (!("documentPictureInPicture" in window)) {
      setPipStatus("unsupported");
      addPipLog("Document PiP is not supported");
    } else {
      addPipLog("Document PiP is supported");
    }
  }, [addPipLog]);

  // Listen for iframe messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "IFRAME_CLOSE") {
        addIframeLog("Closed from iframe");
        iframeHandleRef.current = null;
        setIframeStatus("closed");
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [addIframeLog]);

  // PiP handlers
  const handleOpenPip = useCallback(async () => {
    if (pipHandleRef.current) {
      addPipLog("Already open");
      return;
    }
    addPipLog("Opening...");
    const handle = await mountToPip(() => {
      pipHandleRef.current = null;
      setPipStatus("closed");
      addPipLog("Closed (external)");
    });
    if (!handle) {
      setPipStatus("unsupported");
      addPipLog("Failed (unsupported)");
      return;
    }
    pipHandleRef.current = handle;
    setPipStatus("opened");
    addPipLog("Opened");
  }, [addPipLog]);

  const handleClosePip = useCallback(() => {
    if (!pipHandleRef.current) return;
    addPipLog("Closing...");
    closePip(pipHandleRef.current);
    pipHandleRef.current = null;
    setPipStatus("closed");
    addPipLog("Closed (from parent)");
  }, [addPipLog]);

  // iframe handlers
  const handleOpenIframe = useCallback(() => {
    if (iframeHandleRef.current || !iframeContainerRef.current) {
      addIframeLog("Already open");
      return;
    }
    addIframeLog("Opening...");
    const handle = mountToIframe(iframeContainerRef.current, () => {
      iframeHandleRef.current = null;
      setIframeStatus("closed");
      addIframeLog("Closed (external)");
    });
    iframeHandleRef.current = handle;
    setIframeStatus("opened");
    addIframeLog("Opened");
  }, [addIframeLog]);

  const handleCloseIframe = useCallback(() => {
    if (!iframeHandleRef.current) return;
    addIframeLog("Closing...");
    closeIframe(iframeHandleRef.current);
    iframeHandleRef.current = null;
    setIframeStatus("closed");
    addIframeLog("Closed (from parent)");
  }, [addIframeLog]);

  return (
    <>
      <style>{appStyles}</style>
      <h1>Document PiP vs iframe</h1>

      <div className="container">
        {/* PiP Panel */}
        <div className="panel panel-pip">
          <h2>Document Picture-in-Picture</h2>
          <div className={`status status-${pipStatus}`}>
            Status: <strong>{pipStatus}</strong>
          </div>
          <div className="controls">
            <button
              className="btn-open-pip"
              onClick={handleOpenPip}
              disabled={pipStatus === "unsupported" || pipStatus === "opened"}
            >
              Open PiP
            </button>
            <button
              className="btn-close"
              onClick={handleClosePip}
              disabled={pipStatus !== "opened"}
            >
              Close
            </button>
          </div>
          <div className="logs">
            {pipLogs.length === 0 ? (
              <div className="log-entry">No events</div>
            ) : (
              pipLogs.map((log, i) => (
                <div key={i} className="log-entry">{log}</div>
              ))
            )}
          </div>
        </div>

        {/* iframe Panel */}
        <div className="panel panel-iframe">
          <h2>iframe</h2>
          <div className={`status status-${iframeStatus}`}>
            Status: <strong>{iframeStatus}</strong>
          </div>
          <div className="controls">
            <button
              className="btn-open-iframe"
              onClick={handleOpenIframe}
              disabled={iframeStatus === "opened"}
            >
              Open iframe
            </button>
            <button
              className="btn-close"
              onClick={handleCloseIframe}
              disabled={iframeStatus !== "opened"}
            >
              Close
            </button>
          </div>
          <div className="logs">
            {iframeLogs.length === 0 ? (
              <div className="log-entry">No events</div>
            ) : (
              iframeLogs.map((log, i) => (
                <div key={i} className="log-entry">{log}</div>
              ))
            )}
          </div>
          <div className="iframe-container" ref={iframeContainerRef} />
        </div>

        {/* Comparison Table */}
        <div className="comparison">
          <h2>比較表</h2>
          <table>
            <thead>
              <tr>
                <th>項目</th>
                <th className="highlight-pip">Document PiP</th>
                <th className="highlight-iframe">iframe</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>ウィンドウ</td>
                <td>独立したOSウィンドウ</td>
                <td>親ページ内に埋め込み</td>
              </tr>
              <tr>
                <td>最前面表示</td>
                <td>他アプリの上に常に表示</td>
                <td>タブ切替で見えなくなる</td>
              </tr>
              <tr>
                <td>オリジン</td>
                <td>親と同一（直接アクセス可）</td>
                <td>分離可能（postMessage通信）</td>
              </tr>
              <tr>
                <td>ユースケース</td>
                <td>ミニプレイヤー、監視UI</td>
                <td>外部コンテンツ埋め込み</td>
              </tr>
              <tr>
                <td>ブラウザ対応</td>
                <td>Chrome 116+</td>
                <td>全ブラウザ</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default App;
