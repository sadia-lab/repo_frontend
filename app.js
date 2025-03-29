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
  const poiElement = document.getElementById("poi-description-area");
  const poiDescription = poiElement.innerHTML.trim();
  const plainText = poiElement.innerText.trim();
  const username = localStorage.getItem("username");

  if (!plainText || plainText === "Enter your POI description here..." || !username) {
    alert("⚠️ Please enter a valid POI description before saving.");
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

  fetch(`${API_BASE}/save-poi`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username,
      description: poiDescription,
      highlightedData: combinedEntities,
    }),
  })
    .then((res) => res.json())
    .then(() => {
      alert("✅ POI saved successfully!");
      document.getElementById("poi-description-area").innerHTML = "";
      lastHighlighted = null;
      fetchUserPOIs(); // refresh the list after save
    })
    .catch((error) => {
      console.error("Save error:", error);
      alert("❌ Failed to save POI.");
    });
});

// ===== Clear All POIs =====
document.getElementById("clear-pois-btn").addEventListener("click", () => {
  if (confirm("Are you sure you want to delete ALL saved POIs?")) {
    fetch(`${API_BASE}/clear-pois`, {
      method: "DELETE",
    })
      .then((res) => res.json())
      .then(() => {
        alert("🗑️ All POIs have been deleted.");
        document.getElementById("output-area").innerHTML = "";
        document.getElementById("poi-description-area").innerHTML = "";
      })
      .catch((err) => {
        console.error("Clear error:", err);
        alert("❌ Failed to delete POIs.");
      });
  }
});

// ===== View Saved POIs =====
document.getElementById("fetch-btn").addEventListener("click", fetchUserPOIs);

// ===== Auto-Fetch POIs on Page Load =====
window.addEventListener("DOMContentLoaded", fetchUserPOIs);

// ===== Next POI Button Logic =====
document.getElementById("next-poi-btn").addEventListener("click", () => {
  if (userPOIs.length === 0) return;

  currentIndex = (currentIndex + 1) % userPOIs.length;
  const currentPOI = userPOIs[currentIndex];

  document.getElementById("poi-description-area").innerHTML = currentPOI.description;
  document.getElementById("poi-description-area").scrollIntoView({ behavior: "smooth" });
});

// ===== Prevent Saving Placeholder Text =====
document.getElementById("poi-description-area").addEventListener("focus", () => {
  const el = document.getElementById("poi-description-area");
  if (el.innerText.trim() === "Enter your POI description here...") {
    el.innerHTML = "";
  }
});

// ===== Fetch POIs for Current User =====
function fetchUserPOIs() {
  const username = localStorage.getItem("username");
  if (!username) return;

  fetch(`${API_BASE}/get-pois?username=${encodeURIComponent(username)}`)
    .then((res) => res.json())
    .then((data) => {
      const resultArea = document.getElementById("output-area");
      resultArea.innerHTML = "";

      if (!data.length) {
        resultArea.innerHTML = "<p>No POIs found.</p>";
        return;
      }

      userPOIs = data;
      currentIndex = 0;

      // Auto-fill first POI
      document.getElementById("poi-description-area").innerHTML = userPOIs[0].description;

      userPOIs.forEach((poi, index) => {
        const div = document.createElement("div");
        div.style.marginBottom = "15px";
        div.innerHTML = `
          <h3>POI ${index + 1}</h3>
          <p><strong>Description:</strong> ${poi.description}</p>
          <ul>
            ${poi.highlightedData.map(item => `
              <li><strong>Entity:</strong> ${item.entity}<br><strong>URL:</strong> <a href="${item.url}" target="_blank">${item.url}</a></li>
            `).join("")}
          </ul>
        `;
        resultArea.appendChild(div);
      });
    })
    .catch((err) => {
      const resultArea = document.getElementById("output-area");
      resultArea.innerHTML = "<p style='color: red;'>Error fetching POIs!</p>";
      console.error("Fetch error:", err);
    });
}
