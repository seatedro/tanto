#!/bin/bash

models=(
  "mistralai/mistral-small-24b-instruct-2501"
  "google/gemini-2.0-flash-001"
  "google/gemini-2.0-flash-lite-preview-02-05:free"
  "google/gemini-2.0-pro-exp-02-05:free"
  "anthropic/claude-3.5-sonnet"
  "openai/gpt-4o-mini"
  "openai/o1-mini" # o3-mini needs tier 3 api lol
  "deepseek/deepseek-r1"
  "deepseek/deepseek-chat"
)

# Loop through each model
for model in "${models[@]}"; do
  echo "Benchmarking model: $model"

  # Sanitize the model name for use in filenames (replace / with _)
  safe_model_name=$(echo "$model" | tr '/' '_')

  # Construct the hyperfine command
  hyperfine \
    --runs 3 \
    --export-csv "benchmark/results_${safe_model_name}.csv" \
    "bun run index.ts --model \"{model}\" --benchmark" \
     --command-name "$model"

done

echo "Benchmarks complete. Results saved to CSV files."
