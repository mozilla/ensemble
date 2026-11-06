# Deploy

This file describes where the built site is hosted, how requests reach it, who can change it, and
how it has been uploaded in the past. It records what was verified on 2026-11-06; every claim names
its source so it can be re-checked. There is no deploy automation. Building one is WT-1916.

For the data the site renders, see `data-pipeline.md`. For the code, see `frontend.md`.

## Terms

GCS = Google Cloud Storage, a static file server.
CDN = Google Cloud CDN, caching in front of a Google global HTTPS load balancer.
Tenant = a unit of infrastructure in `mozilla/webservices-infra`, with its own GCP projects,
Terraform, and owning team.
Workgroup = a managed group of people granted access to GCP resources.

## Where the site is served from

| | Prod | Stage |
|---|---|---|
| GCP project | `moz-fx-data-static-websit-8565` | `moz-fx-data-static-websit-f7e0` |
| Bucket | `moz-fx-data-static-websit-8565-ensemble` | `moz-fx-data-static-websit-f7e0-ensemble` |
| Hostname | `data.firefox.com` | `dfc-stage.data-static-websites.nonprod.webservices.mozgcp.net` |
| DNS | CNAME to `dfc-prod.data-static-websites.prod.webservices.mozgcp.net` | no vanity domain |
| Front-end content | v1.2.1, commit `f655559`, uploaded 2025-05-12 | v1.2.0, commit `f0658a8`, uploaded 2023-06-14 |
| `datasets/` content | rewritten weekly by the transposer | snapshot from 2023-06-19, never updated |
| Deep links | work (see below) | return 404 |

