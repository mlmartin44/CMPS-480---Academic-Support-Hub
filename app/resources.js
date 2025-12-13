// app/resources.js
(function () {
  const btnLoadResources   = document.getElementById("btnLoadResources");
  const filterCourseSelect = document.getElementById("filterCourseSelect");
  const searchText         = document.getElementById("searchText");
  const resourcesList      = document.getElementById("resourcesList");
  const viewStatus         = document.getElementById("viewStatus");
  const uploadForm         = document.getElementById("uploadForm");
  const uploadStatus       = document.getElementById("uploadStatus");

  let allResources = [];

  const esc = (s = "") =>
    s.toString().replace(/[&<>"]/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
    }[c]));

  function buildCourseOptions(resources) {
    const seen = new Set();
    filterCourseSelect.innerHTML = '<option value="">All courses</option>';

    resources.forEach((r) => {
      const course = r.CourseName || r.course || "";
      if (course && !seen.has(course)) {
        seen.add(course);
        const opt = document.createElement("option");
        opt.value = course;
        opt.textContent = course;
        filterCourseSelect.appendChild(opt);
      }
    });
  }

  function renderResources(resources) {
    resourcesList.innerHTML = "";

    if (!resources.length) {
      viewStatus.textContent = "No resources found.";
      viewStatus.className = "status";
      return;
    }

    const frag = document.createDocumentFragment();

    resources.forEach((r) => {
      const title = r.Title ?? "(Untitled resource)";
      const file  = r.FilePath ?? "";
      const tags  = r.Tags ?? "";
      const course = r.CourseName ?? "(No course)";
      const uploader =
        (r.UploadedFirstName || "") +
        (r.UploadedLastName ? " " + r.UploadedLastName : "");

      const li = document.createElement("li");
      li.className = "list-item resource-item";
      li.innerHTML = `
        <div class="resource-main">
          <h3 class="resource-title">${esc(title)}</h3>
          <div class="resource-meta">
            <span class="resource-course">${esc(course)}</span>
            ${uploader ? `<span class="resource-uploader">Shared by ${esc(uploader)}</span>` : ""}
          </div>
        </div>
        <div class="resource-link">
          ${file ? `<a href="${esc(file)}" target="_blank" rel="noopener">Open resource</a>` : ""}
        </div>
        <div class="resource-tags">
          ${
            tags
              ? tags
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean)
                  .map((t) => `<span class="tag-pill">${esc(t)}</span>`)
                  .join("")
              : ""
          }
        </div>
      `;
      frag.appendChild(li);
    });

    resourcesList.appendChild(frag);
    viewStatus.textContent = "";
    viewStatus.className = "status";
  }

  function applyFilters() {
    const selectedCourse = (filterCourseSelect.value || "").trim().toLowerCase();
    const search = (searchText.value || "").trim().toLowerCase();

    let filtered = allResources.slice();

    if (selectedCourse) {
      filtered = filtered.filter((r) => (r.CourseName || "").toLowerCase() === selectedCourse);
    }

    if (search) {
      filtered = filtered.filter((r) => {
        const title = (r.Title || "").toLowerCase();
        const tags  = (r.Tags || "").toLowerCase();
        const course= (r.CourseName || "").toLowerCase();
        return title.includes(search) || tags.includes(search) || course.includes(search);
      });
    }

    renderResources(filtered);
  }

  async function loadResources() {
    viewStatus.textContent = "Loading resources...";
    viewStatus.className = "status";
    resourcesList.innerHTML = "";

    try {
      const resources = await API.Resources.list({});
      allResources = Array.isArray(resources) ? resources : [];
      buildCourseOptions(allResources);
      applyFilters();
    } catch (e) {
      console.error(e);
      viewStatus.textContent = e.message || "Failed to load resources.";
      viewStatus.className = "status error";
    }
  }

  btnLoadResources?.addEventListener("click", loadResources);
  filterCourseSelect?.addEventListener("change", applyFilters);
  searchText?.addEventListener("input", applyFilters);

  document.addEventListener("DOMContentLoaded", loadResources);

  uploadForm?.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    uploadStatus.textContent = "Posting...";
    uploadStatus.className = "status";

    const form = new FormData(uploadForm);
    const payload = {
      course:       (form.get("course") || "").trim(),
      title:        (form.get("title") || "").trim(),
      fileUrl:      (form.get("fileUrl") || "").trim(),
      tags:         (form.get("tags") || "").trim(),
      uploaderName: (form.get("uploaderName") || "").trim(),
    };

    if (!payload.course || !payload.title || !payload.fileUrl || !payload.uploaderName) {
      uploadStatus.textContent = "Please fill in course, title, link, and your name.";
      uploadStatus.className = "status error";
      return;
    }

    try {
      await API.Resources.create(payload);
      uploadStatus.textContent = "Resource posted!";
      uploadStatus.className = "status success";
      uploadForm.reset();
      loadResources();
    } catch (e) {
      console.error(e);
      uploadStatus.textContent = e.message || "Failed to post resource.";
      uploadStatus.className = "status error";
    }
  });
})();
