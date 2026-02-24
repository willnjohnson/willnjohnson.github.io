---
layout: post
thumbnail: "/thumb/frustrated.png"
authors:
  - name: William
    url: https://willnj.com/
    image: https://avatars.githubusercontent.com/u/26980980?v=4
title: Interviews Are Broken... Let’s Talk About It
summary: "Why are we still interviewing like this? Modern tech hiring has become a baffling exercise in trivia and acting, completely overlooking the actual skills and collaborative spirit that define effective work."
quote: |
  > "Everybody is a genius. But if you judge a fish by its ability to climb a tree, it will live its whole life believing that it is stupid."
  >
  > — Albert Einstein
tag: tech
---

“What motivates you?” That's often the first question you hear in a behavioral interview. But is it really the right one? Motivation lights the candle. It’s bright, it’s warm—but it’s fleeting. Put a jar over that candle, deprive it of oxygen, and it burns out quickly. Discipline is what keeps the flame alive. Discipline is leaving space for air to enter, letting the light endure.

So why do we keep asking about motivation, as if it’s the secret to lasting work? It’s not. Motivation gets you started; discipline sustains you.

## Behavioral Questions: An Inquisition Without Context

Behavioral interviews lean on their trusty script:

*   “Tell me about a time you led a team.”
*   “Tell me about a time you faced conflict.”

The problem isn’t the questions themselves; it’s the way they’re asked—with no context, no setup. They’re dropped into conversation like pop quizzes. Instead of a dialogue, it’s an inquisition. You end up reaching for canned stories you’ve polished to death using the STAR method, or you scramble to invent a narrative on the spot. Neither feels authentic.

## The Technical Gauntlet

Not one, but *two*. Sometimes even *four* rounds of interviews.

*   You talk with the Hiring Manager.
*   You talk with the Development Team.
*   You talk with the Lead Senior Engineer.
*   You talk with the CEO.

{% include image.html 
    imgur="yKVchaI.png" 
    max-width="500px"
    alt="The Interviewing Process" 
 %}

Contrast that with years ago. You’d drive to the office, shake hands, slide your résumé (and maybe a business card) across the desk, and actually talk. Maybe you’d walk to a whiteboard—an actual whiteboard, not a digital one—and sketch out a design pattern for a specific task, debug a snippet of code, normalize a database schema, or walk through some pointer arithmetic. The conversation was grounded in practice, in collaboration.

Today, the questions are different: **“Invert this binary tree.”** Something you probably did once in university and never again. You stare at the online editor, trying to recall the exact sequence, or if the base case in your recursion implementation is correct, while the interviewer—who has never inverted a binary tree in production—waits silently.

*Psst. In real life? We use StackOverflow. We use manpages. We ask our colleagues. We use frameworks and libraries with the tools already provided for us. We use AI. That’s the job.*

Back then, the test was: *can you think through design?* Now, the test is: *can you memorize problems from a book you bought off Amazon? And sometimes, the books become heavily outdated or irrelevant!*

{% include image.html 
    imgur="Iy0Wqil.jpeg" 
    max-width="500px"
    alt="Stack of Books"
    caption="Stack of Books" 
 %}

## The Fortune 300 Paradox

Wait, why is everyone calling them "FAANG companies"? And is Netflix still relevant, or does the 'N' stand for NVIDIA now?

There’s some logic here. Big companies want scalable filters. Running candidates through algorithm drills looks rigorous. But once people know the game, they just study and memorize LeetCode problems until the solutions are drilled in.

It’s like testing a chef by asking them to recite recipes from memory, word for word. They might know the list of ingredients—but can they actually cook?

## The Illusion of Automation

This is where it gets really murky. In an attempt to "streamline" hiring, more and more companies are leaning on AI or automated systems to filter candidates. Résumé screeners, initial coding challenges with strict time limits, even sentiment analysis on video interviews. The idea is to weed out the "bad" fits efficiently.

