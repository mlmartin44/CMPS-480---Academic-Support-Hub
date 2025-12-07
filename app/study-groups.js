// app/study-groups.js
(function () {
  // Elements
  const btnLoadGroups   = document.getElementById('btnLoadGroups');
  const filterCourse    = document.getElementById('filterCourse');
  const searchGroupName = document.getElementById('searchGroupName');
  const groupsList      = document.getElementById('groupsList');
  const viewStatus      = document.getElementById('viewStatus');

  const createForm      = document.getElementById('createForm');
  const createStatus    = document.getElementById('createStatus');

  const joinForm        = document.getElementById('joinForm');
  const joinGroupSelect = document.getElementById('joinGroupSelect');
  const joinNameInput   = document.getElementById('joinName');
  const joinGroupDetails= document.getElementById('joinGroupDetails');
  const joinStatus      = document.getElementById('joinStatus');

  let allGroups = []; // all groups from API

  const esc = (s = '') =>
    s.toString().replace(/[&<>"]/g, c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
    }[c]));

  // ---------- RENDER HELPERS ----------

  function buildCourseOptions(groups) {
    const seen = new Set();
    filterCourse.innerHTML = '<option value="">All courses</option>';

    groups.forEach(g => {
      const course = g.CourseName || g.course || '';
      if (course && !seen.has(course)) {
        seen.add(course);
        const opt = document.createElement('option');
        opt.value = course;
        opt.textContent = course;
        filterCourse.appendChild(opt);
      }
    });
  }

  function renderGroups(groups) {
    groupsList.innerHTML = '';

    if (!groups.length) {
      viewStatus.textContent = 'No groups found.';
      viewStatus.className = 'status';
      return;
    }

    const frag = document.createDocumentFragment();

    groups.forEach(g => {
      const id          = g.GroupID ?? g.id ?? 'unknown';
      const name        = g.GroupName ?? g.title ?? '(No name)';
      const course      = g.CourseName ?? g.course ?? '(No course)';
      const memberCount = g.MemberCount ?? g.member_count ?? 0;

      const li = document.createElement('li');
      li.className = 'list-item';
      li.innerHTML = `
        <strong>${esc(course)} — ${esc(name)}</strong>
        <div>ID: <code>${esc(id)}</code></div>
        <div>Members: ${esc(memberCount)}</div>
      `;
      frag.appendChild(li);
    });

    groupsList.appendChild(frag);
    viewStatus.textContent = '';
    viewStatus.className = 'status';
  }

  function buildJoinDropdown(groups) {
    joinGroupSelect.innerHTML = '';

    if (!groups.length) {
      const opt = new Option('No groups for this course yet', '');
      opt.disabled = true;
      opt.selected = true;
      joinGroupSelect.appendChild(opt);
      joinGroupDetails.textContent = '';
      return;
    }

    const placeholder = new Option('Select a study group', '');
    placeholder.disabled = true;
    placeholder.selected = true;
    joinGroupSelect.appendChild(placeholder);

    groups.forEach(g => {
      const id     = g.GroupID ?? g.id;
      const name   = g.GroupName ?? g.title ?? '(No name)';
      const course = g.CourseName ?? g.course ?? '';
      const members= g.MemberCount ?? g.member_count ?? 0;

      const label = course ? `${course} — ${name} (${members} members)` : name;
      const opt   = new Option(label, id);
      joinGroupSelect.appendChild(opt);
    });

    joinGroupDetails.textContent = '';
  }

  function applyFilters() {
    const selectedCourse = (filterCourse.value || '').trim().toLowerCase();
    const searchTerm     = (searchGroupName.value || '').trim().toLowerCase();

    let filtered = allGroups.slice();

    if (selectedCourse) {
      filtered = filtered.filter(g => {
        const course = (g.CourseName || g.course || '').toLowerCase();
        return course === selectedCourse;
      });
    }

    if (searchTerm) {
      filtered = filtered.filter(g => {
        const name = (g.GroupName || g.title || '').toLowerCase();
        return name.includes(searchTerm);
      });
    }

    renderGroups(filtered);
    // IMPORTANT: join dropdown only shows groups that match filter
    buildJoinDropdown(filtered);
  }

  function updateJoinDetails() {
    const selectedId = joinGroupSelect.value;
    if (!selectedId) {
      joinGroupDetails.textContent = '';
      return;
    }

    const group = allGroups.find(
      g => String(g.GroupID ?? g.id) === String(selectedId)
    );
    if (!group) {
      joinGroupDetails.textContent = '';
      return;
    }

    const name        = group.GroupName ?? group.title ?? '(No name)';
    const course      = group.CourseName ?? group.course ?? '(No course)';
    const memberCount = group.MemberCount ?? group.member_count ?? 0;

    joinGroupDetails.textContent =
      `You are about to join: ${course} — ${name} (${memberCount} current members).`;
  }

  // ---------- LOAD + EVENTS ----------

  async function loadGroups() {
    viewStatus.textContent = 'Loading groups...';
    viewStatus.className = 'status';
    groupsList.innerHTML = '';
    joinGroupSelect.innerHTML = '';
    joinGroupDetails.textContent = '';

    try {
      const groups = await API.StudyGroups.list({});
      allGroups = Array.isArray(groups) ? groups : [];
      buildCourseOptions(allGroups);
      applyFilters();
    } catch (e) {
      console.error(e);
      viewStatus.textContent = e.message || 'Failed to load groups.';
      viewStatus.className = 'status error';
      buildJoinDropdown([]);
    }
  }

  btnLoadGroups?.addEventListener('click', loadGroups);
  filterCourse?.addEventListener('change', applyFilters);
  searchGroupName?.addEventListener('input', applyFilters);
  joinGroupSelect?.addEventListener('change', updateJoinDetails);

  document.addEventListener('DOMContentLoaded', () => {
    loadGroups();
  });

  // Create new group
  createForm?.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    createStatus.textContent = 'Creating...';
    createStatus.className = 'status';

    const form = new FormData(createForm);
    const payload = {
      course: (form.get('course') || '').trim(),
      title:  (form.get('title')  || '').trim()
    };

    if (!payload.course || !payload.title) {
      createStatus.textContent = 'Please enter both course and group title.';
      createStatus.className = 'status error';
      return;
    }

    try {
      const data = await API.StudyGroups.create(payload);
      createStatus.textContent = 'Created! Group ID: ' + (data.GroupID || data.id || 'unknown');
      createStatus.className = 'status success';
      createForm.reset();
      // reload so new group appears in list + dropdown
      loadGroups();
    } catch (e) {
      console.error(e);
      createStatus.textContent = e.message || 'Failed to create group.';
      createStatus.className = 'status error';
    }
  });

  // Join selected group
  joinForm?.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    joinStatus.textContent = 'Joining...';
    joinStatus.className = 'status';

    const groupId = joinGroupSelect.value;
    const name    = (joinNameInput.value || '').trim();

    if (!groupId || !name) {
      joinStatus.textContent = 'Please select a group and enter your name.';
      joinStatus.className = 'status error';
      return;
    }

    try {
      await API.StudyGroups.join(groupId, name);
      joinStatus.textContent = 'Joined successfully!';
      joinStatus.className = 'status success';
    } catch (e) {
      console.error(e);
      joinStatus.textContent = e.message || 'Failed to join group.';
      joinStatus.className = 'status error';
    }
  });
})();
