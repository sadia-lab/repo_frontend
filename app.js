const API_BASE = "https://repo-backend-epjh.onrender.com";

let lastHighlighted = null;
let userPOIs = [];
let currentIndex = 0;
const highlightedPOIIndices = new Set();

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
    saveCurrentPOI();
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
    saveCurrentPOI();
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
  saveCurrentPOI(true);
});

// ===== Next POI Button =====
document.getElementById("next-poi-btn").addEventListener("click", () => {
  if (userPOIs.length === 0) return;
  if (currentIndex < userPOIs.length - 1) {
    currentIndex++;
    loadCurrentPOI();
  } else {
    alert("🎉 You’ve completed all POIs!");
  }
});

// ===== Load Current POI with Highlight Reconstruction =====
function loadCurrentPOI() {
  const poi = userPOIs[currentIndex];
  const area = document.getElementById("poi-description-area");
  const rawText = poi.description || "";

  area.textContent = rawText; // Set plain text first

  // Apply highlights based on stored highlightedData
  if (poi.highlightedData && poi.highlightedData.length > 0) {
    poi.highlightedData.forEach(({ entity, url }) => {
      const html = area.innerHTML;
      const escapedEntity = entity.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedEntity, 'g');

      area.innerHTML = html.replace(regex, () => {
        const linkPart = url ? `<a href="${url}" target="_blank">${entity}</a>` : entity;
        return `<span class="highlighted" style="background-color:yellow;">${linkPart}</span>`;
      });
    });
  }

  parseAndRestoreHighlights();
  updateProgressUI();
}

// ===== Restore Highlight Interactions =====
function parseAndRestoreHighlights() {
  const area = document.getElementById("poi-description-area");
  const highlightedElements = area.querySelectorAll(".highlighted");

  highlightedElements.forEach(element => {
    element.addEventListener("click", () => {
      if (confirm("Do you want to remove this highlight and any link?")) {
        const plainText = element.innerText;
        const textNode = document.createTextNode(plainText);
        element.parentNode.replaceChild(textNode, element);
      }
    });

    const link = element.querySelector("a");
    if (link) {
      link.addEventListener("click", (event) => {
        event.stopPropagation();
        if (confirm("Do you want to remove the link and highlight?")) {
          const span = link.closest(".highlighted");
          const plainText = span.innerText;
          const textNode = document.createTextNode(plainText);
          span.parentNode.replaceChild(textNode, span);
        }
      });
    }
  });
}

// ===== Extract POI Title =====
function extractTitle(description) {
  const match = description.split(" - ")[0].trim();
  return match.length > 50 ? match.slice(0, 50) + "..." : match;
}

// ===== Update POI Progress Bar =====
function updateProgressUI() {
  const progressBar = document.getElementById("poi-progress");
  if (!progressBar) return;

  progressBar.innerHTML = "";

  userPOIs.forEach((poi, index) => {
    const step = document.createElement("div");
    step.className = "poi-step";
    step.textContent = extractTitle(poi.description);

    if (index === currentIndex) {
      step.classList.add("active");
    } else if (highlightedPOIIndices.has(index)) {
      step.style.backgroundColor = "yellow";
    }

    step.addEventListener("click", () => {
      currentIndex = index;
      loadCurrentPOI();
    });

    progressBar.appendChild(step);
  });
}

// ===== Save Current POI =====
function saveCurrentPOI(showAlert = false) {
  const area = document.getElementById("poi-description-area");
  const poiDescription = area.innerText.trim(); // Raw plain text only
  const username = localStorage.getItem("username")?.trim().toLowerCase();

  if (!poiDescription || !username) return;

  const combinedEntities = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(area.innerHTML, "text/html");
  const highlightedElements = doc.querySelectorAll(".highlighted");

  highlightedElements.forEach((element) => {
    const link = element.querySelector("a");
    combinedEntities.push({
      entity: link ? link.textContent.trim() : element.textContent.trim(),
      url: link ? link.href : null,
    });
  });

  highlightedPOIIndices.add(currentIndex);

  fetch(`${API_BASE}/update-poi`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username,
      poi_index: userPOIs[currentIndex].poiIndex,
      description: poiDescription,
      highlightedData: combinedEntities,
    }),
  })
    .then((res) => res.json())
    .then(() => {
      if (showAlert) alert("✅ POI updated successfully!");
      userPOIs[currentIndex].description = poiDescription;
      userPOIs[currentIndex].highlightedData = combinedEntities;
      updateProgressUI();
    })
    .catch((error) => {
      console.error("❌ Save failed:", error);
      if (showAlert) alert("❌ Failed to update POI.");
    });
}

// ===== Initial Load =====
window.addEventListener("DOMContentLoaded", () => {
  const username = localStorage.getItem("username")?.trim().toLowerCase();
  if (!username) return;

  fetch(`${API_BASE}/get-pois?username=${encodeURIComponent(username)}`)
    .then((res) => res.json())
    .then((data) => {
      if (!Array.isArray(data) || data.length === 0) {
        alert("No POIs found for user.");
        return;
      }

      userPOIs = data.sort((a, b) => a.poiIndex - b.poiIndex);

      userPOIs.forEach((poi, index) => {
        if (poi.highlightedData && poi.highlightedData.length > 0) {
          highlightedPOIIndices.add(index);
        }
      });

      currentIndex = 0;
      loadCurrentPOI();
    })
    .catch((err) => {
      console.error("Fetch error:", err);
      alert("❌ Error fetching POIs");
    });
});

// ===== Auto-Save Before Logout or Page Reload =====
window.addEventListener("beforeunload", (e) => {
  const area = document.getElementById("poi-description-area");
  const poiDescription = area.innerText.trim(); // Raw plain text only
  const username = localStorage.getItem("username")?.trim().toLowerCase();

  if (!poiDescription || !username) return;

  const combinedEntities = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(area.innerHTML, "text/html");
  const highlightedElements = doc.querySelectorAll(".highlighted");

  highlightedElements.forEach((element) => {
    const link = element.querySelector("a");
    combinedEntities.push({
      entity: link ? link.textContent.trim() : element.textContent.trim(),
      url: link ? link.href : null,
    });
  });

  const payload = JSON.stringify({
    username,
    poi_index: userPOIs[currentIndex].poiIndex,
    description: poiDescription,
    highlightedData: combinedEntities,
  });

  navigator.sendBeacon(`${API_BASE}/update-poi`, new Blob([payload], { type: 'application/json' }));

  e.preventDefault();
  e.returnValue = '';
});
