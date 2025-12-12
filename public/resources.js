let BASE_URL = " ";

/* ===========================
   Load Resources
=========================== */
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

    const res = await fetch(`${BASE_URL}/api/material?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to load");

    const data = await res.json();

    if (!data.length) {
      list.innerHTML = "<li>No resources found.</li>";
    } else {
      data.forEach(r => {
        const li = document.createElement("li");

        const uploader =
          r.UploaderName && r.UploaderName.trim()
            ? r.UploaderName
            : (r.UploadedBy ? `User #${r.UploadedBy}` : "Unknown");

        let linkHtml = "";
        if (r.FilePath) {
          const isExternal = r.FilePath.startsWith("http://") || r.FilePath.startsWith("https://");
          const label = isExternal ? "Open Link" : "Download File";
          linkHtml = `<div><a href="${r.FilePath}" target="_blank">${label}</a></div>`;
        }

        li.innerHTML = `
          <strong>${r.Title}</strong>
          <div>Course: ${r.CourseID || "N/A"}</div>
          <div>Tags: ${r.Tags || ""}</div>
          <div>Uploaded by: ${uploader}</div>
          ${linkHtml}
        `;

        list.appendChild(li);
      });
    }

    status.textContent = "Loaded";
  } catch (err) {
    console.error(err);
    status.textContent = "Error loading resources";
  }
});

/* ===========================
   Upload Resource
=========================== */
document.getElementById("uploadForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const form = e.target;
  const status = document.getElementById("uploadStatus");
  status.textContent = "Uploading...";

  const formData = new FormData();
  formData.append("title", form.title.value.trim());
  formData.append("courseID", form.course.value.trim());
  formData.append("tags", form.tags.value.trim());
  formData.append("firstName", form.firstName.value.trim());
  formData.append("lastName", form.lastName.value.trim());
  formData.append("email", form.email.value.trim());

  const fileInput = form.querySelector('input[name="file"]');
  const linkInput = form.querySelector('input[name="linkUrl"]');

  const hasFile = fileInput && fileInput.files.length > 0;
  const hasLink = linkInput && linkInput.value.trim().length > 0;

  // Must have file or link
  if (!hasFile && !hasLink) {
    status.textContent = "Please select a file or enter a link.";
    return;
  }

  if (hasFile) {
    formData.append("file", fileInput.files[0]);
  }
  if (hasLink) {
    formData.append("linkUrl", linkInput.value.trim());
  }

  try {
    const res = await fetch(`${BASE_URL}/api/material/upload`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      console.error("Upload failed:", await res.text());
      throw new Error("Failed to upload");
    }

    status.textContent = "Uploaded!";
    form.reset();
    document.getElementById("btnLoadResources").click();
  } catch (err) {
    console.error(err);
    status.textContent = "Upload failed";
  }
});

