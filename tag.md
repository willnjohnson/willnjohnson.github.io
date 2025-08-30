---
layout: default
title: "All Tags"
permalink: /tag/
---

<section class="tags-index">
  <h1>All Tags</h1>
  <ul>
    {% assign tags_list = site.tags | sort %}
    {% for tag in tags_list %}
      <li>
        <a href="{{ site.baseurl }}/tag/{{ tag[0] | slugify }}/">
          {{ tag[0] }} ({{ tag[1].size }})
        </a>
      </li>
    {% endfor %}
  </ul>
</section>
