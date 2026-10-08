export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    }
  }
};

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

    // Ambil file dari tautan
    const fileResponse = await fetch(blobUrl);

    if (!fileResponse.ok) {
      return res.status(500).json({
        error: "gagal mengambil file dari storage"
      });
    }

    const html = await fileResponse.text();

    if (!html) {
      return res.status(400).json({
        error: "file kosong"
      });
    }

    // Pakai API v10 yang berfungsi + batas ukuran naik jadi 10MB
    const response = await fetch(
      "https://api.vercel.com/v10/deployments",
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
        error: "respons bukan JSON",
        detail: responseText.slice(0, 300)
      });
    }

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || "deploy gagal"
      });
    }

    // Tunggu sampai siap
    let deployment = data;
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 2000));
      const check = await fetch(
        `https://api.vercel.com/v10/deployments/${data.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      deployment = await check.json();
      if (deployment.readyState === "READY") break;
      if (deployment.readyState === "ERROR") {
        return res.status(500).json({ error: "gagal dibangun" });
      }
    }

    return res.status(200).json({
      ok: true,
      url: deployment.url
        ? `https://${deployment.url}`
        : `https://${projectName}.vercel.app`
    });

  } catch (error) {
    return res.status(500).json({
      error: error.message || "terjadi kesalahan"
    });
  }
            }

