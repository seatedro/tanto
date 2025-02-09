# Lock-Free SPSC Queue

Implement a lock-free Single-Producer, Single-Consumer (SPSC) queue in Rust using atomic operations. Use any crates needed.

**Input:**

The input is a comma-separated string of integers.

**Processing:**

1.  Implement a lock-free SPSC queue.  You must use atomic operations (e.g., `AtomicUsize`, `AtomicPtr`) and avoid using any mutexes or other locking mechanisms.
2.  Simulate a producer thread.  This "thread" should enqueue the integers from the input string into the queue.
3.  Simulate a consumer thread.  This "thread" should dequeue integers from the queue until it's empty.

**Output:**

The output should be a comma-separated string of the dequeued integers, in the order they were dequeued. Print the output string to standard out. Do not include additional information such as "Output:"
