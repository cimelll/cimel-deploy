import { handleUpload } from "@vercel/blob/client";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "method not allowed"
    });
  }

  try {
    const jsonResponse = await handleUpload({
      body: req.body,
      request: req,

      onBeforeGenerateToken: async (pathname) => {
        return {
          allowedContentTypes: [
            "text/html",
            "text/plain",
            "application/octet-stream"
          ],
          maximumSizeInBytes: 50 * 1024 * 1024
        };
      }
    });

    return res.status(200).json(jsonResponse);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: error.message || "Upload gagal"
    });
  }
}
