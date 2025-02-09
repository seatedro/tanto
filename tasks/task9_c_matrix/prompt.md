# Matrix Multiplication

Implement matrix multiplication in C.

**Input:**

Two square integer matrices, A and B, are provided as a single string. The matrices are separated by a pipe symbol (`|`).  Within each matrix, rows are separated by semicolons (`;`), and elements within a row are separated by commas (`,`).

**Processing:**

1.  Parse the input string into two matrices, A and B.
2.  Implement standard matrix multiplication to compute C = A * B.  Do *not* optimize the matrix multiplication (i.e., use the naive O(n^3) algorithm).
3. Implement matrix multiplication to compute C = A * B again. Optimize using techniques such as loop unrolling, blocking, or SIMD instructions.

**Output:**

The resulting matrix C (A * B) should be output as a string in the same format as the input matrices (rows separated by semicolons, elements separated by commas). Print the output to standard out. Do not include additional information such as "Output:"

**Example:**

Sample Input:
```
1,2;3,4|5,6;7,8
```

Sample Output:
```
19,22;43,50
```

