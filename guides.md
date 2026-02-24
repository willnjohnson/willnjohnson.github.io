---
layout: guides
title: "Guides"
---

<h1>Guides</h1>

<div class="guides-container">
  {% assign guide_courses = site.guides | group_by: "guide" %}
  
  {% for course in guide_courses %}
  <div class="guide-card" onclick="toggleGuide(this)">
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
</div>

<script>
  // Expand/collapse guide for modules
  function toggleGuide(card) {
    const header = card.querySelector('.guide-card-header');
    const modules = card.querySelector('.guide-modules');
    if (header) {
      header.classList.toggle('expanded');
    }
    if (modules) {
      modules.classList.toggle('expanded');
    }
  }

  // Sort modules numerically after page load
  document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.guide-modules').forEach(function(container) {
      const items = container.querySelectorAll('.module-item');
      const separators = container.querySelectorAll('.module-separator');
      
      // Sort items by chapter number
      const sortedItems = Array.from(items).sort(function(a, b) {
        return parseInt(a.dataset.chapter) - parseInt(b.dataset.chapter);
      });
      
      // Sort separators by module number
      const sortedSeps = Array.from(separators).sort(function(a, b) {
        return parseInt(a.dataset.module) - parseInt(b.dataset.module);
      });
      
      // Clear and re-append in sorted order
      container.innerHTML = '';
      let prevChapter = null;
      
      sortedItems.forEach(function(item) {
        const chapter = parseInt(item.dataset.chapter);
        const sep = sortedSeps.find(function(s) { return parseInt(s.dataset.module) === chapter; });
        
        if (sep && chapter !== prevChapter) {
          container.appendChild(sep.cloneNode(true));
          prevChapter = chapter;
        }
        container.appendChild(item);
      });
    });

    // Unfold guide and scroll to module of directed hash
    if (window.location.hash) {
      const targetId = window.location.hash.substring(1);
      const targetItem = document.getElementById(targetId);
      
      if (targetItem) {
        // Find parent guide-card and expand it
        const guideCard = targetItem.closest('.guide-card');
        if (guideCard) {
          const header = guideCard.querySelector('.guide-card-header');
          const modules = guideCard.querySelector('.guide-modules');
          if (header && !header.classList.contains('expanded')) {
            header.classList.add('expanded');
          }
          if (modules && !modules.classList.contains('expanded')) {
            modules.classList.add('expanded');
          }
        }
        
        setTimeout(function() {
          targetItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
          targetItem.classList.add('active');
        }, 100);
      }
    }
  });
</script>
