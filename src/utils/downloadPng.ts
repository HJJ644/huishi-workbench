import { toPng } from "html-to-image";

export async function downloadElementAsPng(
  node: HTMLElement,
  filename: string,
  pixelRatio = 2
) {
  await document.fonts.ready;
  await new Promise((resolve) =>
    requestAnimationFrame(() => resolve(undefined))
  );

  const original = {
    position: node.style.position,
    top: node.style.top,
    left: node.style.left,
    opacity: node.style.opacity,
    pointerEvents: node.style.pointerEvents,
    zIndex: node.style.zIndex,
    width: node.style.width,
    maxWidth: node.style.maxWidth,
  };

  // 将元素临时移出视口并固定定位，避免被父容器滚动/overflow 裁剪
  node.style.position = "fixed";
  node.style.top = "-10000px";
  node.style.left = "-10000px";
  node.style.opacity = "1";
  node.style.pointerEvents = "none";
  node.style.zIndex = "-1";
  node.style.maxWidth = "none";

  try {
    const dataUrl = await toPng(node, {
      cacheBust: true,
      pixelRatio,
    });
    const link = document.createElement("a");
    link.download = filename;
    link.href = dataUrl;
    link.click();
  } finally {
    node.style.position = original.position;
    node.style.top = original.top;
    node.style.left = original.left;
    node.style.opacity = original.opacity;
    node.style.pointerEvents = original.pointerEvents;
    node.style.zIndex = original.zIndex;
    node.style.width = original.width;
    node.style.maxWidth = original.maxWidth;
  }
}
