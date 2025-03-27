const API_BASE = "https://repo-backend-epjh.onrender.com";

let lastHighlighted = null;

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
  const username = localStorage.getItem("username");

  if (!poiDescription) {
    alert("⚠️ Please enter a POI description before saving.");
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
    })
    .catch((error) => {
      console.error("Save error:", error);
      alert("❌ Failed to save POI.");
    });
});

// ===== Fetch All POIs =====
document.getElementById("fetch-btn").addEventListener("click", () => {
  const username = localStorage.getItem("username");

  fetch(`${API_BASE}/get-pois`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username })
  })
    .then((res) => {
      if (!res.ok) throw new Error("Fetch failed");
      return res.json();
    })
    .then((data) => {
      const resultArea = document.getElementById("output-area");
      resultArea.innerHTML = "";

      if (!data.length) {
        resultArea.innerHTML = "<p>No POIs found.</p>";
        return;
      }

      data.forEach((poi, index) => {
        const div = document.createElement("div");
        div.style.marginBottom = "15px";
        div.innerHTML = `
          <h3>POI ${index + 1}</h3>
          <p><strong>Description:</strong> ${poi.description}</p>
          <ul>
            ${poi.highlightedData
              .map(
                (item) => `
              <li><strong>Entity:</strong> ${item.entity} <br> <strong>URL:</strong> <a href="${item.url}" target="_blank">${item.url}</a></li>
            `
              )
              .join("")}
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
      })
      .catch((err) => {
        console.error("Clear error:", err);
        alert("❌ Failed to delete POIs.");
      });
  }
});