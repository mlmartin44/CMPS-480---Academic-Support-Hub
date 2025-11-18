// app/study-groups.js
(function () {
  // Elements
  const apiBaseUrlInput = document.getElementById('apiBaseUrl');
  const saveBaseUrlBtn  = document.getElementById('saveBaseUrl');
  const apiStatus       = document.getElementById('apiStatus');

  const btnLoadGroups = document.getElementById('btnLoadGroups');
  const searchCourse  = document.getElementById('searchCourse');
  const searchTag     = document.getElementById('searchTag'); // not used yet, but kept
  const groupsList    = document.getElementById('groupsList');
  const viewStatus    = document.getElementById('viewStatus');

  const createForm    = document.getElementById('createForm');
  const createStatus  = document.getElementById('createStatus');

  const joinForm      = document.getElementById('joinForm');
  const joinStatus    = document.getElementById('joinStatus');

  const esc = (s = '') =>
    s.toString().replace(/[&<>"]/g, c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;'
    }[c]));

  // Hydrate API field if previously saved
  try {
    apiBaseUrlInput.value = API.getApiBaseUrl();
  } catch (_) {}

  // Save base URL
  saveBaseUrlBtn?.addEventListener('click', () => {
    try {
      const saved = API.setApiBaseUrl(apiBaseUrlInput.value.trim());
      apiStatus.textContent = `Saved: ${saved}`;
      apiStatus.className = 'status success';
      setTimeout(() => (apiStatus.textContent = ''), 2000);
    } catch (e) {
      apiStatus.textContent = e.message;
      apiStatus.className = 'status error';
    }
  });

  // Render list of groups (MySQL fields: GroupID, GroupName, CourseName)
  function renderGroups(data) {
    groupsList.innerHTML = '';

    if (!Array.isArray(data) || data.length === 0) {
      viewStatus.textContent = 'No groups found.';
      viewStatus.className = 'status';
      return;
    }

    const frag = document.createDocumentFragment();
    data.forEach(g => {
      const li = document.createElement('li');
      li.className = 'list-item';

      // Backend returns: GroupID, GroupName, CourseName
      const id    = g.GroupID ?? g.id ?? 'unknown';
      const title = g.GroupName ?? '(No title)';
      const course = g.CourseName ?? '(No course)';

      li.innerHTML = `
        <strong>${esc(course)} — ${esc(title)}</strong>
        <div>ID: <code>${esc(id)}</code></div>
      `;

      frag.appendChild(li);
    });

    groupsList.appendChild(frag);
    viewStatus.textContent = '';
  }

  // Load groups
  btnLoadGroups?.addEventListener('click', async () => {
    viewStatus.textContent = 'Loading...';
    viewStatus.className = 'status';
    groupsList.innerHTML = '';

    try {
      const course = (searchCourse.value || '').trim();
      // tag is currently unused by the backend, but we keep the input for future use
      // const tag = (searchTag.value || '').trim();

      const data = await API.StudyGroups.list({ course });
      renderGroups(data);
    } catch (e) {
      console.error(e);
      viewStatus.textContent = e.message || 'Failed to load groups.';
      viewStatus.className = 'status error';
    }
  });

  // Create group
  createForm?.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    createStatus.textContent = 'Creating...';
    createStatus.className = 'status';

    const form = new FormData(createForm);
    const payload = {
      course: form.get('course'),
      title:  form.get('title'),
      // These are collected in the UI but not stored in the current DB schema
      when:   form.get('when'),
      where:  form.get('where'),
      maxSize: Number(form.get('maxSize') || 0) || undefined
    };

    try {
      const data = await API.StudyGroups.create(payload);
      const id   = data.GroupID ?? data.id ?? 'unknown';
      createStatus.textContent = 'Created! ID: ' + id;
      createStatus.className = 'status success';
      createForm.reset();
    } catch (e) {
      console.error(e);
      createStatus.textContent = e.message || 'Failed to create group.';
      createStatus.className = 'status error';
    }
  });

  // Join group
  joinForm?.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    joinStatus.textContent = 'Joining...';
    joinStatus.className = 'status';

    const form = new FormData(joinForm);
    const gid  = form.get('groupId');
    const name = form.get('name');

    try {
      await API.StudyGroups.join(gid, name);
      joinStatus.textContent = 'Joined successfully!';
      joinStatus.className = 'status success';
      joinForm.reset();
    } catch (e) {
      console.error(e);
      joinStatus.textContent = e.message || 'Failed to join group.';
      joinStatus.className = 'status error';
    }
  });
})();
