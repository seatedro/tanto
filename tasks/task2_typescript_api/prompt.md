# Mock API Client and Data Aggregator

You are tasked with creating a TypeScript script that simulates interaction with a REST API and aggregates data based on a provided rule.

**Input:**

The input is a JSON object with three fields:

*   `apiSpec`: A JSON object defining the API specification. This includes endpoints, request methods, and response schemas.  The `/posts/{userId}` endpoint uses a path parameter.
*   `responses`: An array of JSON objects simulating API responses. Each object has a `url`, `status`, and `data` field.
*   `aggregation`: A JSON object defining the aggregation rule.  This has a `groupBy` field (the field to group by) and an `aggregate` object (specifying aggregation functions like "count").

**Processing:**

1.  Implement a mock API client.  This client should *not* make actual network requests. Instead, it should:
    *   Take a URL as input.
    *   Find the matching simulated response in the `responses` array based on the URL.  Handle path parameters (e.g., `/posts/1`).
    *   If a match is found and the status is 200, return the `data` from the simulated response.
    *   If no match is found or the status is not 200, throw an error.
2.  Use the mock API client to fetch data from the following endpoints:
    *   `/users`
    *   `/posts/{userId}` for each user ID retrieved from `/users`.
3.  Aggregate the data according to the `aggregation` rule. For example, if `groupBy` is "userId" and `aggregate` is `{ "postCount": "count" }`, you should count the number of posts for each user.

**Output:**

The output should be a JSON array representing the aggregated data. Print this JSON array to standard out using indentation 2. Do not include additional information such as "Output:"
