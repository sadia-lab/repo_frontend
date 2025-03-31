const API_BASE = "https://repo-backend-epjh.onrender.com";

let lastHighlighted = null;
let userPOIs = [];
let currentIndex = 0;

// ===== Highlight selected text =====
document.getElementById("highlight-btn").addEventListener("click", () => {
  const selection = window.getSelection();
  if (selection.rangeCount > 0 && selection.toString().trim() !== "") {
    const range = selection.getRangeAt(0);
    const span = document.createElement("span");
    span.classList.add("highlighted");
    span.style.backgroundColor = "yellow";
    span.textContent = selection.toString();
    range.deleteContents();
    range.insertNode(span);
    selection.removeAllRanges();
    lastHighlighted = span;
  }
});

// ===== Show link input popup =====
let activeHighlight = null;
document.getElementById("link-btn").addEventListener("click", () => {
  if (!lastHighlighted) {
    alert("⚠️ Please highlight text first!");
    return;
  }
  activeHighlight = lastHighlighted;
  document.getElementById("link-input").style.display = "block";
});

// ===== Insert Link =====
document.getElementById("insert-link").addEventListener("click", () => {
  const url = document.getElementById("link-url").value.trim();
  if (url && activeHighlight) {
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.textContent = activeHighlight.textContent;
    activeHighlight.innerHTML = "";
    activeHighlight.appendChild(link);
  }
  document.getElementById("link-input").style.display = "none";
  document.getElementById("link-url").value = "";
  activeHighlight = null;
});

document.getElementById("cancel-link").addEventListener("click", () => {
  document.getElementById("link-input").style.display = "none";
  document.getElementById("link-url").value = "";
  activeHighlight = null;
});

// ===== Save POI =====
document.getElementById("save-btn").addEventListener("click", () => {
  const poiDescription = document.getElementById("poi-description-area").innerHTML.trim();
  const username = localStorage.getItem("username")?.trim().toLowerCase();

  if (!poiDescription || !username) {
    alert("⚠️ Username or description missing.");
    return;
  }

  const combinedEntities = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(poiDescription, "text/html");
  const highlightedElements = doc.querySelectorAll(".highlighted");

  highlightedElements.forEach((element) => {
    const link = element.querySelector("a");
    combinedEntities.push({
      entity: link ? link.textContent.trim() : element.textContent.trim(),
      url: link ? link.href : null,
    });
  });

  fetch(`${API_BASE}/update-poi`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username,
      poi_index: currentIndex,
      description: poiDescription,
      highlightedData: combinedEntities,
    }),
  })
    .then((res) => res.json())
    .then(() => {
      alert("✅ POI updated successfully!");
      userPOIs[currentIndex] = {
        description: poiDescription,
        highlightedData: combinedEntities,
      };
      fetchUserPOIs();
    })
    .catch((error) => {
      console.error("Update error:", error);
      alert("❌ Failed to update POI.");
    });
});

// ===== Next POI =====
document.getElementById("next-poi-btn").addEventListener("click", () => {
  if (userPOIs.length === 0 || currentIndex >= userPOIs.length - 1) {
    alert("✅ You’ve completed all POIs!");
    return;
  }
  currentIndex++;
  renderCurrentPOI();
  updatePOIProgressUI();
});

// ===== Fetch POIs on Page Load =====
window.addEventListener("DOMContentLoaded", fetchUserPOIs);

function fetchUserPOIs() {
  const username = localStorage.getItem("username")?.trim().toLowerCase();
  if (!username) return;

  fetch(`${API_BASE}/get-pois?username=${encodeURIComponent(username)}`)
    .then((res) => res.json())
    .then((data) => {
      userPOIs = data || [];
      currentIndex = 0;
      renderCurrentPOI();
      updatePOIProgressUI();
    })
    .catch((err) => {
      console.error("Fetch error:", err);
      alert("❌ Failed to fetch POIs.");
    });
}

function renderCurrentPOI() {
  if (userPOIs[currentIndex]) {
    document.getElementById("poi-description-area").innerHTML = userPOIs[currentIndex].description;
  }
}

function updatePOIProgressUI() {
  const steps = document.querySelectorAll(".poi-step");
  steps.forEach((step, index) => {
    step.classList.toggle("active", index === currentIndex);
  });
}
