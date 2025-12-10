// app/study-groups.js
(function () {
  // Elements
  const apiBaseUrlInput = document.getElementById('apiBaseUrl');
  const saveBaseUrlBtn  = document.getElementById('saveBaseUrl');
  const apiStatus       = document.getElementById('apiStatus');

  const btnLoadGroups = document.getElementById('btnLoadGroups');
  const searchCourse  = document.getElementById('searchCourse');
  const searchTag     = document.getElementById('searchTag');
  const groupsList    = document.getElementById('groupsList');
  const viewStatus    = document.getElementById('viewStatus');

  const createForm    = document.getElementById('createForm');
  const createStatus  = document.getElementById('createStatus');

  const joinForm      = document.getElementById('joinForm');
  const joinStatus    = document.getElementById('joinStatus');

  // Hydrate API field if previously saved
  try { apiBaseUrlInput.value = API.getApiBaseUrl(); } catch (_) {}

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

  // Load groups
  btnLoadGroups?.addEventListener('click', async () => {
    viewStatus.textContent = 'Loading...';
    viewStatus.className = 'status';
    groupsList.innerHTML = '';
    try {
      const data = await API.StudyGroups.list({
        course: (searchCourse.value || '').trim(),
        tag: (searchTag.value || '').trim()
      });
      if (!Array.isArray(data) || data.length === 0) {
        viewStatus.textContent = 'No groups found.';
        return;
      }
      const frag = document.createDocumentFragment();
      data.forEach(g => {
        const li = document.createElement('li');
        li.innerHTML = `
          <strong>${g.course || 'Course ?'} — ${g.title || ''}</strong>
          <div>ID: <code>${g._id || g.id || 'unknown'}</code></div>
          <div>When: ${
            g.schedule?.text ||
            (g.schedule ? `${g.schedule.day ?? ''} ${g.schedule.time ?? ''} ${g.schedule.tz ?? ''}`.trim() : 'tbd')
          } | Where: ${g.where || 'tbd'}</div>
          <div>Members: ${g.membersCount ?? 0}${g.maxSize ? ' / ' + g.maxSize : ''} | Open: ${g.isOpen ? 'Yes' : 'No'}</div>
        `;
        frag.appendChild(li);
      });
      groupsList.appendChild(frag);
      viewStatus.textContent = '';
    } catch (e) {
      viewStatus.textContent = e.message;
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
      when:   form.get('when'),
      where:  form.get('where'),
      maxSize: Number(form.get('maxSize') || 0) || undefined
    };
    try {
      const data = await API.StudyGroups.create(payload);
      createStatus.textContent = 'Created! ID: ' + (data._id || data.id || 'unknown');
      createStatus.className = 'status success';
      createForm.reset();
    } catch (e) {
      createStatus.textContent = e.message;
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
      joinStatus.textContent = e.message;
      joinStatus.className = 'status error';
    }
  });
})();
