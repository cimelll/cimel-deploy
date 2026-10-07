export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { projectName, html } = req.body;

    if (!projectName || !html) {
      return res.status(400).json({
        error: "nama project dan html wajib diisi"
      });
    }

    const response = await fetch(
      "https://api.vercel.com/v13/deployments",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
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

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json({
      ok: true,
      url: `https://${data.alias?.[0] || data.url}`
    });

  } catch (error) {
    return res.status(500).json({
      error: error.message
    });
  }
      }
