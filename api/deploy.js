import { get } from "@vercel/blob";
import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "method not allowed"
    });
  }

  try {
    const { projectName, pathname } = req.body;

    if (!projectName || !pathname) {
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

    const result = await get(pathname, {
      access: "private",
      useCache: false
    });

    if (!result) {
      return res.status(404).json({
        error: "file HTML tidak ditemukan di Blob"
      });
    }

    const chunks = [];

    for await (const chunk of result.stream) {
      chunks.push(Buffer.from(chunk));
    }

    const fileBuffer = Buffer.concat(chunks);

    if (!fileBuffer.length) {
      return res.status(400).json({
        error: "file HTML kosong"
      });
    }

    const sha = crypto
      .createHash("sha1")
      .update(fileBuffer)
      .digest("hex");

    const uploadResponse = await fetch(
      "https://api.vercel.com/v2/now/files",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "x-vercel-digest": sha,
          "Content-Type": "text/html"
        },
        body: fileBuffer
      }
    );

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();

      return res.status(uploadResponse.status).json({
        error: "upload file ke Vercel gagal",
        details: errorText
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
              sha: sha,
              size: fileBuffer.length
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

    let deployment = data;

    for (let i = 0; i < 40; i++) {
      await new Promise(resolve =>
        setTimeout(resolve, 2000)
      );

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

      if (
        deployment.readyState === "ERROR" ||
        deployment.readyState === "CANCELED"
      ) {
        return res.status(500).json({
          error: "deployment gagal di Vercel"
        });
      }
    }

    if (deployment.readyState !== "READY") {
      return res.status(504).json({
        error: "deployment timeout"
      });
    }

    let alias = null;

    if (
      deployment.alias &&
      deployment.alias.length
    ) {
      alias =
        deployment.alias.find(
          a => a.endsWith(".vercel.app")
        ) ||
        deployment.alias[0];
    }

    if (!alias) {
      alias = `${projectName}.vercel.app`;
    }

    return res.status(200).json({
      ok: true,
      url: `https://${alias}`
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: error.message || "server error"
    });
  }
    }
