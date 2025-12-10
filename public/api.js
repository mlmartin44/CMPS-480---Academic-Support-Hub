conSt API = (function () {
  let baseUrl = localStorage.getItem('apiBaseUrl') || 'http://localhost:5000';

  return {
    getApiBaseUrl() {
      return baseUrl;
    },
    setApiBaseUrl(url) {
      if (!url) throw new Error('Base URL required');
      baseUrl = url;
      localStorage.setItem('apiBaseUrl', url);
      return baseUrl;
    },
    StudyGroups: {
      async list({ course }) {
        const params = new URLSearchParams();
        if (course) params.append('course', course);
        const res = await fetch(`${baseUrl}/api/study-groups?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch study groups');
        const data = await res.json();
        // map DB fields to expected frontend fields
        return data.map(d => ({
          id: d.GroupID,
          title: d.GroupName,
          course: d.CourseName
        }));
      },
      async create(payload) {
        const res = await fetch(`${baseUrl}/api/study-groups`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Failed to create group');
        const data = await res.json();
        return {
          id: data.GroupID,
          title: data.GroupName,
          course: data.CourseName
        };
      },
      async join(groupId, name) {
        const res = await fetch(`${baseUrl}/api/study-groups/${groupId}/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name })
        });
        if (!res.ok) throw new Error('Failed to join group');
        return await res.json();
      }
    }
  };
})();

