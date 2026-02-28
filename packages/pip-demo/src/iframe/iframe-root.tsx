import { useState, useEffect } from "react";

type Props = {
  onClose: () => void;
};

export function IframeRoot({ onClose }: Props) {
  const [count, setCount] = useState(0);

  // Listen for messages from parent
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "CLOSE_REQUEST") {
        onClose();
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onClose]);

  const handleClose = () => {
    // Notify parent that we want to close
    window.parent.postMessage({ type: "IFRAME_CLOSE" }, "*");
    onClose();
  };

  return (
    <div>
      <h1>iframe Window</h1>
      <div className="counter">Counter: {count}</div>
      <button className="btn-primary" onClick={() => setCount((c) => c + 1)}>
        +1
      </button>
      <button className="btn-danger" onClick={handleClose}>
        Close
      </button>
    </div>
  );
}
