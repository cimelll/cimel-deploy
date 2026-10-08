export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "method not allowed"
    });
  }

  try {
    const { projectName, blobUrl } = req.body || {};

    if (!projectName || !blobUrl) {
      return res.status(400).json({
        error: "nama project dan file wajib diisi"
      });
    }

    const token = process.env.VERCEL_TOKEN;

    if (!token) {
      return res.status(500).json({
        error: "VERCEL_TOKEN belum dipasang di Vercel"
      });
    }

    // ambil HTML dari Blob
    const fileResponse = await fetch(blobUrl);

    if (!fileResponse.ok) {
      return res.status(500).json({
        error: "gagal mengambil file dari storage"
      });
    }

    const html = await fileResponse.text();

    if (!html) {
      return res.status(400).json({
        error: "file HTML kosong"
      });
    }

    // buat deployment
    const response = await fetch(
      "https://api.vercel.com/v13/deployments",
      {
        method: "POST",

        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          name: projectName,
          target: "production",

          files: [
            {
              file: "index.html",
              data: html
            }
          ],

          projectSettings: {
            framework: null
          }
        })
      }
    );

    const responseText = await response.text();

    let data;

    try {
      data = JSON.parse(responseText);
    } catch {
      return res.status(500).json({
        error: "Vercel mengirim response bukan JSON",
        detail: responseText.slice(0, 500)
      });
    }

    if (!response.ok) {
      return res.status(response.status).json({
        error:
          data.error?.message ||
          data.error ||
          "deployment gagal"
      });
    }

    return res.status(200).json({
      ok: true,
      url: data.url
        ? `https://${data.url}`
        : `https://${projectName}.vercel.app`
    });

  } catch (error) {
    console.error("deploy error:", error);

    return res.status(500).json({
      error: error.message || "terjadi kesalahan server"
    });
  }
          }
