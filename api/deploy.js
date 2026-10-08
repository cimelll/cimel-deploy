async function deploy(){
  const name = projectName.value.trim();
  const html = htmlCode.value.trim();
  const status = document.getElementById("status");
  const button = document.getElementById("deployButton");

  if(!name){
    status.className = "info error";
    status.textContent = "Masukkan nama project dulu.";
    projectName.focus();
    return;
  }

  if(!html){
    status.className = "info error";
    status.textContent = "Masukkan kode HTML atau upload file dulu.";
    htmlCode.focus();
    return;
  }

  button.disabled = true;
  button.textContent = "MENGUPLOAD...";

  status.className = "info";
  status.innerHTML =
    '<span class="loading">Mengupload HTML...<span class="loading-dot"></span></span>';

  try{

    // Load Vercel Blob client SDK
    const { upload } = await import(
      "https://esm.sh/@vercel/blob@2.6.1/client"
    );

    // Ubah HTML textarea menjadi File
    const file = new File(
      [html],
      `${name}.html`,
      {
        type: "text/html"
      }
    );

    // Upload langsung dari browser ke Vercel Blob
    const blob = await upload(
      `${name}-${Date.now()}.html`,
      file,
      {
        access: "private",
        handleUploadUrl: "/api/upload",
        multipart: true,

        onUploadProgress(event){
          const percent =
            Math.round(event.percentage || 0);

          status.innerHTML =
            `<span class="loading">Mengupload HTML ${percent}%...<span class="loading-dot"></span></span>`;
        }
      }
    );

    status.innerHTML =
      '<span class="loading">Membuat deployment Vercel...<span class="loading-dot"></span></span>';

    button.textContent = "DEPLOY...";

    // Kirim HANYA pathname ke backend
    const response = await fetch(
      "/api/deploy",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          projectName: name,
          pathname: blob.pathname
        })
      }
    );

    const data = await response.json();

    if(!response.ok){
      let errorText = "";

      if(typeof data === "string"){
        errorText = data;
      }else if(typeof data.error === "string"){
        errorText = data.error;
      }else{
        errorText =
          JSON.stringify(data, null, 2);
      }

      throw new Error(
        "HTTP " +
        response.status +
        ": " +
        errorText
      );
    }

    if(!data.url){
      throw new Error(
        "Link website tidak ditemukan."
      );
    }

    const websiteUrl =
      data.url.replace(
        /'/g,
        "&#039;"
      );

    status.className =
      "info success";

    status.innerHTML =
      "Website berhasil dibuat." +
      "<br><br>" +
      "<a href='" +
      websiteUrl +
      "' target='_blank'>" +
      websiteUrl +
      "</a>" +
      "<div class='result-actions'>" +
        "<a class='result-btn open-btn' href='" +
        websiteUrl +
        "' target='_blank'>" +
        "BUKA WEBSITE" +
        "</a>" +
        "<button class='result-btn copy-btn' " +
        "onclick=\"copyWebsite('" +
        data.url.replace(/'/g, "\\'") +
        "')\">" +
        "SALIN LINK" +
        "</button>" +
      "</div>";

    button.textContent = "BERHASIL";

  }catch(error){

    console.error(error);

    status.className =
      "info error";

    status.innerHTML =
      "Proses gagal." +
      "<br><br>" +
      "<pre style='white-space:pre-wrap;'>" +
      escapeHtml(error.message) +
      "</pre>";

    button.disabled = false;
    button.textContent =
      "PROSES SEKARANG";
  }
      }
