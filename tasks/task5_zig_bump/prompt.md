# Simple Bump Allocator

Implement a simple bump allocator in Zig. Use the latest Zig version to write the code.

**Input:**

The input is a string with two lines:
1. The total allocation size (in bytes) as an integer.
2. A series of allocation requests (in bytes) as comma-separated integers.

**Processing:**

1.  Implement a bump allocator.
2.  Initialize the allocator with the given total allocation size.
3.  Process each allocation request sequentially:
    *   If there is enough space remaining in the total allocation, allocate the requested memory by simply incrementing a pointer (the "bump" pointer).
    *   If there is not enough space, the allocation fails.

**Output:**

Output a comma-separated string representing the following: If an allocation *succeed* print T, if an allocation *fails* (out of memory), output "OOM" for that request. Print this output to standard out. Do not include additional information such as "Output:"
