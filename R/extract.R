

remove_lines <- function(x,n=1){
  x <- sub(".*?\\n","",x)
  if (n == 1) x else remove_lines(x,n-1)
}

extract <- function(re,x){
  m <- regexpr(re,x)
  regmatches(x,m)
}

gsbpm_name <- function(x){
  y <- extract(".*?\\(",x)
  tolower(trimws(gsub("\\(","",y)))
}

gsbpm_number <- function(x){
  y <- extract("\\)[[:blank:]]+[0-9](\\.[0-9])?.*?\\)",x)
  tolower(trimws(gsub("\\)","",y)))
}

# get term between the first pair of square brackets.
software <- function(x){
  sub(".*\\[(.*?)\\].*","\\1",x)
}

# get term between the first pair of round brackets.
link <- function(x){
  sub(".*\\((.*?)\\).*","\\1",x)
}

platform <- function(x){
  trimws(sub("^(.*?) .*","\\1",x))
}

get_attributes <- function(x){
  d <- list(stringsAsFactors=FALSE)

  d$gsbpm_name <- gsbpm_name(x)
  d$gsbpm_number <- gsbpm_number(x)
  v <- trimws(strsplit(x,"\n-")[[1]][-1])
  d$software <- software(v)
  d$link <- link(v)
  d$platform <- platform(v)
  do.call(data.frame,d)

}

replace_markdown_links <- function(x){
  gsub("\\[(.*?)\\]\\(.*?\\)","\\1",x)
}


# read and put in single string
txt <- readLines("README.md")
txt <- paste(txt,collapse="\n")

# remove header section (above horizontal rule)
txt <- trimws(sub(".*?\\*\\*\\*\\*\\*","",txt))

# remove footer (below contributions)
txt <- trimws(sub("## Contributions.*$","",txt))

# split sections
L <- strsplit(txt,"#### ")[[1]]
L <- L[-1]

# create main data.frame
x <- lapply(L,get_attributes)
out <- do.call(rbind,lapply(L,get_attributes))
View(out)
# clean up still existing links

out$platform <- replace_markdown_links(out$platform)

out$Windows <- TRUE
out$Mac <- out$platform %in% c('R',"Java","node.js","npm")
out$linux <- out$Mac



write.csv(out,file="data/software.csv",row.names=FALSE)
