---
layout: default
title: Projects
---

# Projects

Welcome to my portfolio of projects! Here, you'll find a showcase of different programming projects I've worked on, from academic projects to personal explorations in software development.

You can find my various works on <a href="https://github.com/willnjohnson" class="github-link"><i class="fab fa-github"></i> GitHub</a>.

## Current Projects

I'm currently developing two major projects that reflect my passion for literature and technology. **Bisclavret** is an AI-powered story writer built with ReactJS, Tauri, and Vite, designed to explore the viability of automated story writing. This project serves as a proof-of-concept for more ambitious translation work, testing whether AI can effectively handle narrative generation. Bisclavret is a companion project and a precursor to Chevrefoil.

**Chevrefoil**, inspired by my 2019 exploration of medieval literature, addresses a common frustration in multilingual reading. When studying epic cycles like the Roland cycle, I found myself switching between French and Italian editions, losing context with each transition and relying heavily on Google Translate. Chevrefoil aims to provide side-by-side text display of original and translated works, with useful annotations explaining cultural references, wordplay, and linguistic nuances that don't survive translation. It's 2025, and I believe AI is at that stage where it can effectively and meaningfully translate works.

<div class="image-grid grid-cols-2">
{% for project in site.data.projects.current %}
<a href="{% if project.url %}{{ project.url }}{% elsif project.website %}{{ project.website }}{% else %}https://github.com/willnjohnson/{{ project.github }}{% endif %}" style="text-decoration: none; color: inherit; display: block;">
<div class="grid-item{% if project.image %} has-image{% endif %}" style="background-color: {{ project.color }}; {% if project.image %}background-image: url('{{ project.image }}'); background-size: cover; background-position: center;{% endif %} padding: 20px; text-align: center; border-radius: 12px; color: {{ project.text_color }};">
<h3>{{ project.name }}</h3>
<p>{{ project.description }}</p>
</div>
</a>
{% endfor %}
</div>

I'm looking for open-source maintainers and collaborators.

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