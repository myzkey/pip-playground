import { createRoot, Root } from "react-dom/client";
import { createElement } from "react";
import { PipRoot } from "./pip-root";
import { pipStyles } from "./pip-styles";

export type PipHandle = {
  pipWindow: Window;
  root: Root;
};

export async function mountToPip(
  onClose: () => void
): Promise<PipHandle | null> {
  // Feature detection
  if (!("documentPictureInPicture" in window)) {
    return null;
  }

  // Request PiP window
  const pipWindow = await (
    window as unknown as {
      documentPictureInPicture: {
        requestWindow: (options: {
          width: number;
          height: number;
        }) => Promise<Window>;
      };
    }
  ).documentPictureInPicture.requestWindow({
    width: 320,
    height: 240,
  });

  // Inject styles
  const style = pipWindow.document.createElement("style");
  style.textContent = pipStyles;
  pipWindow.document.head.appendChild(style);

  // Create root element
  const rootEl = pipWindow.document.createElement("div");
  rootEl.id = "root";
  pipWindow.document.body.appendChild(rootEl);

  // Handle close from PiP window's X button
  const handleClose = () => {
    root.unmount();
    onClose();
  };

  pipWindow.addEventListener("pagehide", handleClose);

  // Mount React
  const root = createRoot(rootEl);
  root.render(
    createElement(PipRoot, {
      onClose: () => {
        pipWindow.close();
      },
    })
  );

  return { pipWindow, root };
}

export function closePip(handle: PipHandle | null): void {
  if (!handle) return;

  try {
    handle.root.unmount();
  } catch {
    // already unmounted
  }

  try {
    handle.pipWindow.close();
  } catch {
    // already closed
  }
}
