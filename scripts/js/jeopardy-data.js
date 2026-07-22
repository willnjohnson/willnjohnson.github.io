/*
 * Jeopardy! — default game.
 *
 * Game schema:
 *   game_name            : string, display name
 *   daily_doubles_enabled: boolean, default for whether Daily Doubles are
 *                           in play (host can still override at setup)
 *   categories           : array of { name, clues: [...] }
 *                           each category has exactly 5 clues, values
 *                           200/400/600/800/1000 in order
 *   clue                 : { question, answer, daily_double }
 *                           "question" is the clue shown to teams (the
 *                           "answer" in real Jeopardy phrasing); "answer"
 *                           is the expected response, e.g. "What is X?"
 *   final_jeopardy       : { category, question, answer }
 */
window.JEOPARDY_DEFAULT_GAME = {
  game_name: "CS Jeopardy!",
  daily_doubles_enabled: true,
  categories: [
    {
      name: "Algorithms",
      clues: [
        {
          value: 200,
          question: "This divide-and-conquer sorting algorithm picks a pivot, partitions the array around it, and averages O(n log n) time.",
          answer: "What is Quicksort?",
          daily_double: false,
        },
        {
          value: 400,
          question: "This graph traversal technique uses a queue and explores all neighbors at the current depth before moving deeper.",
          answer: "What is Breadth-First Search (BFS)?",
          daily_double: false,
        },
        {
          value: 600,
          question: "Dijkstra's algorithm produces incorrect shortest paths when a graph contains edges with this property.",
          answer: "What is a negative edge weight?",
          daily_double: false,
        },
        {
          value: 800,
          question: "This technique for solving optimization problems breaks them into overlapping subproblems and stores solutions to avoid recomputation.",
          answer: "What is dynamic programming?",
          daily_double: false,
        },
        {
          value: 1000,
          question: "Unlike Dijkstra's algorithm, this shortest-path algorithm can detect a negative-weight cycle reachable from the source.",
          answer: "What is the Bellman-Ford algorithm?",
          daily_double: false,
        },
      ],
    },
    {
      name: "Data Structures",
      clues: [
        {
          value: 200,
          question: "This linear data structure follows First-In-First-Out (FIFO) order.",
          answer: "What is a queue?",
          daily_double: false,
        },
        {
          value: 400,
          question: "In a binary search tree, this traversal visits nodes in ascending sorted order.",
          answer: "What is an in-order traversal?",
          daily_double: false,
        },
        {
          value: 600,
          question: "This self-balancing binary search tree maintains a color property on each node to guarantee O(log n) operations.",
          answer: "What is a red-black tree?",
          daily_double: false,
        },
        {
          value: 800,
          question: "This structure maps keys to array indices with a hash function, offering average O(1) lookup.",
          answer: "What is a hash table (hash map)?",
          daily_double: false,
        },
        {
          value: 1000,
          question: "This tree-shaped structure maintains the heap property and commonly implements a priority queue with O(log n) insertion.",
          answer: "What is a (binary) heap?",
          daily_double: true,
        },
      ],
    },
    {
      name: "Systems",
      clues: [
        {
          value: 200,
          question: "This part of the OS is responsible for allocating CPU time among competing processes.",
          answer: "What is the scheduler?",
          daily_double: false,
        },
        {
          value: 400,
          question: "This form of memory corruption occurs when a program writes past the end of an allocated buffer.",
          answer: "What is a buffer overflow?",
          daily_double: false,
        },
        {
          value: 600,
          question: "This synchronization primitive allows only one thread to access a critical section at a time.",
          answer: "What is a mutex (lock)?",
          daily_double: false,
        },
        {
          value: 800,
          question: "This OS technique gives each process the illusion of its own contiguous address space by mapping it onto physical memory.",
          answer: "What is virtual memory?",
          daily_double: false,
        },
        {
          value: 1000,
          question: "This condition occurs when two or more processes each wait on a resource held by the other, and none can proceed.",
          answer: "What is deadlock?",
          daily_double: false,
        },
      ],
    },
    {
      name: "Architecture",
      clues: [
        {
          value: 200,
          question: "This CPU technique overlaps the execution of multiple instructions by splitting execution into stages.",
          answer: "What is pipelining?",
          daily_double: false,
        },
        {
          value: 400,
          question: "This type of cache miss occurs the very first time data is accessed, since it was never in the cache to begin with.",
          answer: "What is a compulsory (cold) miss?",
          daily_double: false,
        },
        {
          value: 600,
          question: "This structure records the outcome of recent conditional branches to help guess a future branch's direction.",
          answer: "What is a branch predictor (branch history table)?",
          daily_double: false,
        },
        {
          value: 800,
          question: "This pipeline hazard occurs when an instruction depends on the result of a previous instruction that hasn't finished yet.",
          answer: "What is a data hazard?",
          daily_double: false,
        },
        {
          value: 1000,
          question: "This execution paradigm lets a processor execute instructions out of program order, as long as data dependencies are respected.",
          answer: "What is out-of-order execution?",
          daily_double: false,
        },
      ],
    },
    {
      name: "Security",
      clues: [
        {
          value: 200,
          question: "This attack tricks a user into revealing sensitive information by masquerading as a trustworthy source, often via email.",
          answer: "What is phishing?",
          daily_double: false,
        },
        {
          value: 400,
          question: "This class of vulnerability lets an attacker inject malicious statements through unsanitized input into a database query.",
          answer: "What is SQL injection?",
          daily_double: false,
        },
        {
          value: 600,
          question: "This attack floods a target with traffic from many compromised machines at once to make a service unavailable.",
          answer: "What is a DDoS (distributed denial-of-service) attack?",
          daily_double: true,
        },
        {
          value: 800,
          question: "This cryptographic scheme uses two mathematically linked keys, one public and one private.",
          answer: "What is asymmetric (public-key) cryptography?",
          daily_double: false,
        },
        {
          value: 1000,
          question: "This principle states a user or process should be granted only the access rights strictly necessary to do its job.",
          answer: "What is the principle of least privilege?",
          daily_double: false,
        },
      ],
    },
  ],
  final_jeopardy: {
    category: "Computer Science Pioneers",
    question: "This mathematician, considered a father of theoretical computer science, proposed a hypothetical machine used to formally define computation and mechanical proof.",
    answer: "Who is Alan Turing?",
  },
};
