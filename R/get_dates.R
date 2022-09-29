library(rvest)

dta <- read.csv("data/software.csv")


cran <- grep("^http[s]?://(CRAN|cran).*package=.*$", dta$link)

dates <- as.Date(rep(NA, length(cran)))
for (i in seq_along(cran)) {
  try({
    h <- read_html(dta$link[cran[i]])
    tab <- h %>% html_element("table") %>% html_table()
    published <- tab[[2]][grep("^Published:", tab[[1]])]
    dates[i] <- as.Date(published)
  })
}
