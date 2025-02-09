# Hash Table with Separate Chaining

Implement a hash table with separate chaining for collision resolution in C.

**Input:**
The input is a string with two lines:
1. Comma-separated key-value pairs in the format "key:value".
2. The hash table size (an integer).

**Processing:**

1.  Implement a hash table using separate chaining.
2.  Use the following simple modulo hash function: `hash(key) = sum(key_characters) % table_size`.  'sum(key_characters)' means the sum of the ASCII values of the characters in the key.
3.  Insert the key-value pairs from the input into the hash table.

**Output:**

Output a comma-separated string representing the contents of the hash table.  For each bucket, list the key-value pairs in that bucket (using the "key:value" format), separated by semicolons.  Buckets are separated by commas.  Empty buckets should be represented by empty strings between commas.  The order of buckets corresponds to the indices (0 to table_size - 1). Print this output to standard out. Do not include additional information such as "Output:"
