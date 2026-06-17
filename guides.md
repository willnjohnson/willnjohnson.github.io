---
layout: guides
title: "Guides"
---

{% assign categories = "" | split: "" %}
{% for item in site.guides %}
  {% unless categories contains item.guide %}
    {% assign categories = categories | push: item.guide %}
  {% endunless %}
{% endfor %}

<h1>Guides</h1>

<div class="guides-container" id="guides-container">
  {% assign guide_courses = site.guides | sort: "guide" | group_by: "guide" %}
  
  {% for course in guide_courses %}
  <div class="guide-card" data-guide-name="{{ course.name }}" onclick="toggleGuide(this)">
    <div class="guide-card-header">
      {% assign display_name = course.items.first.display_name %}
      <h2>{{ display_name | default: course.name }}</h2>
      <i class="fa-solid fa-chevron-down expand-icon"></i>
    </div>
    <p class="guide-card-description">{{ course.items.first.description | default: "A guide." }}</p>
    <div class="guide-modules" data-guide="{{ forloop.index }}" onclick="event.stopPropagation()">
      {% assign sorted_modules = course.items | sort: "chapter" %}
      {% assign prev_chapter = "" %}
      {% for module in sorted_modules %}
        {% assign module_chapter = module.chapter | remove: "M" | split: "." | first | plus: 0 %}
        {% if module_chapter != prev_chapter %}
        <div class="module-separator" data-module="{{ module_chapter }}">
          <span class="separator-line"></span>
          <span class="separator-text">Module {{ module_chapter }}</span>
          <span class="separator-line"></span>
        </div>
        {% endif %}
      <div class="module-item" id="{{ course.name }}-{{ module.chapter | remove: "M" }}" data-chapter="{{ module_chapter }}" onclick="event.stopPropagation()">
        <a href="{{ site.baseurl }}{{ module.url }}">
          <span class="module-id">{{ module.chapter | remove: "M" }}</span>
          <span class="module-title">{{ module.title }}</span>
          <i class="fa-solid fa-arrow-right module-arrow"></i>
        </a>
      </div>
        {% assign prev_chapter = module_chapter %}
      {% endfor %}
</div>
</div>
{% endfor %}

<div id="no-guides-message" style="display:none;text-align:center;padding:2rem;color:#666;">
  <p>No guides available for this section yet.</p>
</div>

</div>

<script>
  let currentRotation = 0;
  let currentIndex = 0;

  const categories = [
    {% for item in site.guides %}
      {% assign cat = item.guide %}
      {% unless forloop.first %}, {% endunless %}"{{ cat }}"
    {% endfor %}
  ].filter(function(v, i, a){ return a.indexOf(v) === i; });

  function updateVisibility() {
    var visibleCat = currentIndex < categories.length ? categories[currentIndex] : categories[0];
    var cards = document.querySelectorAll('.guide-card');
    var anyVisible = false;
    cards.forEach(function(card) {
      if (card.getAttribute('data-guide-name') === visibleCat) {
        card.style.display = '';
        anyVisible = true;
      } else {
        card.style.display = 'none';
      }
    });
    var msg = document.getElementById('no-guides-message');
    if (msg) msg.style.display = anyVisible ? 'none' : 'block';
  }

  function flipCard() {
    var card = document.getElementById('card');
    currentRotation += 180;
    card.style.transform = 'rotateY(' + currentRotation + 'deg)';
    card.classList.toggle('is-flipped', currentRotation % 360 === 180);

    var nextIndex = (currentIndex + 1) % categories.length;
    var nextCat = categories[nextIndex];

    setTimeout(function() {
      document.getElementById('front-label').textContent = categories[currentIndex];
      document.getElementById('back-label').textContent = nextCat;
    }, 400);

    setTimeout(function() {
      currentIndex = nextIndex;
      updateVisibility();
    }, 800);
  }

  // Toggle accordion-style guides
  function toggleGuide(card) {
    var header = card.querySelector('.guide-card-header');
    var mods = card.querySelector('.guide-modules');
    if (header) header.classList.toggle('expanded');
    if (mods) mods.classList.toggle('expanded');
  }

  // Init: show only first category
  document.addEventListener('DOMContentLoaded', function() {
    if (categories.length > 0) {
      document.getElementById('front-label').textContent = categories[0];
      if (categories.length > 1) {
        document.getElementById('back-label').textContent = categories[1];
      }
      updateVisibility();
    }

    document.querySelectorAll('.guide-modules').forEach(function(container) {
      // Sort/expand logic preserved for first visible guide
      var items = container.querySelectorAll('.module-item');
      var separators = container.querySelectorAll('.module-separator');
      if (items.length === 0) return;

      var sortChildren = function() {
        var sorted = Array.from(items).sort(function(a, b) {
          return parseInt(a.getAttribute('data-chapter')) - parseInt(b.getAttribute('data-chapter'));
        });
        sorted.forEach(function(item) {
          var ch = parseInt(item.getAttribute('data-chapter'));
          var sep = container.querySelector('.module-separator[data-module="' + ch + '"]');
          if (sep && sep.parentNode !== container) container.appendChild(sep);
          container.appendChild(item);
        });
      };
      sortChildren();
    });

    if (window.location.hash) {
      var tid = window.location.hash.substring(1);
      var target = document.getElementById(tid);
      if (target) {
        var parent = target.closest('.guide-card');
        if (parent) {
          var h = parent.querySelector('.guide-card-header');
          var m = parent.querySelector('.guide-modules');
          if (h && !h.classList.contains('expanded')) h.classList.add('expanded');
          if (m && !m.classList.contains('expanded')) m.classList.add('expanded');
        }
        setTimeout(function() {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
          target.classList.add('active');
        }, 100);
      }
    }
  });
</script>