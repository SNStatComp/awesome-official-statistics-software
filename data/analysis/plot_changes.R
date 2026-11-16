library(ggplot2)

script_arg <- grep("^--file=", commandArgs(trailingOnly = FALSE), value = TRUE)
if (length(script_arg) != 1) stop("Run this script with Rscript.")
directory <- dirname(normalizePath(sub("^--file=", "", script_arg)))
changes <- read.csv(file.path(directory, "changes.csv"), stringsAsFactors = FALSE)
dates <- as.Date(changes$date)
if (anyNA(dates) || any(!changes$change %in% c("addition", "removal"))) {
  stop("The CSV contains invalid dates or change types.")
}
years <- seq(min(as.integer(format(dates, "%Y"))), max(as.integer(format(dates, "%Y"))))
counts <- as.data.frame(table(
  year = factor(format(dates, "%Y"), levels = as.character(years)),
  change = factor(changes$change, levels = c("addition", "removal"))
))
counts$change <- factor(counts$change, levels = c("addition", "removal"),
                        labels = c("Addition", "Removal"))
chart <- ggplot(counts, aes(x = year, y = Freq, fill = change)) +
  geom_col(position = "dodge") +
  labs(
    title = "Software list changes by year",
    x = "Year",
    y = "Number of changes",
    fill = "Change",
    caption = paste0("Latest recorded change: ", format(max(dates), "%d %B %Y"),
                     ". Renames count as an addition and a removal.")
  )

ggsave(file.path(directory, "changes_by_year.svg"), plot = chart,
       device = grDevices::svg, width = 10, height = 5.7)
