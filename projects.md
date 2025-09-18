---
layout: default
title: Projects
---

# Projects

Welcome to my portfolio of projects! Here, you'll find a showcase of different programming projects I've worked on, from academic projects to personal explorations in software development.

You can find my various works on <a href="https://github.com/willnjohnson" class="github-link"><i class="fab fa-github"></i> GitHub</a>.

## Past Projects

My past projects span both academic coursework and personal explorations. Several were developed as university assignments: **WeatherApp** was a comprehensive semester-long project for my Software Engineering class, **Icarus** a two-week Computer Graphics assignment, and **4DOF Manipulation** a Human-Computer Interaction project. Others, like **Shapeshifter Helper**, **ChatGPT Bulk Deleter**, and **SigTail**, were created for personal use or to serve online communities, demonstrating my interest in practical problem-solving across different domains.

<div class="image-grid grid-cols-auto">
{% for project in site.data.projects.past %}
<a href="{% if project.url %}{{ project.url }}{% elsif project.website %}{{ project.website }}{% else %}https://github.com/willnjohnson/{{ project.github }}{% endif %}" style="text-decoration: none; color: inherit; display: block;">
<div class="grid-item{% if project.image %} has-image{% endif %}" style="background-color: {{ project.color }}; {% if project.image %}background-image: url('{{ project.image }}'); background-size: cover; background-position: center;{% endif %} padding: 20px; text-align: center; border-radius: 12px; color: {{ project.text_color }};">
<h3>{{ project.name }}</h3>
<p>{{ project.description }}</p>
</div>
</a>
{% endfor %}
</div>

In my development work, I enjoy exploring diverse technologies and programming paradigms. I frequently experiment with different languages and frameworks. This curiosity has led me to create various scripts or tools to make life more convenient, or to just have fun.