(function () {
  "use strict";

  var STORAGE_KEY = "notes_app_data_v1";
  var VIEW_KEY = "notes_app_view_v1";

  var els = {
    listScreen: document.getElementById("screen-list"),
    editorScreen: document.getElementById("screen-editor"),
    container: document.getElementById("notes-container"),
    empty: document.getElementById("empty-state"),
    search: document.getElementById("search-input"),
    chipRow: document.getElementById("color-filter-row"),
    btnAdd: document.getElementById("btn-add"),
    btnBack: document.getElementById("btn-back"),
    btnPin: document.getElementById("btn-pin"),
    btnDelete: document.getElementById("btn-delete"),
    btnViewToggle: document.getElementById("btn-view-toggle"),
    editorTitle: document.getElementById("editor-title"),
    editorContent: document.getElementById("editor-content"),
    editorDate: document.getElementById("editor-date"),
    colorPicker: document.getElementById("color-picker"),
    toast: document.getElementById("toast")
  };

  var state = {
    notes: [],
    activeFilter: "all",
    query: "",
    editingId: null,
    listMode: false
  };

  // ---------- storage ----------
  function loadNotes() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      state.notes = raw ? JSON.parse(raw) : [];
    } catch (e) {
      state.notes = [];
    }
  }

  function saveNotes() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.notes));
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  // ---------- rendering ----------
  function formatDate(ts) {
    var d = new Date(ts);
    var now = new Date();
    var sameDay = d.toDateString() === now.toDateString();
    if (sameDay) {
      var h = d.getHours(), m = d.getMinutes();
      var ampm = h >= 12 ? "PM" : "AM";
      h = h % 12 || 12;
      return "Today " + h + ":" + (m < 10 ? "0" + m : m) + " " + ampm;
    }
    var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return months[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
  }

  function filteredNotes() {
    return state.notes
      .filter(function (n) {
        var matchesColor = state.activeFilter === "all" || n.color === state.activeFilter;
        var q = state.query.trim().toLowerCase();
        var matchesQuery = !q ||
          n.title.toLowerCase().indexOf(q) !== -1 ||
          n.content.toLowerCase().indexOf(q) !== -1;
        return matchesColor && matchesQuery;
      })
      .sort(function (a, b) {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return b.updatedAt - a.updatedAt;
      });
  }

  function render() {
    var list = filteredNotes();
    els.container.innerHTML = "";
    els.container.classList.toggle("list-mode", state.listMode);
    els.empty.hidden = list.length > 0;

    list.forEach(function (note) {
      var card = document.createElement("article");
      card.className = "note-card note-" + note.color + (note.pinned ? " pinned" : "");

      var title = document.createElement("h2");
      title.className = "note-title";
      title.textContent = note.title || "Untitled";
      card.appendChild(title);

      if (note.content) {
        var snippet = document.createElement("p");
        snippet.className = "note-snippet";
        snippet.textContent = note.content;
        card.appendChild(snippet);
      }

      var date = document.createElement("div");
      date.className = "note-date";
      date.textContent = formatDate(note.updatedAt);
      card.appendChild(date);

      card.addEventListener("click", function () { openEditor(note.id); });
      els.container.appendChild(card);
    });
  }

  // ---------- editor ----------
  function openEditor(id) {
    var note;
    if (id) {
      note = state.notes.find(function (n) { return n.id === id; });
    }
    if (!note) {
      note = { id: uid(), title: "", content: "", color: "yellow", pinned: false, createdAt: Date.now(), updatedAt: Date.now() };
      state.notes.unshift(note);
    }
    state.editingId = note.id;
    els.editorTitle.value = note.title;
    els.editorContent.value = note.content;
    els.editorDate.textContent = formatDate(note.updatedAt);
    els.btnPin.classList.toggle("active", !!note.pinned);
    setActiveSwatch(note.color);
    showScreen(els.editorScreen);
    setTimeout(function () { els.editorTitle.focus(); }, 150);
  }

  function currentNote() {
    return state.notes.find(function (n) { return n.id === state.editingId; });
  }

  function setActiveSwatch(color) {
    els.colorPicker.querySelectorAll(".swatch").forEach(function (sw) {
      sw.classList.toggle("active", sw.dataset.color === color);
    });
  }

  function persistEditorFields() {
    var note = currentNote();
    if (!note) return;
    note.title = els.editorTitle.value;
    note.content = els.editorContent.value;
    note.updatedAt = Date.now();
    saveNotes();
  }

  function closeEditor(discardIfEmpty) {
    var note = currentNote();
    persistEditorFields();
    if (discardIfEmpty && note && !note.title.trim() && !note.content.trim()) {
      state.notes = state.notes.filter(function (n) { return n.id !== note.id; });
      saveNotes();
    }
    state.editingId = null;
    showScreen(els.listScreen);
    render();
  }

  function showScreen(screen) {
    [els.listScreen, els.editorScreen].forEach(function (s) { s.classList.remove("active"); });
    screen.classList.add("active");
  }

  function showToast(msg) {
    els.toast.textContent = msg;
    els.toast.classList.add("show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () { els.toast.classList.remove("show"); }, 1600);
  }

  // ---------- events ----------
  els.btnAdd.addEventListener("click", function () { openEditor(null); });
  els.btnBack.addEventListener("click", function () { closeEditor(true); });

  document.addEventListener("backbutton", function (e) {
    if (els.editorScreen.classList.contains("active")) {
      e.preventDefault();
      closeEditor(true);
    }
  }, false);

  els.editorTitle.addEventListener("input", persistEditorFields);
  els.editorContent.addEventListener("input", persistEditorFields);

  els.btnPin.addEventListener("click", function () {
    var note = currentNote();
    if (!note) return;
    note.pinned = !note.pinned;
    note.updatedAt = Date.now();
    els.btnPin.classList.toggle("active", note.pinned);
    saveNotes();
    showToast(note.pinned ? "Pinned" : "Unpinned");
  });

  els.btnDelete.addEventListener("click", function () {
    var note = currentNote();
    if (!note) return;
    state.notes = state.notes.filter(function (n) { return n.id !== note.id; });
    saveNotes();
    state.editingId = null;
    showScreen(els.listScreen);
    render();
    showToast("Note deleted");
  });

  els.colorPicker.addEventListener("click", function (e) {
    var btn = e.target.closest(".swatch");
    if (!btn) return;
    var note = currentNote();
    if (!note) return;
    note.color = btn.dataset.color;
    note.updatedAt = Date.now();
    setActiveSwatch(note.color);
    saveNotes();
  });

  els.search.addEventListener("input", function () {
    state.query = els.search.value;
    render();
  });

  els.chipRow.addEventListener("click", function (e) {
    var chip = e.target.closest(".chip");
    if (!chip) return;
    state.activeFilter = chip.dataset.color;
    els.chipRow.querySelectorAll(".chip").forEach(function (c) { c.classList.remove("active"); });
    chip.classList.add("active");
    render();
  });

  els.btnViewToggle.addEventListener("click", function () {
    state.listMode = !state.listMode;
    localStorage.setItem(VIEW_KEY, state.listMode ? "1" : "0");
    render();
  });

  // ---------- init ----------
  function init() {
    loadNotes();
    state.listMode = localStorage.getItem(VIEW_KEY) === "1";
    render();
  }

  if (window.cordova) {
    document.addEventListener("deviceready", init, false);
  } else {
    document.addEventListener("DOMContentLoaded", init);
  }
})();
