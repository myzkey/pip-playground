import { createRoot, Root } from "react-dom/client";
import { createElement } from "react";
import { IframeRoot } from "./iframe-root";
import { iframeStyles } from "./iframe-styles";

export type IframeHandle = {
  iframe: HTMLIFrameElement;
  root: Root;
};

export function mountToIframe(
  container: HTMLElement,
  onClose: () => void
): IframeHandle {
  // Create iframe element
  const iframe = document.createElement("iframe");
  iframe.style.width = "320px";
  iframe.style.height = "240px";
  iframe.style.border = "2px solid #4361ee";
  iframe.style.borderRadius = "8px";
  container.appendChild(iframe);

  const iframeDoc = iframe.contentDocument!;

  // Inject styles
  const style = iframeDoc.createElement("style");
  style.textContent = iframeStyles;
  iframeDoc.head.appendChild(style);

  // Create root element
  const rootEl = iframeDoc.createElement("div");
  rootEl.id = "root";
  iframeDoc.body.appendChild(rootEl);

  // Mount React
  const root = createRoot(rootEl);
  root.render(
    createElement(IframeRoot, {
      onClose: () => {
        root.unmount();
        iframe.remove();
        onClose();
      },
    })
  );

  return { iframe, root };
}

export function closeIframe(handle: IframeHandle | null): void {
  if (!handle) return;

  try {
    handle.root.unmount();
  } catch {
    // already unmounted
  }

  try {
    handle.iframe.remove();
  } catch {
    // already removed
  }
}
