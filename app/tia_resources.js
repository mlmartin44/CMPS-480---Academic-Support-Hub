// resources.js — Week 4: simulate API interaction

// Hard-coded "database" of resources
let resourcesDB = [
  {
    _id: "res_001",
    title: "Graph Theory Notes",
    course: "CMPS262",
    tags: ["graphs", "exam prep"],
    uploadedBy: "student1"
  },
  {
    _id: "res_002",
    title: "Discrete Math Notes",
    course: "CMPS162",
    tags: ["logic"],
    uploadedBy: "student2"
  }
];

// Load resources (simulated)
document.getElementById("btnLoadResources").addEventListener("click", () => {
  const course = document.getElementById("filterCourse").value.trim().toLowerCase();
  const tag = document.getElementById("filterTag").value.trim().toLowerCase();
  const status = document.getElementById("viewStatus");
  const list = document.getElementById("resourceList");
  list.innerHTML = "";
  status.textContent = "Loading...";

  // Simulate async API delay
  setTimeout(() => {
    let results = resourcesDB;

    if (course) {
      results = results.filter(r => r.course.toLowerCase().includes(course));
    }
    if (tag) {
      results = results.filter(r => (r.tags || []).some(t => t.toLowerCase() === tag));
    }

    if (!results.length) {
      list.innerHTML = "<li>No resources found.</li>";
    } else {
      results.forEach(r => {
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
  }, 300); // simulate network delay
});

// Upload resource (simulated)
document.getElementById("uploadForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const form = e.target;
  const status = document.getElementById("uploadStatus");
  status.textContent = "Uploading...";

  // Simulate async server response
  setTimeout(() => {
    const newResource = {
      _id: `res_${(resourcesDB.length + 1).toString().padStart(3, "0")}`,
      title: form.title.value.trim(),
      course: form.course.value.trim(),
      tags: form.tags.value.split(",").map(t => t.trim()).filter(Boolean),
      uploadedBy: form.uploadedBy.value.trim()
    };

    resourcesDB.push(newResource);
    status.textContent = "Uploaded!";
    form.reset();

    // Refresh list automatically
    document.getElementById("btnLoadResources").click();
  }, 300);
});
