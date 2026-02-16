---
layout: default
title: "All Tags"
permalink: /tag/
---

<section class="tags-index">
  <h1>All Tags</h1>
  <ul>
    {% assign tags_list = site.posts | map: "tags" | compact | uniq | sort %}
    {% for tag in tags_list %}
      <li>
        <a href="{{ site.baseurl }}/tag/{{ tag | slugify }}/">
          {{ tag }}
        </a>
      </li>
    {% endfor %}
  </ul>
</section>
