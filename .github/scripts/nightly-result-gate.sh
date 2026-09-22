#!/usr/bin/env bash
# Fails when the Playwright job of a run produced no verdict.
#
# A job that timeout-minutes cancels concludes 'cancelled' no matter what its
# always() steps exit with, so nothing inside that job can turn its run red.
# This runs after it, from a job of its own.
#
#   .github/scripts/nightly-result-gate.sh              # the run this job is in
#   .github/scripts/nightly-result-gate.sh 35554827617  # any past run
set -u

run_id="${1:-${GITHUB_RUN_ID:-}}"
repo="${GITHUB_REPOSITORY:-dataquest-dev/dspace-angular}"
job="${SUITE_JOB_NAME:-playwright-tests}"

if [ -z "$run_id" ]; then
  echo "usage: $(basename "$0") <run-id>" >&2
  exit 2
fi

if ! conclusion=$(gh api "repos/$repo/actions/runs/$run_id/jobs?per_page=100" \
    --jq "[.jobs[] | select(.name == \"$job\") | .conclusion] | first"); then
  echo "::error title=End-to-end gate produced no result::Could not read run $run_id from the Actions API, so there is nothing to report."
  exit 1
fi

if [ "$conclusion" = "success" ] || [ "$conclusion" = "failure" ]; then
  echo "Run $run_id: job '$job' concluded '$conclusion' - the suite reached a verdict."
  exit 0
fi

case "$conclusion" in
  ""|null) conclusion="no conclusion at all" ;;
esac
echo "::error title=End-to-end gate produced no result::Run $run_id: job '$job' ended with '$conclusion', which is neither success nor failure. The suite never reached a verdict, so this run says nothing about the instance. 'cancelled' is the job time limit or an abort."
exit 1
