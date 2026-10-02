## AWESOME METRICS (AI-designed, very experimental)

- Overview of scores: [metrics overview](metrics_scores.md)

The file `metadata/<package>/metrics.json` contains for each package the metadata collected for calculating metrics and the 
The script combines the package's saved GitHub, CRAN, download, and mention metadata.

## Fields

| Field | Source and meaning |
| --- | --- |
| `watchers_count` | GitHub repository watchers. |
| `has_wiki` | Whether the GitHub repository wiki is enabled. |
| `has_discussions` | Whether GitHub Discussions is enabled. |
| `forks_count`, `forks` | GitHub repository fork count. Both source fields are retained for compatibility. |
| `open_issues_count`, `issues` | GitHub open issue count; GitHub's value includes open pull requests. |
| `downloadsPer30Days` | Monthly-equivalent downloads from the download collector. CRAN uses the CRAN logs last-month total; PyPI uses PyPI Stats `last_month`; GitHub uses available clone/release-asset estimates. |
| `downloadsUnavailableReason` | Explanation when a comparable download count is unavailable. |
| `VignetteBuilder` | CRAN `VignetteBuilder` value. |
| `vignetteCount` | Number of rendered CRAN vignettes discovered for the package. |
| `vignettes` | Vignette title, URL, and word count records. |
| `vignetteWordCount` | Sum of available vignette word counts. |
| `used_in` | Number of other CRAN packages in this project's metadata list that declare this package in `Depends`, `Imports`, `LinkingTo`, `Suggests`, or `Enhances`. This is not a count of all CRAN reverse dependencies. |
| `used_in_scope` | Describes the scope used for `used_in`; `null` when unavailable. |
| `mentions` | Number of indexed journal articles whose Crossref title or abstract contains the normalized package name. Articles count equally across journals. |
| `mentionsByJournal` | Per-journal article counts. |
| `mentionsFound` | Matching article titles, publication years, journals, and DOIs when available. |
| `followers` | GitHub repository owner's follower count, when available in saved repository metadata. |
| `watchers` | Alias for the GitHub repository watcher count. |
| `subscriptions` | GitHub repository subscriber count. |
| `collaborators` | GitHub collaborator count, when available. |
| `releases` | GitHub release count, when available. |
| `pull_requests` | GitHub pull-request count, when available. |
| `awesome_metric` | Composite 0.0–5.0 score described below. |
| `awesome_metric_breakdown` | The component scores for maturity, documentation, use, and community. |
| `awesome_metric_method` | Short description of the composite method. |

Values that cannot be read or do not apply are `null`. A measured zero remains `0`; empty vignette or mention lists may be `[]` or `{}` where applicable.

## Awesome Metric

The composite is the equal-weighted mean of the available maturity, documentation, use, and community category scores. Each category is scored from 0.0 to 5.0. Categories with no available signals are omitted from the mean; if no category can be scored, `awesome_metric` is `null`.

Count signals use capped logarithmic normalization:

`min(1, ln(1 + count) / ln(1 + cap))`

The normalized value is averaged within its category, then multiplied by 5. Boolean signals score 1 when true and 0 when false. Missing signals are ignored rather than scored as zero.

| Category | Signals and caps |
| --- | --- |
| `maturity` | GitHub releases (10); CRAN in-list `used_in` count (20). |
| `documentation` | Vignette count (5); total vignette words (50,000); CRAN `VignetteBuilder` present; GitHub wiki enabled. |
| `use` | Downloads per 30 days (100,000); journal mentions (20). |
| `community` | Owner followers (10,000); watchers (1,000); subscriptions (1,000); forks (500); collaborators (50); open issues (100); pull requests (100); GitHub Discussions enabled. |

The final score is rounded to one decimal place. These caps and the equal category weighting are heuristic normalization choices, not calibrated quality ratings; compare scores as a compact summary, not as an absolute assessment of software quality.
