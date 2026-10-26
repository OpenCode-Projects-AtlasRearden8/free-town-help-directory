(function () {
  "use strict";

  var render = window.FTHD_RENDER;
  var data = window.FTHD_DATA;

  function showFatal(message) {
    var mount = document.getElementById("fthd-mount");
    if (mount) {
      mount.innerHTML =
        '<div class="fthd-error"><h2>Data failed to load</h2><p>' +
        render.esc(message) +
        "</p><p>Run <code>npm run build</code> to regenerate <code>data.js</code> " +
        "from <code>data/directory.json</code>, then reload this page.</p></div>";
    }
  }

  function filterAndRender(data, category) {
    var shown =
      category === "all"
        ? data.entries
        : data.entries.filter(function (e) { return e.category === category; });
    var groups = render.groupByCategory({ categories: data.categories, entries: shown });
    var html = "";
    groups.forEach(function (g) {
      html +=
        '<section class="fthd-section"><h2 class="fthd-cat-label">' +
        render.esc(g.label) +
        "</h2>" +
        g.rows.map(render.card).join("") +
        "</section>";
    });
    document.getElementById("fthd-mount").innerHTML =
      html || '<p class="fthd-empty">No entries in this category yet.</p>';
  }

  if (!data || !Array.isArray(data.entries)) {
    showFatal(
      "data.js is missing or does not contain window.FTHD_DATA with an entries array."
    );
    return;
  }

  document.getElementById("fthd-county").textContent = data.county;
  document.getElementById("fthd-updated").textContent = "Last updated " + data.updatedOn;
  document.getElementById("fthd-note").textContent = data.note;

  var nav = document.getElementById("fthd-nav");
  nav.innerHTML = render.renderCategoryNav(data);
  nav.addEventListener(
    "click",
    function (event) {
      var button = event.target.closest("button.fthd-filter");
      if (!button) return;
      var category = button.getAttribute("data-category");
      nav.querySelectorAll("button.fthd-filter").forEach(function (b) {
        b.classList.toggle("fthd-active", b === button);
      });
      filterAndRender(data, category);
    },
    false
  );

  document.getElementById("fthd-print").addEventListener("click", function () {
    window.print();
  });

  var search = document.getElementById("fthd-search");
  search.addEventListener(
    "input",
    function () {
      var query = search.value.trim().toLowerCase();
      var filtered = data.entries.filter(function (e) {
        if (!query) return true;
        var haystack = [
          e.name,
          e.category,
          e.address,
          e.hours,
          e.eligibility,
          e.notes,
          (e.services || []).join(" "),
          (e.whatToBring || []).join(" ")
        ]
          .join(" ")
          .toLowerCase();
        return haystack.indexOf(query) !== -1;
      });
      var groups = render.groupByCategory({
        categories: data.categories,
        entries: filtered
      });
      var html = "";
      groups.forEach(function (g) {
        html +=
          '<section class="fthd-section"><h2 class="fthd-cat-label">' +
          render.esc(g.label) +
          "</h2>" +
          g.rows.map(render.card).join("") +
          "</section>";
      });
      document.getElementById("fthd-mount").innerHTML =
        html ||
        '<p class="fthd-empty">No matches. Try a shorter word, like "food" or "water".</p>';
    },
    false
  );

  filterAndRender(data, "all");
})();
