# JSON Schema Validator and Data Transformer

You are tasked with creating a Python script that validates JSON data against a provided JSON schema and then applies a transformation to the valid data. Please provide the dependencies as "dependency1\ndependency2" etc. Only provide dependencies that need to be installed from pip.

**Input:**

The input is a JSON object containing three fields:

*   `schema`: A JSON schema definition (as a JSON object).
*   `data`: An array of JSON objects to be validated and potentially transformed.
*   `transform`: A JSON object defining transformation rules. This object has two keys:
    *   `fields_to_uppercase`: An array of field names (strings) to convert to uppercase.
    *   `fields_to_remove`: An array of field names (strings) to remove from the output.

**Processing:**

1.  Iterate through each object in the `data` array.
2.  For each data object, validate it against the `schema`.
3.  If the data object is valid:
    *   Apply the transformation rules specified in the `transform` object.
    * Create a new object with fields to uppercase.
    * Remove specified fields.
4.  If the data object is invalid:
    *   Generate a structured error report.  The error report should be a JSON object with the following structure:
        ```json
        {
          "valid": false,
          "errors": [
            { "path": ["field", "subfield"], "message": "Error message" },
            ...
          ]
        }
        ```
        *   `path`: An array of strings representing the path to the invalid field (e.g., `["age"]` or `["address", "street"]`).
        *   `message`: A string describing the validation error.

**Output:**

The output should be a JSON array where each element corresponds to the result of processing one input data object. If data is transformed, output should be the transformed version. If data fails validation, output should be the error object. Print the output to standard out. Do not include additional information such as "Output:"
