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

// ===== Save POI (Update current POI) =====
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

  if (combinedEntities.length > 0) {
    highlightedPOIIndices.add(currentIndex);
  }

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
      alert("✅ POI updated successfully!");
      userPOIs[currentIndex].description = poiDescription;
      userPOIs[currentIndex].highlightedData = combinedEntities;
      updateProgressUI();
    })
    .catch((error) => {
      console.error("Update error:", error);
      alert("❌ Failed to update POI.");
    });
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

// ===== Load Current POI =====
function loadCurrentPOI() {
  const poi = userPOIs[currentIndex];
  document.getElementById("poi-description-area").innerHTML = poi.description;
  updateProgressUI();
}

// ===== Extract title for POI from its description =====
function extractTitle(description) {
  const match = description.split(" - ")[0].trim();
  return match.length > 50 ? match.slice(0, 50) + "..." : match;
}

// ===== Update POI Progress UI with Titles =====
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
// ✨ Unhighlight Entity on Click
document.getElementById("poi-description-area").addEventListener("click", (event) => {
  const target = event.target;
  if (target.tagName === "SPAN" && target.classList.contains("highlighted")) {
    if (confirm("Do you want to remove this highlight?")) {
      const textNode = document.createTextNode(target.innerText);
      target.parentNode.replaceChild(textNode, target);
    }
  }
});

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
