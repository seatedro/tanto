# tanto

An opinionated LLM benchmark that goes beyond webslop.

**Prerequisites:**

*   [Bun](https://bun.sh/)
*   [Nix](https://nixos.org/download.html) (for the development environment)
*   An OpenRouter API key (set as the `OPENROUTER_API_KEY` environment variable)

**Installation:**

1.  **Clone the repository:**

    ```bash
    git clone git@github.com:seatedro/tanto.git
    cd tanto
    ```

2.  **Enter the Nix development shell:**

    ```bash
    nix develop
    ```
    (This will automatically install the necessary dependencies defined in `flake.nix`.)

3.  **Set your OpenRouter API key:**

    Create a `.env` file in the root of the project and add your OpenRouter API key:

    ```
    OPENROUTER_API_KEY=your-openrouter-api-key
    ```

**Running the Benchmarks:**

1.  **Run the benchmark script:**

    ```bash
    ./bench.sh
    ```

    This script will run the benchmark for all models defined in the `models` array within the script.  The results will be saved to separate CSV files (one per model) in the benchmark directory.  The format is `results_<model_name>.csv`, where `<model_name>` has `/` characters replaced with `_`.

**Adding New Tasks:**

1.  **Create a new directory:** Inside the `tasks/` directory, create a new directory for your task.  The directory name should follow the format `task<number>_<language>_<description>`, e.g., `task11_odin_shader`.

2.  **Create the necessary files:**

    *   `prompt.md`: A Markdown file containing the task description.  This should clearly explain the task, the expected input, and the desired output format.
    *   `tests/`: A directory containing test cases.
        *   `tests/0/`: Directory for the first test case.
            *   `input.txt` or `input.json`: The input for the first test case.
            *   `expected_output.txt` or `expected_output.json`: The expected output for the first test case.
        *   `tests/1/`: Directory for the second test case (and so on).
    * You can have a single test case without a `tests` directory, place `input.<ext>` and `expected_output.<ext>` directly inside the task directory.

3. **Update Tasks:** Make sure to populate the file contents.

**Customizing the Model:**

You can specify a model using the `--model` flag when running the benchmark directly (this is primarily for development and testing individual tasks):

```bash
bun run benchmark/index.ts --model "google/gemini-2.0-flash-001"
