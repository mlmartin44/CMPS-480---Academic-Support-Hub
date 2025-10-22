// resources.js

let BASE_URL = localStorage.getItem("apiBaseUrl") || "http://localhost:5000";

// Save API base URL
document.getElementById("saveBaseUrl").addEventListener("click", () => {
  const url = document.getElementById("apiBaseUrl").value.trim();
  if (url) {
    BASE_URL = url;
    localStorage.setItem("apiBaseUrl", url);
    document.getElementById("apiStatus").textContent = "Saved!";
  }
});

// Load resources
document.getElementById("btnLoadResources").addEventListener("click", async () => {
  const course = document.getElementById("filterCourse").value.trim();
  const tag = document.getElementById("filterTag").value.trim();
  const status = document.getElementById("viewStatus");
  const list = document.getElementById("resourceList");
  status.textContent = "Loading...";
  list.innerHTML = "";

  try {
    const params = new URLSearchParams();
    if (course) params.append("course", course);
    if (tag) params.append("tag", tag);

    const res = await fetch(`${BASE_URL}/api/resources?${params.toString()}`);
    const data = await res.json();

    if (!data.length) {
      list.innerHTML = "<li>No resources found.</li>";
    } else {
      data.forEach(r => {
        const li = document.createElement("li");
        li.innerHTML = `
          <strong>${r.title}</strong>
          <div>Course: ${r.course}</div>
          <div>Tags: ${(r.tags || []).join(", ")}</div>
          <div>Uploaded by: ${r.uploadedBy}</div>
        `;
        list.appendChild(li);
      });
    }
    status.textContent = "Loaded";
  } catch (err) {
    status.textContent = "Error loading resources";
  }
});

// Upload resource
document.getElementById("uploadForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const status = document.getElementById("uploadStatus");
  status.textContent = "Uploading...";

  const body = {
    title: form.title.value.trim(),
    course: form.course.value.trim(),
    tags: form.tags.value.split(",").map(t => t.trim()).filter(Boolean),
    uploadedBy: form.uploadedBy.value.trim(),
  };

  try {
    const res = await fetch(`${BASE_URL}/api/resources`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error("Failed to upload");

    const newResource = await res.json();
    status.textContent = "Uploaded!";
    form.reset();

    // Refresh list automatically
    document.getElementById("btnLoadResources").click();
  } catch (err) {
    status.textContent = "Upload failed";
  }
});
