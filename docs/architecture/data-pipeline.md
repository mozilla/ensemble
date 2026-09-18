# Data pipeline

This repository makes a website to render data. It does not produce, store, or transform the data. This file describes where that data comes from and which repositories are involved.

## Terms

GCS = Google Cloud Storage, a static file server.
Airflow = Apache Airflow, a general-purpose workflow scheduler/orchestrator.

## The weekly job

[`mozilla/telemetry-airflow`](https://github.com/mozilla/telemetry-airflow) owns the Airflow DAG
[`firefox_public_data_report`](https://github.com/mozilla/telemetry-airflow/blob/main/dags/firefox_public_data_report.py),
which runs every Monday at 01:00 UTC. Three chains feed into one final task:

    wait_for_main_ping ─────────▶ hardware_report_query ─▶ hardware_report_export ─┐
    wait_for_clients_last_seen ─▶ user_activity ──────────▶ user_activity_export ──┼─▶ ensemble_transposer
    annotations_export ────────────────────────────────────────────────────────────┘

The `hardware_report_export`, `user_activity_export`, and `annotations_export` tasks run
[`mozilla/firefox-public-data-report-etl`](https://github.com/mozilla/firefox-public-data-report-etl),
which queries BigQuery for hardware, user activity, and annotation data and writes the raw JSON to
the `moz-fx-data-static-websit-8565-analysis-output` GCS bucket.

The final task the DAG runs is [`mozilla/ensemble-transposer`](https://github.com/mozilla/ensemble-transposer) - which reformats the raw
JSON into the structure used by ensemble's front-end, and writes it to the
GCS bucket that the front-end fetches from.

## How to check whether the data is current

1. Find the current real source URL for whichever dataset you care about. (example: [hardware](https://analysis-output.telemetry.mozilla.org/public-data-report/hardware/hwsurvey-weekly.json))
2. Fetch that URL and look at the most recent date in its data.
3. Compare that date to today's. Reports are named for the day the report coverage starts so 2026-09-07 covers 9-7 to 9-13. If the date is more than 2 weeks ago - something in the pipeline above has broken and Data Engineering will need to help. 

## Alerting

DE gets an email when `firefox_public_data_report` itself fails, no further monitoring exists AFAIK.