Both buckets belong to the `data-static-websites` tenant in
[`mozilla/webservices-infra`](https://github.com/mozilla/webservices-infra/tree/main/data-static-websites),
a shared tenant that also hosts telemetry.mozilla.org, performance.mozilla.org,
analysis-output.telemetry.mozilla.org, firefox-admin-docs.mozilla.org, and protosaur.dev. Its
Terraform is owned by `@mozilla/cloud-engineering-wg` (CODEOWNERS) and its GCP projects are
administered by the `dataplatform/admins` workgroup. The tenant's `risk_level` is `low`.

Ensemble is one entry, keyed `"ensemble"`, in the `cdn` map in `tf/prod/locals.tf` and
`tf/stage/locals.tf`, plus a `module "ensemble_bucket"` block in each environment's `cdn.tf`. Both
were added by Data Engineering in June 2023 (`d0975e2519` stage, `609c8b4fb8` prod) when the site
moved from AWS to GCP. Stage was uploaded to once, as part of that move, and never again.
`public/contribute.json` still lists the AWS-era stage host `data-ensemble.stage.mozaws.net`, which
no longer resolves.

## How requests are served

**Load balancer and CDN.** Each `cdn` entry gets a global HTTPS load balancer, a Google-managed
certificate, and a backend bucket with Cloud CDN enabled, via
`mozilla/terraform-modules//google_cdn-external` (tag `google_cdn-external-0.4.0`). The CDN policy
is `FORCE_CACHE_ALL`, `max_ttl = 0`, `serve_while_stale = 86400`. In practice the edge caches every
object, revalidates on the next request, and may serve a stale copy for up to a day while it does.
Live responses carry `age:` headers of several hours. Purging the cache needs
`compute.urlMaps.invalidateCache` on the tenant's project, which bucket-level access does not
include.

**Cache headers.** The CDN rewrites every outgoing `cache-control` to `public,max-age=0`. On the
objects themselves, `index.html` and the route copies carry `no-cache, max-age=0, must-revalidate`
(set when they were uploaded); everything else, including content-hashed JS, carries GCS's default
`public, max-age=3600`. Long-lived caching of hashed assets is therefore not in effect today and
cannot be achieved by object metadata alone while `FORCE_CACHE_ALL` is set.

**Deep links.** The URL map has no rewrite rules. Deep links work on prod because the bucket holds
objects named `dashboard/hardware`, `dashboard/user-activity`, `dashboard/usage-behavior`, and
`contact`, each a byte-identical copy of `index.html` (same etag). They were uploaded 40 minutes
after `index.html` on 2025-05-12, by hand. Stage has no such copies, so every stage deep link
returns 404. Any deploy process has to recreate these copies, one per route in `src/config.json`
plus `/contact`.

**404s.** Unknown paths and trailing-slash variants (`/dashboard/hardware/`) return GCS's XML 404
with HTTP status 404. The bucket's website configuration names `404.html`, but load-balancer backend
buckets ignore that setting and no `404.html` object exists anyway.

**CORS.** The bucket allows `GET` and `HEAD` from any origin, which is why any copy of the site on
any host can read prod's `datasets/`.

## Who can write to the buckets

`tf/modules/static_bucket/main.tf` grants `roles/storage.legacyBucketReader` and
`roles/storage.legacyBucketWriter` to the workgroups `dataplatform/airflow-gke`,
`dataplatform/airflow-dataproc`, `dataplatform/developers`, `data-science/developers`, and, since
2026-09-23, `marketing/admins` (webservices-infra PR #12598, requested in DENG-11646). Objects are
publicly readable through the bucket's default object ACL.

`marketing/admins` membership gives write access to the two buckets only, not to the projects
around them: no console access to the load balancer, CDN, logs, or monitoring. Data Engineering
said in DENG-11646 that they will make no further changes to the website side.

No GitHub Actions identity can write to either bucket. Nothing in `data-static-websites/` references
Workload Identity Federation. The pattern other tenants use is in
`webservices-infra/springfield/tf/prod/bucket.tf`: a service account, `roles/iam.workloadIdentityUser`
bound to a principal of the form
`principal://iam.googleapis.com/projects/324168772199/locations/global/workloadIdentityPools/github-actions/subject/repo:<org>/<repo>:environment:<env>`,
and `roles/storage.objectAdmin` on the bucket.

## How the data shares the bucket

The weekly Airflow DAG described in `data-pipeline.md` runs `ensemble-transposer` with
`GCS_BUCKET_NAME=moz-fx-data-static-websit-8565-ensemble`
([`dags/firefox_public_data_report.py`](https://github.com/mozilla/telemetry-airflow/blob/main/dags/firefox_public_data_report.py)).
The transposer writes each `datasets/<platform>/<dataset>/.../index.json` with an in-place save; it
never lists or deletes. It writes to prod only. Data Engineering confirmed in DENG-11646 that the
bucket name can be changed in Airflow on request.

The front-end files and `datasets/` share one bucket root. A sync that deletes destination objects
missing from the source (`gsutil rsync -d`, `gcloud storage rsync --delete-unmatched-destination-objects`)
run against the bucket root would delete the live data. Any deploy must exclude `datasets/` or sync
only its own prefixes.

## How deploys have happened

- Until 2018-07 the site ran on Heroku with the create-react-app buildpack (`app.json`,
  `static.json`, removed in `ce1deb1`).
- 2018-07 to 2018-08 it ran as a Dockerflow container with an Express server (`production-server.js`,
  removed in `d3bb561`, whose message says DataOps would host it "as a static site behind a CDN").
- 2018-09 the transposer's output moved from its own Heroku app to the same domain (`d4b0820`).
- 2023-06 Data Engineering created the GCS buckets above and uploaded v1.2.0 to stage.
- 2025-05-12 someone uploaded v1.2.1 to prod by hand, then the four route copies. No record of the
  commands used exists.

## Open questions

- What else, if anything, is in the prod bucket besides the v1.2.1 build and `datasets/`. Needs a
  bucket listing with authenticated `gcloud`.
- Whether `legacyBucketWriter` is enough to overwrite objects and set `cache-control` on upload.
  Test on stage, never on prod.
- Whether a stale-while-revalidate window of up to a day after a deploy is acceptable, given that
  cache purging is not available with bucket-only access.

## Sources

- `webservices-infra/data-static-websites/{README.md,tf/prod/locals.tf,tf/prod/cdn.tf,tf/stage/locals.tf,tf/stage/cdn.tf,tf/modules/static_bucket/main.tf}`
  and `webservices-infra/CODEOWNERS`, at commit `0f9e89e9df` (2026-10-15).
- `mozilla/terraform-modules` `google_cdn-external/main.tf` at tag `google_cdn-external-0.4.0`.
- `mozilla/telemetry-airflow` `dags/firefox_public_data_report.py` and
  `mozilla/ensemble-transposer` `src/processData.js`, `main` on 2026-11-06.
- Live response headers from `data.firefox.com`, the stage hostname, and
  `storage.googleapis.com/<bucket>/<object>` for both buckets, 2026-11-06.
- Jira DENG-11646 and webservices-infra PR #12598.
