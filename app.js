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
  
    // ✅ Highlight text only (no link)
    highlightBtn.addEventListener("click", () => {
      document.execCommand("backColor", false, "yellow");
    });
  
    // ✅ Text formatting
    boldBtn.addEventListener("click", () => document.execCommand("bold"));
    italicBtn.addEventListener("click", () => document.execCommand("italic"));
    underlineBtn.addEventListener("click", () => document.execCommand("underline"));
    colorBtn.addEventListener("click", () => {
      const color = prompt("Enter a text color (e.g. red or #ff0000):");
      if (color) document.execCommand("foreColor", false, color);
    });
  
    // ✅ Manual Insert Link
    linkBtn.addEventListener("click", () => {
      linkInput.style.display = "block";
    });
  
    insertLinkBtn.addEventListener("click", () => {
      const url = document.getElementById("link-url").value.trim();
      const selection = window.getSelection();
  
      if (!url || !selection.rangeCount) return;
  
      const range = selection.getRangeAt(0);
      const selectedText = range.toString().trim();
  
      if (selectedText) {
        const a = document.createElement("a");
        a.href = url;
        a.target = "_blank";
        a.classList.add("custom-link"); // only user-added links get tracked
        a.textContent = selectedText;
  
        range.deleteContents();
        range.insertNode(a);
      }
  
      linkInput.style.display = "none";
      document.getElementById("link-url").value = "";
    });
  
    cancelLinkBtn.addEventListener("click", () => {
      linkInput.style.display = "none";
      document.getElementById("link-url").value = "";
    });
  
    // ✅ Save POI
    saveBtn.addEventListener("click", () => {
      const description = descriptionArea.innerHTML;
      const highlightedData = [];
  
      const temp = document.createElement("div");
      temp.innerHTML = description;
  
      const links = temp.querySelectorAll("a.custom-link");
      links.forEach((link) => {
        const entity = link.textContent?.trim();
        const url = link.getAttribute("href")?.trim();
        if (entity && url) {
          highlightedData.push({ entity, url });
        }
      });
  
      console.log("📦 Sending to backend:", { description, highlightedData });
  
      fetch("https://repo-backend-epjh.onrender.com/save-poi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, highlightedData }),
      })
        .then((res) => res.json())
        .then(() => alert("✅ POI saved successfully!"))
        .catch((err) => {
          console.error("Save error:", err);
          alert("❌ Failed to save POI.");
        });
    });
  
    // ✅ Fetch POIs
    const fetchBtn = document.getElementById("fetch-btn");
    if (fetchBtn) {
      fetchBtn.addEventListener("click", () => {
        fetch("https://repo-backend-epjh.onrender.com/get-pois")
          .then((res) => res.json())
          .then((data) => {
            const output = document.getElementById("output-area");
            output.innerHTML = "";
  
            if (!data.length) {
              output.innerHTML = "<p>No POIs found.</p>";
              return;
            }
  
            data.forEach((poi) => {
              const div = document.createElement("div");
              div.innerHTML = `<p><strong>Description:</strong> ${poi.description}</p>`;
              output.appendChild(div);
            });
          })
          .catch((err) => {
            console.error("Fetch error:", err);
            alert("❌ Could not load POIs.");
          });
      });
    }
  
    // ✅ Clear all POIs
    const clearBtn = document.getElementById("clear-pois-btn");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        if (confirm("Are you sure you want to delete ALL saved POIs?")) {
          fetch("https://repo-backend-epjh.onrender.com/clear-pois", {
            method: "DELETE",
          })
            .then((res) => res.json())
            .then(() => {
              alert("🗑️ All POIs have been deleted.");
              const output = document.getElementById("output-area");
              if (output) output.innerHTML = "";
            })
            .catch((err) => {
              console.error("Clear error:", err);
              alert("❌ Failed to delete POIs.");
            });
        }
      });
    }
  });
  