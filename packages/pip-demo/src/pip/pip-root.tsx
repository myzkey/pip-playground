import { useState } from "react";

type Props = {
  onClose: () => void;
};

export function PipRoot({ onClose }: Props) {
  const [count, setCount] = useState(0);

  return (
    <div>
      <h1>PIP Window</h1>
      <div className="counter">Counter: {count}</div>
      <button className="btn-primary" onClick={() => setCount((c) => c + 1)}>
        +1
      </button>
      <button className="btn-danger" onClick={onClose}>
        Close
      </button>
    </div>
  );
}
