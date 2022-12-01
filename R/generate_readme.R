library(yaml)
library(whisker)

dta <- read_yaml("data/software.yaml")
# Convert to data.frame
dta <- lapply(dta, as.data.frame) |> do.call(what = rbind)

# === TRANSFORM DATA IN FORMAT NEEDED FOR WHISKER
# Split dataset in groups; one for each gsbpm; in the template
# software is grouped by gsbpm name
tmp <- split(dta, paste(dta$gsbpm_number, dta$gsbpm_name))
names(tmp) <- NULL
# For each group we need a name, the gsbm number and a list of software
# packages. 
tmp <- lapply(tmp, function(group) {
  # We split the dataframe into a list per row; needed for whisker
  items <- split(group, seq_len(nrow(group))) |> lapply(FUN = as.list)
  names(items) <- NULL
  list(name = head(group$gsbpm_name, 1), 
    number = head(group$gsbpm_number, 1), items = items)
})
tmp <- list(groups = tmp)

# === GENERATE README FROM TEMPLATE
template <- readLines("data/template.md")
writeLines(whisker.render(template, tmp), "README.md")

# === BADGES (EXPERIMENTAL)
template <- readLines("data/template_badges.md")
writeLines(whisker.render(template, tmp), "README_badges.md")

# === GENERATE SOFTWARE.CSV
write.csv(dta, "data/software.csv", row.names = FALSE)

