# Binary Log Parser Implementation

Implement a binary log parser and writer from scratch in Rust. Use any crates needed.

**Input:**

The input is a string with three lines:
1. Operation type ("write" or "parse")
2. For write: Record type (1 byte, hex), timestamp (u64), payload (hex bytes)
   For parse: Hex bytes of the record
3. For write: Empty line
   For parse: Number of bytes to parse (integer)

**Processing:**

1. Parse the input string based on operation type
2. Implement the binary log format:
    * Record Length (4 bytes, u32, little-endian)
    * Timestamp (8 bytes, u64, little-endian)
    * Type (1 byte)
        * 0x01: Measurement
        * 0x02: Status
        * 0x03: Alert
    * Payload (variable length)
    * CRC32 (4 bytes, little-endian)
3. For write: Create a valid record with CRC32
   For parse: Parse and validate the record including CRC32

**Output:**

For write: Output the hex string of the binary record (lowercase, no spaces)
For parse: Output comma-separated values: record_type,timestamp,payload_hex,bytes_consumed
