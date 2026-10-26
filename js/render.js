(function (root) {
  "use strict";

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function list(items) {
    if (!items || !items.length) return "";
    return (
      '<ul class="fthd-list">' +
      items.map(function (item) { return "<li>" + esc(item) + "</li>"; }).join("") +
      "</ul>"
    );
  }

  function websiteLink(url) {
    if (!url) return "";
    var safe = /^https?:\/\//i.test(url) ? url : "https://" + url;
    return (
      '<a href="' + esc(safe) + '" rel="noopener noreferrer">' + esc(safe) + "</a>"
    );
  }

  function card(entry) {
    var bring = entry.whatToBring || [];
    var services = entry.services || [];
    return (
      '<article class="fthd-card" id="entry-' + esc(entry.id) + '">' +
      '<div class="fthd-card-head">' +
      '<h3 class="fthd-card-name">' + esc(entry.name) + "</h3>" +
      '<span class="fthd-verified">verified on ' + esc(entry.verifiedOn) + "</span>" +
      "</div>" +
      '<div class="fthd-line"><strong>Where:</strong> <span>' + esc(entry.address) + "</span></div>" +
      '<div class="fthd-line"><strong>Hours:</strong> <span>' + esc(entry.hours) + "</span></div>" +
      '<div class="fthd-line"><strong>Phone:</strong> <span><a href="tel:' + esc(String(entry.phone).replace(/[^0-9+]/g, "")) + '">' + esc(entry.phone) + "</a></span></div>" +
      (entry.website
        ? '<div class="fthd-line"><strong>Website:</strong> <span>' + websiteLink(entry.website) + "</span></div>"
        : "") +
      '<div class="fthd-block"><h4>Eligibility</h4><p>' + esc(entry.eligibility) + "</p></div>" +
      '<div class="fthd-block"><h4>What to bring</h4>' + list(bring) + "</div>" +
      '<div class="fthd-block"><h4>Services</h4>' + list(services) + "</div>" +
      (entry.notes
        ? '<div class="fthd-block fthd-notes"><h4>Notes</h4><p>' + esc(entry.notes) + "</p></div>"
        : "") +
      "</article>"
    );
  }

  function renderCards(data) {
    return '<div class="fthd-cards">' +
      (data.entries || []).map(card).join("") +
      "</div>";
  }

  function renderCategoryNav(data) {
    var counts = {};
    (data.entries || []).forEach(function (e) {
      counts[e.category] = (counts[e.category] || 0) + 1;
    });
    var buttons = (data.categories || []).filter(function (c) { return counts[c.id]; }).map(function (c) {
      return (
        '<button type="button" class="fthd-filter" data-category="' + esc(c.id) + '">' +
        esc(c.label) + " (" + counts[c.id] + ")</button>"
      );
    });
    buttons.unshift('<button type="button" class="fthd-filter fthd-active" data-category="all">All (' + (data.entries || []).length + ")</button>");
    return '<div class="fthd-filters" role="tablist">' + buttons.join("") + "</div>";
  }

  function groupByCategory(data) {
    var orderedCategories = [];
    (data.categories || []).forEach(function (c) {
      var rows = (data.entries || []).filter(function (e) { return e.category === c.id; });
      if (rows.length) orderedCategories.push({ id: c.id, label: c.label, rows: rows });
    });
    var known = {};
    orderedCategories.forEach(function (c) { known[c.id] = true; });
    var unknowns = {};
    (data.entries || []).forEach(function (e) {
      if (!known[e.category]) {
        unknowns[e.category] = unknowns[e.category] || [];
        unknowns[e.category].push(e);
      }
    });
    Object.keys(unknowns).forEach(function (catId) {
      orderedCategories.push({
        id: catId,
        label: catId,
        rows: unknowns[catId],
        unlabeled: true
      });
    });
    return orderedCategories;
  }

  var api = {
    esc: esc,
    card: card,
    renderCards: renderCards,
    renderCategoryNav: renderCategoryNav,
    groupByCategory: groupByCategory
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.FTHD_RENDER = api;
  }
})(typeof window !== "undefined" ? window : this);
