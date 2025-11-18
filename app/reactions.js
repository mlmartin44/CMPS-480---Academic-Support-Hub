// app/reactions.js
window.Reactions = (() => {
  const currentUserId = 1;

  const EMOJIS = [
    { key: "thumbs_up",   char: "👍" },
    { key: "thumbs_down", char: "👎" },
    { key: "smile",       char: "😀" },
    { key: "heart",       char: "❤️" },
    { key: "wow",         char: "😮" }
  ];

  // id -> { reactions: Map<emojiKey, Set<userId>>, children: [] }
  const store = new Map();

  function ensureState(id) {
    if (!store.has(id)) {
      const m = new Map();
      EMOJIS.forEach(e => m.set(e.key, new Set()));
      store.set(id, { reactions: m, children: [] });
    }
    return store.get(id);
  }

  function toggle(state, emojiKey, userId) {
    const set = state.reactions.get(emojiKey);
    if (set.has(userId)) {
      set.delete(userId);
    } else {
      set.add(userId);
    }
  }

  function addReply(state, text) {
    const trimmed = text.trim();
    if (!trimmed) return;
    state.children.push({
      id: Date.now(),
      author: "You",
      text: trimmed,
      createdAt: "just now"
    });
  }

  function mount(el, node) {
    const state = ensureState(node.id);

    const card = document.createElement("div");
    card.className = "card reaction-card";

    // Meta line
    const meta = document.createElement("div");
    meta.className = "meta";
    meta.textContent = `${node.type === "question" ? "Question" : "Comment"} by ${
      node.author
    } • ${node.createdAt}`;

    // Main content
    const content = document.createElement("div");
    content.className = "content";
    content.textContent = node.text;

    // Bar with emoji pills + reply button
    const bar = document.createElement("div");
    bar.className = "bar";

    const pills = document.createElement("div");
    pills.className = "reactions";

    function renderPills() {
      pills.innerHTML = "";
      EMOJIS.forEach(e => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "reaction";

        const set = state.reactions.get(e.key);
        if (set.has(currentUserId)) btn.classList.add("active");

        const emojiSpan = document.createElement("span");
        emojiSpan.className = "emoji";
        emojiSpan.textContent = e.char;

        const countSpan = document.createElement("span");
        countSpan.className = "count";
        countSpan.textContent = String(set.size);

        btn.appendChild(emojiSpan);
        btn.appendChild(countSpan);

        btn.addEventListener("click", () => {
          toggle(state, e.key, currentUserId);
          renderPills();
        });

        pills.appendChild(btn);
      });
    }
    renderPills();

    // Reply UI
    const replyBtn = document.createElement("button");
    replyBtn.className = "btn small";
    replyBtn.type = "button";
    replyBtn.textContent = "Reply";

    const box = document.createElement("div");
    box.className = "reply-box";
    box.style.display = "none";

    const ta = document.createElement("textarea");
    ta.rows = 3;
    ta.placeholder = "Write a reply...";

    const row = document.createElement("div");
    row.className = "row";

    const add = document.createElement("button");
    add.className = "btn small";
    add.type = "button";
    add.textContent = "Add reply";

    const cancel = document.createElement("button");
    cancel.className = "btn small";
    cancel.type = "button";
    cancel.textContent = "Cancel";

    add.addEventListener("click", () => {
      if (!ta.value.trim()) return;
      addReply(state, ta.value);
      ta.value = "";
      box.style.display = "none";
      renderChildren();
    });

    cancel.addEventListener("click", () => {
      ta.value = "";
      box.style.display = "none";
    });

    replyBtn.addEventListener("click", () => {
      box.style.display = box.style.display === "block" ? "none" : "block";
      if (box.style.display === "block") ta.focus();
    });

    row.appendChild(add);
    row.appendChild(cancel);
    box.appendChild(ta);
    box.appendChild(row);

    // Children (replies)
    const kids = document.createElement("div");

    function renderChildren() {
      kids.innerHTML = "";
      state.children.forEach(c => {
        const div = document.createElement("div");
        div.className = "card child";

        const metaChild = document.createElement("div");
        metaChild.className = "meta";
        metaChild.textContent = `Reply by ${c.author} • ${c.createdAt}`;

        const contentChild = document.createElement("div");
        contentChild.className = "content";
        // Use textContent to avoid injecting HTML from user input
        contentChild.textContent = c.text;

        div.appendChild(metaChild);
        div.appendChild(contentChild);
        kids.appendChild(div);
      });
    }
    renderChildren();

    bar.appendChild(pills);
    bar.appendChild(replyBtn);

    card.appendChild(meta);
    card.appendChild(content);
    card.appendChild(bar);
    card.appendChild(box);
    card.appendChild(kids);

    el.innerHTML = "";
    el.appendChild(card);
  }

  return { mount };
})();
