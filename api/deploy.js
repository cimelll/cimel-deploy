export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "method not allowed"
    });
  }

  try {
    const { projectName, html } = req.body || {};

    if (!projectName || !html) {
      return res.status(400).json({
        error: "nama project dan html wajib diisi"
      });
    }

    const token = process.env.VERCEL_TOKEN;

    if (!token) {
      return res.status(500).json({
        error: "VERCEL_TOKEN belum dipasang di Vercel"
      });
    }

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
            framework: null,
            devCommand: null,
            installCommand: null,
            buildCommand: null,
            outputDirectory: null,
            rootDirectory: null
          }
        })
      }
    );

    const text = await response.text();

    let data;

    try {
      data = JSON.parse(text);
    } catch {
      return res.status(response.status || 500).json({
        error: "Vercel mengirim response yang bukan JSON",
        detail: text.slice(0, 500)
      });
    }

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || data.error || "deployment gagal",
        detail: data
      });
    }

    return res.status(200).json({
      ok: true,
      id: data.id,
      url:
        data.url
          ? `https://${data.url}`
          : `https://${projectName}.vercel.app`
    });

  } catch (error) {
    console.error("Deploy error:", error);

    return res.status(500).json({
      error: error.message || "terjadi kesalahan server"
    });
  }
}
