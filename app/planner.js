(function () {
 
  const newAssignmentForm     = document.getElementById('NewAssignment');
  const getAssignmentForm     = document.getElementById('GetAssignment'); 
  const assignmentListContainer = document.getElementById('PlannerList'); 
  
  
  const addAssignmentButton   = newAssignmentForm?.querySelector('button[type="submit"]'); 
  const loadAssignmentButton  = getAssignmentForm?.querySelector('button[type="submit"]');

  let allAssignments = []; 

  const esc = (s = '') =>
    s.toString().replace(/[&<>"]/g, c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;'
    }[c]));

  

  function renderAssignments(assignments) {
  
    assignmentListContainer.innerHTML = ''; 

    if (!assignments.length) {
      assignmentListContainer.innerHTML = '<li class="list-item"><p style="margin: 0; padding: 12px; font-style: italic;">No assignments found for this user.</p></li>';
      return;
    }

  
    assignments.sort((a, b) => {
  
      const dateA = a.Due ? new Date(a.Due) : new Date(8640000000000000); 
      const dateB = b.Due ? new Date(b.Due) : new Date(8640000000000000);
      
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA - dateB;
      }
      
      const priorityA = parseInt(a.Priority) || 5; 
      const priorityB = parseInt(b.Priority) || 5;

      return priorityA - priorityB;
    });

    const frag = document.createDocumentFragment();

    assignments.forEach(a => {
      const title    = a.Title ?? '(Untitled Assignment)';
      const notes    = a.Notes ?? '';
      const due      = a.Due ? new Date(a.Due).toLocaleDateString() : 'No Due Date';
      const priority = a.Priority ? `Priority: ${a.Priority}` : '';
      const priorityClass = a.Priority ? `priority-${a.Priority}` : '';

      const li = document.createElement('li');
      li.className = `list-item assignment-item ${priorityClass}`;
      li.innerHTML = `
        <div class="assignment-main">
          <h3 class="assignment-title">${esc(title)}</h3>
          <p class="assignment-notes">${esc(notes)}</p>
          <div class="assignment-meta">
            <span class="assignment-due">${esc(due)}</span>
            ${priority ? `<span class="assignment-priority">${esc(priority)}</span>` : ''}
          </div>
        </div>
      `;
      frag.appendChild(li);
    });
    
  
    assignmentListContainer.appendChild(frag);
  }
 
  
  async function loadAssignments(userEmail) {
    if (!userEmail) {
        assignmentListContainer.innerHTML = '<li class="list-item"><p style="margin: 0; padding: 12px; color: red;">Error: User email is required to view assignments.</p></li>';
        return;
    }
    
  
    assignmentListContainer.innerHTML = '<li class="list-item"><p style="margin: 0; padding: 12px;">Loading assignments...</p></li>';
    
    try {
  
      const assignments = await API.Planner.list({ email: userEmail }); 
      allAssignments = Array.isArray(assignments) ? assignments : [];
      renderAssignments(allAssignments);
      
    } catch (e) {
      console.error(e);
  
      assignmentListContainer.innerHTML = `<li class="list-item"><p style="margin: 0; padding: 12px; color: red;">${e.message || 'Failed to load assignments.'}</p></li>`;
    } finally {
  
        if (loadAssignmentButton) {
            loadAssignmentButton.disabled = false;
            loadAssignmentButton.textContent = 'Submit';
        }
    }
  }

  
 
  
  newAssignmentForm?.addEventListener('submit', async (ev) => {
    ev.preventDefault();
      
    if (addAssignmentButton) {
        addAssignmentButton.disabled = true;
        addAssignmentButton.textContent = 'Submitting...';
    }

    const form = new FormData(newAssignmentForm);
    const payload = {
      email:    (form.get('email')    || '').trim(),
      title:    (form.get('title')    || '').trim(),
      notes:    (form.get('notes')    || '').trim(),
      due:      (form.get('due')      || '').trim(),
      priority: (form.get('priority') || '').trim()
    };
        
    const priorityInt = parseInt(payload.priority);
    if (payload.priority && (isNaN(priorityInt) || priorityInt < 1 || priorityInt > 4)) {
      alert('Priority must be a number between 1 and 4');
      if (addAssignmentButton) {
        addAssignmentButton.disabled = false;
        addAssignmentButton.textContent = 'Submit';
      }
      return;
    }

    try {
    
      await API.Planner.create(payload);
      newAssignmentForm.reset();

    
      if (payload.email) loadAssignments(payload.email); 

      if (addAssignmentButton) {
        addAssignmentButton.textContent = 'Submitted!';
        setTimeout(() => {
            addAssignmentButton.disabled = false;
            addAssignmentButton.textContent = 'Submit';
        }, 1000);
      }

    } catch (e) {
      console.error(e);
      alert(e.message || 'An error occurred.');
      if (addAssignmentButton) {
        addAssignmentButton.disabled = false;
        addAssignmentButton.textContent = 'Submit';
      }
    }
  });


  getAssignmentForm?.addEventListener('submit', (ev) => {
    ev.preventDefault();
    
    if (loadAssignmentButton) {
        loadAssignmentButton.disabled = true;
        loadAssignmentButton.textContent = 'Loading...';
    }
    
    const form = new FormData(getAssignmentForm);
    const email = (form.get('email') || '').trim();

    if (!email) {
      alert('Please enter your email address.');
      if (loadAssignmentButton) {
        loadAssignmentButton.disabled = false;
        loadAssignmentButton.textContent = 'Submit';
      }
      return;
    }
    

    loadAssignments(email);
  });


})();