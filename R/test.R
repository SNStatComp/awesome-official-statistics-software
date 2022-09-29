library(yaml)
library(whisker)

dta <- read_yaml("data/raw.yaml")
categories <- read_yaml("data/categories.yaml")
categories <- lapply(categories, as.data.frame) |> do.call(what = rbind)

groups <- sapply(dta, \(x) x$gsbpm)

stopifnot(all(groups %in% categories$label))

dta <- split(dta, groups)

tmp <- vector("list", length(dta))
for (i in seq_along(dta)) {
  group <- names(dta)[i]
  category <- categories[categories$label == group,]
  tmp[[i]] <- list(
    name = category$name,
    gsbpm = category$gsbpm,
    items = dta[[i]])
}
tmp <- list(groups = tmp)

template <- readLines("data/template.md")
writeLines(whisker.render(template, tmp), "README.md")

