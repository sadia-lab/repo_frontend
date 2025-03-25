// Protect against broken fetch-btn
document.addEventListener("DOMContentLoaded", () => {
    const saveBtn = document.getElementById("save-btn");
    const highlightBtn = document.getElementById("highlight-btn");
    const boldBtn = document.getElementById("bold-btn");
    const italicBtn = document.getElementById("italic-btn");
    const underlineBtn = document.getElementById("underline-btn");
    const colorBtn = document.getElementById("color-btn");
    const linkBtn = document.getElementById("link-btn");
    const linkInput = document.getElementById("link-input");
    const insertLinkBtn = document.getElementById("insert-link");
    const cancelLinkBtn = document.getElementById("cancel-link");
    const descriptionArea = document.getElementById("poi-description-area");
  
    let lastHighlighted = null;
  
    // Apply highlight
    highlightBtn.addEventListener("click", () => {
      document.execCommand("backColor", false, "yellow");
      lastHighlighted = window.getSelection().toString();
    });
  
    // Text formatting
    boldBtn.addEventListener("click", () => document.execCommand("bold"));
    italicBtn.addEventListener("click", () => document.execCommand("italic"));
    underlineBtn.addEventListener("click", () => document.execCommand("underline"));
    colorBtn.addEventListener("click", () => {
      const color = prompt("Enter a text color (e.g. red or #ff0000):");
      if (color) document.execCommand("foreColor", false, color);
    });
  
    // Insert Link
    linkBtn.addEventListener("click", () => {
      linkInput.style.display = "block";
    });
  
    insertLinkBtn.addEventListener("click", () => {
      const url = document.getElementById("link-url").value.trim();
      const selectedText = window.getSelection().toString();
  
      if (url && selectedText) {
        document.execCommand("insertHTML", false, `<a href="${url}" target="_blank">${selectedText}</a>`);
      }
  
      linkInput.style.display = "none";
      document.getElementById("link-url").value = "";
    });
  
    cancelLinkBtn.addEventListener("click", () => {
      linkInput.style.display = "none";
      document.getElementById("link-url").value = "";
    });
  
    // Save POI Description
    saveBtn.addEventListener("click", () => {
      const description = descriptionArea.innerHTML;
  
      // Dummy highlighted data — replace with real entity detection logic if needed
      const highlightedData = [];
      const links = descriptionArea.querySelectorAll("a");
  
      links.forEach(link => {
        highlightedData.push({
          entity: link.innerText,
          url: link.getAttribute("href")
        });
      });
  
      fetch("https://repo-backend-epjh.onrender.com/save-poi", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ description, highlightedData })
      })
        .then(res => res.json())
        .then(data => {
          alert("✅ POI saved successfully!");
        })
        .catch(err => {
          console.error("Save error:", err);
          alert("❌ Failed to save POI.");
        });
    });
  
    // Optional: View saved POIs (if fetch-btn exists)
    const fetchBtn = document.getElementById("fetch-btn");
    if (fetchBtn) {
      fetchBtn.addEventListener("click", () => {
        fetch("https://repo-backend-epjh.onrender.com/get-pois")
          .then(res => res.json())
          .then(data => {
            const output = document.getElementById("output-area");
            output.innerHTML = "";
  
            if (!data.length) {
              output.innerHTML = "<p>No POIs found.</p>";
              return;
            }
  
            data.forEach(poi => {
              const div = document.createElement("div");
              div.innerHTML = `<p><strong>Description:</strong> ${poi.description}</p>`;
              output.appendChild(div);
            });
          })
          .catch(err => {
            console.error("Fetch error:", err);
            alert("❌ Could not load POIs.");
          });
      });
    }
  });
  