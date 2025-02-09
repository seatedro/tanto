# Simple Linear Regression Implementation

Implement simple linear regression from scratch in Zig. Do *not* use any external libraries for the core regression calculation. Use the latest Zig version to write the code.

**Input:**

The input is a string containing semicolon-separated pairs of comma-separated (x, y) data points.

**Processing:**

1.  Parse the input string into (x, y) data points.
2.  Implement the linear regression algorithm to find the best-fit line (y = mx + b). Use the formulas:
    *   m = (nΣxy - ΣxΣy) / (nΣx² - (Σx)²)
    *   b = (Σy - mΣx) / n
    *   where 'n' is the number of data points, Σ represents summation.

**Output:**

Output a comma-separated string representing the slope (m) and y-intercept (b) of the best-fit line. Print this output to standard out. Do not include additional information such as "Output:"
