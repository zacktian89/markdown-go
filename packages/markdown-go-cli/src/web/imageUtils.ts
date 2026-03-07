/**
 * Parses the HTML and converts local img src to base64 by calling the local preview API.
 * This keeps copied WeChat HTML self-contained.
 */
export async function processImagesToBase64(htmlString: string, docPath?: string): Promise<string> {
  const document = new DOMParser().parseFromString(htmlString, "text/html");
  const images = Array.from(document.querySelectorAll("img"));

  if (images.length === 0) {
    return htmlString;
  }

  await Promise.all(images.map(async (image) => {
    const src = image.getAttribute("src");
    if (!src || src.startsWith("data:")) {
      return;
    }

    try {
      const docParam = docPath && docPath !== "/" ? `&docPath=${encodeURIComponent(docPath)}` : "";
      const response = await fetch(`/api/image?path=${encodeURIComponent(src)}${docParam}`);
      if (!response.ok) {
        return;
      }

      const data = await response.json();
      if (data.base64) {
        image.setAttribute("src", data.base64);
      }
    } catch (error) {
      console.warn("Failed to resolve image to base64:", src, error);
    }
  }));

  return document.body.innerHTML;
}
