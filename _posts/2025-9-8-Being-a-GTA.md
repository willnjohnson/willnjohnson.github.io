---
layout: post
authors:
  - name: William
    url: https://willnj.com/
    image: https://avatars.githubusercontent.com/u/26980980?v=4
title: Being a GTA
summary: "Office hours, grading midterms, deciphering solutions submitted by student, and why teaching has its moments."
quote: |
  > "Those who know, do. Those that understand, teach."
  >
  > — Aristotle
tag: life
---

Being a Graduate Teaching Assistant is both chill and chaotic. Some days, you’re sipping coffee in a half-empty lab waiting for students who never show up. Other days, you’re knee-deep in final exams wondering why some students don't seem to know how a semaphore works. It’s a mixed bag, but honestly, one of the more meaningful things I’ve done in grad school.

### Office Hours

Most students don’t show up to office hours. That’s just the reality. I usually spend that time grading or catching up on other work. But I still hope someone walks in.

When they do, it’s often the best part of my day. Some students want to dive deeper into a concept. I’ll happily jump to the whiteboard to explain how MAC Attack works, or go over bit shifting with an example. Others just want to know why they lost points. I’ll pull up their submission, go over my comments, and if I misread something or made a mistake, I’ll own up to it and fix it. Not a big deal.

Honestly, I like that part of being a GTA. It’s like mini tutoring sessions, but more conversational.

### Grading

Grading can be fun or frustrating, depending on the course.

Human-Computer Interaction (HCI) was one of the fun ones. Students submitted design projects, often with videos. You could tell who really cared about the work. Those were a blast to review.

Then there was Applied Cryptography. I requested that class because I’m into cybersecurity, and it was a great fit. Students asked questions I was genuinely interested in, and I could answer a lot without even pulling up FIPS or some other technical document until I needed it. It felt natural. And the professor for that class introduced me to Docker containers (Portainer) to help manage students' online submissions, so it was nice to learn about that piece of technology along the way.

Operating Systems, on the other hand... not so fun. I had to grade typed midterm and final responses based on OSTEP, or *Operating Systems: Three Easy Pieces*. The professor gave me a list of keywords to look for in each answer. Sounds simple, but it gets tricky. Some students clearly understood the concept but didn’t use any of the keywords. I had to decide whether to reward the logic or stick to the rubric. Those kinds of judgment calls are exhausting.

### The AI Problem

Now for the part that’s been getting worse: AI in student work.

Sometimes I’ll read an answer and it just feels off. Too formal, too clean, or worded in a way that doesn’t match the student’s usual style. Feels like ChatGPT. But unless I’m absolutely certain, I can’t do much. 99% confidence still isn’t 100%.

And the irony? AI doesn’t always help students. Especially in Operating Systems. Some AI-generated answers were flat-out wrong. They sounded convincing but totally missed what the professor was asking. The students who did their own work, cited the textbook, and wrote in their own words? They usually crushed it.

{% include image.html 
    imgur="ZtcY8Lb.png" 
    max-width="500px"
    alt="Decision"
 %}

I also saw some possible AI use in a Blockchain assignment called "Quotechain." Students had to build a chain of quotes and hash them block by block. Language choice was up to them. It was a straightforward assignment. But I noticed two students submitted code that had a very similar structure — same class usage, variable names, flow. And their previous assignments didn't follow the pattern of this assignment. I was suspicious. So I fed the assignment description into ChatGPT, and sure enough, it produced something eerily close to their code.

Could I prove they used it? Not completely. So I didn’t flag it. It was also their last assignment of the semester, and the project was relatively simple anyway. If they used AI, they probably spent more time debugging than they would’ve writing it from scratch (in my own experience, it took maybe 30 lines of code, so having fancy classes and variable names was completely unnecessary). At the end of the day, they hurt themselves more than anything.

### My Take on AI

I didn’t get access to tools like ChatGPT during undergrad. It wasn’t really a thing until late 2022, and by then I was nearly done with my Bachelor’s. Man, I still remember the crazy moments trying to wrap my head around implementing Dekel-Nassimi-Sahni's parallel matrix multiplication in MPI, and all of the other programming ventures along the way. But since starting grad school, I’ve tried using AI for a few things — mostly just to test it. Mixed results.

Ask ChatGPT for something like “prove that the union of countably many countable sets is countable,” and it fumbles. It creates a convincing, but incorrect response. I usually have to check Math StackExchange anyway. Man, can you imagine reading the word *count* three times in one sentence!?

I think CS professors are already adapting. A lot of them are designing problems that AI just doesn’t handle well. They’ll write exam questions in ways that force reasoning or creative thinking, or citation. Plus, I think those professors have a network of professors they collaborate with to create unique questions, so students don't look up on Chegg or other publicly available resources.

### Final Thoughts

If you’re in college, you’re paying for it. In time, money, and effort. So why take shortcuts?

I get it — school can be overwhelming. But when you outsource your learning to an AI tool, you’re not gaming the system. You’re short-circuiting your own development. That comes back to bite later.

Being a GTA reminded me how valuable genuine effort is. The students who ask questions, show up to office hours, and put thought into their work? It shows. And those are the ones who really get something out of their education.

If you’re considering being a GTA, I say go for it. You’ll teach, but you’ll also learn a lot more than you expect. And if you're a student, then take the opportunity to visit office hours. We enjoy your company!