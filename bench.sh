#!/bin/bash
set -euo pipefail

# Ensure the output directory exists
mkdir -p benchmark

# Write CSV header
echo "model,passed_tests" > benchmark/benchmark_results.csv

models=(
  "mistralai/codestral-2501"
  "google/gemini-2.0-flash-001"
  "google/gemini-2.0-flash-lite-preview-02-05:free"
  "google/gemini-2.0-pro-exp-02-05:free"
  "anthropic/claude-3.5-sonnet"
  "openai/gpt-4o"
  "openai/o1-mini" # o3-mini needs tier 3 api lol
  "deepseek/deepseek-r1"
  "deepseek/deepseek-chat"
)

# Loop through each model
for model in "${models[@]}"; do
  echo "Benchmarking model: $model"

  # Optional: Sanitize the model name (not used elsewhere here)
  safe_model_name=$(echo "$model" | tr '/' '_')

  best_passed=-1
  best_time=0

  for i in {1..3}; do
    echo "Run $i/3 for $model"
    
    # Run the benchmark, remove whitespace, and suppress error output
    output=$(bun run index.ts --model "$model" --benchmark 2>/dev/null \
      | tr -d '[:space:]')
    
    if [[ -n "$output" ]]; then
      num_pass=$(echo "$output" | cut -d':' -f1 | bc 2>/dev/null || echo "0")
      time_taken=$(echo "$output" | cut -d':' -f2 | bc 2>/dev/null || echo "0")
      
      if [[ "$num_pass" =~ ^[0-9]+$ && "$time_taken" =~ ^[0-9]+(\.[0-9]+)?$ ]]; then
        # Update best metrics:
        # - Primary: higher number of passed tests.
        # - Tie-breaker: lower time taken.
        if [ "$num_pass" -gt "$best_passed" ]; then
          best_passed="$num_pass"
          best_time="$time_taken"
        elif [ "$num_pass" -eq "$best_passed" ]; then
          cmp=$(echo "$time_taken < $best_time" | bc -l)
          if [ "$cmp" -eq 1 ]; then
            best_time="$time_taken"
          fi
        fi
      fi
    else
      echo "Warning: No output received from $model this run."
    fi
  done

  if [ "$best_passed" -eq -1 ]; then
    best_passed=0
    best_time="N/A"
  fi

  echo "Finished benchmarking $model: Passed $best_passed tests in $best_time ms"
  echo "\"$model\",$best_passed,$best_time" >> benchmark/benchmark_results.csv
done

echo "Benchmarks complete. Results saved to benchmark/benchmark_results.csv."
