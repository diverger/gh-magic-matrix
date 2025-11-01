/**
 * Image utilities for converting external URLs to Base64 data URIs
 */

const imageCache = new Map<string, string>();
const inFlightRequests = new Map<string, Promise<string>>();

// Timeout for image fetch operations (10 seconds)
const FETCH_TIMEOUT_MS = 10000;

/**
 * Convert an image URL to a Base64 data URI
 * @param url - The image URL to convert
 * @returns Base64 data URI string
 */
export async function imageUrlToBase64(url: string): Promise<string> {
  // Check cache first
  if (imageCache.has(url)) {
    return imageCache.get(url)!;
  }

  // Check if there's already an in-flight request for this URL
  if (inFlightRequests.has(url)) {
    return inFlightRequests.get(url)!;
  }

  // Create and store the fetch Promise before starting async work
  const fetchPromise = (async () => {
    try {
      // Fetch with timeout using AbortSignal.timeout for automatic cleanup
      const response = await fetch(url, {
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
      });
      if (!response.ok) {
        console.warn(`Failed to fetch image from ${url}: ${response.statusText}`);
        return url; // Return original URL as fallback
      }

      const arrayBuffer = await response.arrayBuffer();
      const mimeType = response.headers.get('content-type') || 'image/png';
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      const dataUri = `data:${mimeType};base64,${base64}`;

      // Cache the result
      imageCache.set(url, dataUri);

      return dataUri;
    } catch (error) {
      // Handle timeout/abort errors specifically
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn(`Image fetch timed out after ${FETCH_TIMEOUT_MS}ms: ${url}`);
      } else {
        console.warn(`Error converting image ${url} to Base64:`, error);
      }
      return url; // Return original URL as fallback
    } finally {
      // Clean up in-flight request tracker
      inFlightRequests.delete(url);
    }
  })();

  // Store the Promise so concurrent requests can reuse it
  inFlightRequests.set(url, fetchPromise);

  return fetchPromise;
}

/**
 * Process emoji/image content:
 * - If it's an external URL (http/https), convert to Base64
 * - If it's already a data URI, return as-is
 * - If it's text/emoji, return as-is
 */
export async function processImageContent(content: string): Promise<string> {
  // Already a data URI - no conversion needed
  if (content.startsWith('data:')) {
    return content;
  }

  // External URL - convert to Base64 for GitHub compatibility
  if (content.startsWith('http://') || content.startsWith('https://')) {
    return await imageUrlToBase64(content);
  }

  // Regular emoji/text - return as-is
  return content;
}

/**
 * Batch process multiple image contents
 */
export async function processImageContents(
  contents: string[]
): Promise<string[]> {
  return Promise.all(contents.map(processImageContent));
}

/**
 * Clear the image cache
 */
export function clearImageCache(): void {
  imageCache.clear();
}