The problem? You don't truly know a candidate unless you talk with them, or, better yet, have worked with them for a good length of time. Automating this crucial human interaction is fraught with peril. If you build a system designed for automated input, don't be surprised when candidates start providing automated, impersonal responses—or worse, adding exaggerated numbers and details to fluff up their résumé or using AI to cheat on a technical interview. We've now incentivized candidates to beat the machine, not to excel at the job.

## Conundrums in Hiring

We face a few recurring issues that make no sense:

*   **Expecting one individual to have every piece of expertise.** Well, Rome wasn’t built in a day—and it wasn’t built by one individual either. Sure, it's *possible*, but it's unrealistic. Ultimately, the organization builds the organism; we thrive by mutualism, like worker ants and bees.

*   **Expecting hyper-specific skills in hyper-specific languages.** Believe it or not, computer scientists are adaptable. There’s a reason *K&R’s C Programming Language* book is so highly regarded and why professors don't tell students to buy a book on every programming language out there: it teaches the foundations. You learn one system deeply, and suddenly the next language comes easier. The real skill isn’t memorization—it’s knowing how to look things up, how to adapt, and how to collaborate.

*   **Ignoring the ecosystem.** If I’m fumbling with something, I don’t reinvent the wheel in isolation. I talk with my team. I ask the senior engineer. We hash it out in a standup, or on Slack. We plan the roadmap together. Again, the ecosystem builds the individual.

Hmm... How do you think a C++ programmer would adapt to writing Java code?
```
// TODO: Fix this. Java requires this block of code for some reason when I'm compiling with g++.
// vvvvvv IGNORE THIS BLOCK OF CODE vvvvvv
        %:include <iostream>
        %:define System S s;s
        %:define public
        %:define static
        %:define void int
        %:define main(x) main()
        struct F <% int println(const char* s) <% std::cout << s << std::endl; return 0; %>%>;
        struct S <% F out; %>;
// ^^^^^^ IGNORE THIS BLOCK OF CODE ^^^^^^

// My first Java program
public static void main(String[] args) {
  System.out.println("I love Java!");
}
```

## Why Behavioral Questions Get So Much Hate

Behavioral interviews often get painted as the villain. And honestly, they deserve some of it—they focus more on how well you can *perform a story* than how you’ll actually *perform on the job.*

But here’s the irony: behavioral could be the most useful. Instead of *“tell me about a time you disagreed with a coworker,”* what if it was:

> “Imagine you’re working on a specific feature. Mid-sprint, a teammate strongly disagrees with your approach. What happens next?”

That’s a conversation. That’s context. That’s useful.

## So What’s the Fix?

It’s not rocket science; it's about reorienting towards reality:

*   **Contextual Behavioral Questions** → Stop the vague prompts. Give scenarios.
*   **Practical Technical Questions** → Test debugging, critical thinking, and technical breadth, not just algorithms.
*   **Collaborative Interviews** → Pair programming, design and code reviews, roadmap discussions. See how candidates think with others.
*   **Respect Time and Energy** → Two rounds, not four. Your candidates likely have many interviews for different companies, so let's cut to the chase.
*   **Balance Between Theory and Practice** → Yes, ask about fundamentals—but tie them to real-world use.

Ultimately, interviewing should follow a core principle: **"You are not the user."** Just as software engineers gather user stories and perform A/B testing to understand the product's audience, shouldn't we apply the same empathy and data-driven approach to understanding our candidates? We need to think like the user (the job candidate) to get real insights.

## Keep It Simple, Stupid

At the end of the day, interviewing should answer one question: *can this person do the work, and do it with us?* That doesn’t require four Zoom calls, a binary tree pop quiz, and a behavioral inquisition.

Sometimes, all it takes is a whiteboard, a good question, and an actual conversation. See you on the next TED talk! {% include fa.html icon="face-smile-wink" %}