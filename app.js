// ===== UPDATED APP.JS FOR ONLINE USE (Render + Vercel Compatible) =====

let lastHighlighted = null;

// Highlight selected text
const highlightBtn = document.getElementById("highlight-btn");
highlightBtn.addEventListener("click", () => {
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

// Show URL input popup
let activeHighlight = null;
document.getElementById("link-btn").addEventListener("click", () => {
  if (!lastHighlighted) {
    alert("⚠️ Please highlight an entity first using the Highlight button!");
    return;
  }
  activeHighlight = lastHighlighted;
  document.getElementById("link-input").style.display = "block";
});

// Insert Link
const insertLink = document.getElementById("insert-link");
insertLink.addEventListener("click", () => {
  const url = document.getElementById("link-url").value;
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

// Save Button functionality
document.getElementById("save-btn").addEventListener("click", () => {
  const poiDescription = document.getElementById("poi-description-area").innerText.trim();

  const combinedEntities = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(
    document.getElementById("poi-description-area").innerHTML,
    "text/html"
  );
  const highlightedElements = doc.querySelectorAll(".highlighted");

  highlightedElements.forEach((element) => {
    const link = element.querySelector("a");
    combinedEntities.push({
      entity: link ? link.textContent.trim() : element.textContent.trim(),
      url: link ? link.href : null,
    });
  });

  fetch("https://repo-backend-epjh.onrender.com/save-poi", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      description: poiDescription,
      highlightedData: combinedEntities,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      alert("✅ POI saved successfully!");
      document.getElementById("poi-description-area").innerHTML = "";
      lastHighlighted = null;
    })
    .catch((error) => console.error("Error:", error));
});

// Fetch all saved POIs
document.getElementById("fetch-btn").addEventListener("click", function () {
  fetch("https://repo-backend-epjh.onrender.com/get-pois")
    .then((res) => {
      if (!res.ok) {
        throw new Error("Fetch failed");
      }
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
