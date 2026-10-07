export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "method not allowed"
    });
  }

  try {
    const { projectName, html } = req.body;

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

    // buat deployment production
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

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    // tunggu sampai deployment READY
    let deployment = data;

    for (let i = 0; i < 40; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const check = await fetch(
        `https://api.vercel.com/v13/deployments/${data.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      deployment = await check.json();

      if (deployment.readyState === "READY") {
        break;
      }

      if (deployment.readyState === "ERROR") {
        return res.status(500).json({
          error: "build deployment gagal di Vercel"
        });
      }
    }

    if (deployment.readyState !== "READY") {
      return res.status(504).json({
        error: "deployment timeout"
      });
    }

    // ambil production alias
    let alias = null;

    if (deployment.alias && deployment.alias.length) {
      alias =
        deployment.alias.find(a => a.endsWith(".vercel.app")) ||
        deployment.alias[0];
    }

    // fallback ke default production domain
    if (!alias) {
      alias = `${projectName}.vercel.app`;
    }

    return res.status(200).json({
      ok: true,
      url: `https://${alias}`
    });

  } catch (error) {
    return res.status(500).json({
      error: error.message
    });
  }
      }
