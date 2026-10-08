export const config = {
  api: {
    bodyParser: {
      sizeLimit: '12mb'
    }
  }
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Metode tidak diizinkan" });
  }

  try {
    const { projectName, html } = req.body || {};

    if (!projectName || !html) {
      return res.status(400).json({ ok: false, error: "Nama project dan kode HTML wajib diisi" });
    }

    const token = process.env.VERCEL_TOKEN;
    if (!token) {
      return res.status(500).json({ ok: false, error: "VERCEL_TOKEN belum dipasang" });
    }

    if (!html.startsWith('<!DOCTYPE') && !html.startsWith('<html')) {
      return res.status(400).json({ ok: false, error: "Kode harus mulai dari <!DOCTYPE html>" });
    }

    const deployRes = await fetch("https://api.vercel.com/v10/deployments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: projectName,
        target: "production",
        files: [{ file: "index.html", data: html }],
        projectSettings: { framework: null }
      })
    });

    const resText = await deployRes.text();
    let data;

    try {
      data = JSON.parse(resText);
    } catch {
      return res.status(500).json({
        ok: false,
        error: "Bukan format JSON",
        detail: resText.slice(0, 300)
      });
    }

    if (!deployRes.ok) {
      return res.status(deployRes.status).json({
        ok: false,
        error: data.error?.message || data.message || "Deploy gagal"
      });
    }

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
        return res.status(500).json({ ok: false, error: "Build gagal" });
      }
    }

    if (deployment.readyState !== "READY") {
      return res.status(504).json({ ok: false, error: "Timeout, coba lagi" });
    }

    const url = deployment.url
      ? `https://${deployment.url}`
      : `https://${projectName}.vercel.app`;

    return res.status(200).json({ ok: true, url });

  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message || "Kesalahan server" });
  }
        }
        
