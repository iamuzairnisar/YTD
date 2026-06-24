document.addEventListener("DOMContentLoaded", () => {
  const urlInput = document.getElementById("youtube-url");
  const fetchBtn = document.getElementById("fetch-btn");
  const errorMsg = document.getElementById("error-msg");
  const resultSection = document.getElementById("result-section");
  const thumbnailImg = document.getElementById("thumbnail-img");
  const videoIdDisplay = document.getElementById("video-id-display");
  const downloadBtn = document.getElementById("download-btn");

  // Diagram elements
  const nodes = {
    input: document.getElementById("node-input"),
    process: document.getElementById("node-process"),
    server: document.getElementById("node-server"),
    output: document.getElementById("node-output"),
  };

  const connections = {
    conn1: document.getElementById("conn-1"),
    conn2: document.getElementById("conn-2"),
    conn3: document.getElementById("conn-3"),
  };

  // YouTube URL Regex patterns
  const ytRegex =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;

  let currentVideoId = null;
  let currentImgUrl = null;

  // Reset Diagram
  function resetDiagram() {
    Object.values(nodes).forEach((node) => {
      node.classList.remove("active", "success");
      node.querySelector(".node-status").innerText = "Idle";
    });
    Object.values(connections).forEach((conn) => {
      conn.classList.remove("active", "animating");
    });
    nodes.input.querySelector(".node-status").innerText = "Waiting...";
    resultSection.classList.add("hidden");
    resultSection.style.position = "absolute";
  }

  // Helper for async timeouts
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // Run Diagram Animation Sequence
  async function runDiagramAnimation(videoId) {
    resetDiagram();
    resultSection.style.position = "absolute";

    // Step 1: Input
    nodes.input.classList.add("active");
    nodes.input.querySelector(".node-status").innerText = "Received";
    await sleep(400);

    // Conn 1 Animating
    connections.conn1.classList.add("animating");
    connections.conn1.classList.add("active");
    await sleep(800);

    // Step 2: Extract
    nodes.process.classList.add("active");
    nodes.process.querySelector(".node-status").innerText = `ID: ${videoId}`;
    await sleep(400);

    // Conn 2 Animating
    connections.conn2.classList.add("animating");
    connections.conn2.classList.add("active");
    await sleep(800);

    // Step 3: Fetch Server
    nodes.server.classList.add("active");
    nodes.server.querySelector(".node-status").innerText = "Fetching...";
    await sleep(400);

    // Pre-load image while animating
    const maxResUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    const hqUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

    // Conn 3 Animating
    connections.conn3.classList.add("animating");
    connections.conn3.classList.add("active");
    await sleep(800);

    // Step 4: Output Ready
    nodes.server.classList.add("success");
    nodes.server.classList.remove("active");
    nodes.server.querySelector(".node-status").innerText = "Fetched";

    nodes.output.classList.add("success");
    nodes.output.querySelector(".node-status").innerText = "Done";

    // Show result
    currentVideoId = videoId;
    currentImgUrl = maxResUrl;
    thumbnailImg.src = maxResUrl;
    videoIdDisplay.innerText = videoId;

    // Fallback to hqdefault if maxres doesn't exist
    thumbnailImg.onload = function () {
      if (this.naturalWidth <= 120) {
        this.src = hqUrl;
        currentImgUrl = hqUrl;
        document.querySelector(".quality-badge").innerText =
          "High Quality (480x360)";
      } else {
        document.querySelector(".quality-badge").innerText =
          "Max Resolution (1280x720)";
      }
    };

    resultSection.style.position = "relative";
    resultSection.classList.remove("hidden");

    // Scroll to result smoothly
    setTimeout(() => {
      resultSection.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  }

  function extractThumbnail() {
    const url = urlInput.value.trim();
    if (!url) {
      showError("Please enter a YouTube URL");
      return;
    }

    const match = url.match(ytRegex);
    if (match && match[1]) {
      const videoId = match[1];
      hideError();
      fetchBtn.disabled = true;
      fetchBtn.innerHTML = `<span>Processing...</span><i class="ph-bold ph-spinner ph-spin"></i>`;

      runDiagramAnimation(videoId).then(() => {
        fetchBtn.disabled = false;
        fetchBtn.innerHTML = `<span>Extract</span><i class="ph-bold ph-arrow-right"></i>`;
      });
    } else {
      showError("Invalid YouTube URL. Please check and try again.");
    }
  }

  function showError(msg) {
    errorMsg.innerText = msg;
    errorMsg.classList.add("visible");
  }

  function hideError() {
    errorMsg.classList.remove("visible");
  }

  fetchBtn.addEventListener("click", extractThumbnail);

  urlInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      extractThumbnail();
    }
  });

  // Handle Download
  downloadBtn.addEventListener("click", async () => {
    if (!currentImgUrl) return;

    try {
      downloadBtn.disabled = true;
      const originalText = downloadBtn.innerHTML;
      downloadBtn.innerHTML = `<i class="ph-bold ph-spinner ph-spin"></i> Downloading...`;

      const response = await fetch(currentImgUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `thumbfetch-${currentVideoId}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      URL.revokeObjectURL(blobUrl);

      downloadBtn.innerHTML = `<i class="ph-bold ph-check"></i> Success`;
      setTimeout(() => {
        downloadBtn.disabled = false;
        downloadBtn.innerHTML = originalText;
      }, 2000);
    } catch (err) {
      console.error("Download failed", err);
      window.open(currentImgUrl, "_blank");
      downloadBtn.disabled = false;
      downloadBtn.innerHTML = `<i class="ph-bold ph-download-simple"></i> Download HD`;
    }
  });
});
