---
layout: post
authors:
  - name: William
    url: https://willnj.com/
    image: https://avatars.githubusercontent.com/u/26980980?v=4
title: The Fabric of Computing
summary: "Our digital fabric was first woven on the Jacquard loom."
quote: |
  > "Software and cathedrals are much the same – first we build them, then we pray."
  >
  > — Samuel T. Redwine, Jr.
tag: tech
---

The Jacquard loom may not be the first thing that comes to mind when you think about modern computing, but it’s more than just a relic of textile history. In fact, the Jacquard loom set the stage for a number of key computing concepts that we still use today, from punch cards to parallel processing. In this post, let’s explore how this weaving machine, invented in 1801, has shaped the way we think about programming and computers.

## The Loom That Programmed Itself

When Joseph Marie Jacquard invented the [Jacquard loom](https://en.wikipedia.org/wiki/Jacquard_machine), it wasn’t just a new way to weave fabric. It was a breakthrough in automating complex tasks using a series of punched cards. These cards contained patterns of holes that told the loom exactly what to do next. Each punch card represented an instruction that the machine would follow, making it one of the first programmable machines in history. Sound familiar?

{% include image.html 
    src="https://upload.wikimedia.org/wikipedia/commons/0/09/Jacquard.loom.cards.jpg" 
    max-width="500px"
    alt="Punch cards of a Jacquard loom (2004)" 
    caption="Close-up of punch cards from a Jacquard loom, by George H. Williams (public domain)"
%}

Well, if you’ve ever worked with early computers, you might recognize this concept: **punch cards**. They were the primary method of input for early computer systems and are directly inspired by Jacquard’s loom.

## Punch Cards: The DNA of Early Computers

Before the digital age took off, [punch cards](https://en.wikipedia.org/wiki/Punched_card) were used to input instructions into computing machines, from Charles Babbage’s Analytical Engine to IBM’s first computers. Just like the Jacquard loom used punch cards to control the weaving process, early computers used them to store data and commands. This was essentially the beginning of programming.

If you ever sat in school filling in little bubbles on a Scantron test, you’ve already experienced the same principle. Those sheets worked just like punch cards—your answers weren’t read as words or ideas, but as patterns of holes and marks that a machine could process. In both cases, the medium was dumb, but the pattern carried meaning.

Even today, when we use digital languages to program computers, the underlying idea is still the same: we give the machine instructions in a structured way, whether it's a hole in a card, a filled bubble on a Scantron, or a line of code in a script.

### Fun Fact: Why Do We Use Words Like "Threads"?

If you've ever worked with [multi-threaded programming or parallel computing](https://en.wikipedia.org/wiki/Thread_(computing)), you’ve probably encountered the term **“threads.”** In fact, you might have heard it so many times that you didn’t even stop to think about where the term came from. Well, it all goes back to weaving.

In the textile industry, a **thread** is a single strand that weaves through a loom to create a fabric. Similarly, in computing, a **thread** is the smallest unit of execution, working in parallel with other threads to build a program. So when you’re programming a multi-threaded app, you’re essentially “weaving” your program, much like the threads of fabric on a loom.

In modern computing, **multi-threading** allows different parts of a program to run simultaneously, much like how the Jacquard loom could execute multiple threads at once to produce more complex patterns.

## Warps and Wefts: The Parallel Processing Connection

Now, let’s dive a bit deeper into parallel processing. If you’ve ever used a **GPU** (Graphics Processing Unit), you’ve probably heard of **warps**—especially if you’re familiar with **CUDA programming**. A [warp](https://en.wikipedia.org/wiki/Thread_block_(CUDA_programming)) is a group of 32 threads that are processed simultaneously by a GPU core. But why is this called a "warp"?

Here's where it gets interesting: The term **warp** is inspired by the parallel threads used in traditional weaving, specifically the **warp threads**. These are the longitudinal threads that run the length of the fabric, providing the foundation for the weaving process. In the context of computing, **warps** are like these foundational threads—they work together in lockstep to execute tasks simultaneously, weaving a "fabric" of computational results.

So, in essence, just as the Jacquard loom used multiple threads working together in a synchronized pattern, modern processors use **warps** to execute multiple threads in parallel, speeding up computation.

## The Jacquard Loom’s Lasting Impact on Computing

The Jacquard loom’s punch card system wasn’t just a revolutionary concept in weaving—it laid the groundwork for **modern computing**. Its idea of **programming via a series of instructions** (punch cards) gave birth to the digital punch cards used by Babbage and eventually, the broader computing community. It also influenced how we think about tasks being broken down into small, parallel units—whether those are threads in a program or warps on a GPU.

Even the concepts we use today, such as multi-threading and parallel processing, have their roots in the old textile world. So next time you run a program with multiple threads, remember that you're not just executing code—you're weaving a digital fabric, and Jacquard’s loom was one of the first to lay the threads.