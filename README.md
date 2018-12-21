
## Awesome official statistics software [![Awesome](https://cdn.rawgit.com/sindresorhus/awesome/d7305f38d29fed78fa85652e3a63e154dd8e8829/media/badge.svg)](https://github.com/sindresorhus/awesome)
An awesome list of open source statistical software packages useful for creating and accessing official statistics.


#### An item on this list is awesome because

1. it is free, open source, and available for download;
2. it is confirmed to be used in the production of official statistics by at least one institute, or
3. it provides access to official statistics publications.

We prefer packages that are reasonably easy to install and use, that have at least one stable version, and that
are actively maintained.

[Contributions](#contributions) are welcome.



*****

#### Design frame and sample ([GSBPM](https://statswiki.unece.org/display/GSBPM/) 2.1)

- R package [SamplingStrata]( http://cran.stat.unipd.it/web/packages/SamplingStrata/index.html). Optimal Stratification of Sampling Frames for Multipurpose Sampling Surveys.

#### Sampling ([GSBPM](https://statswiki.unece.org/display/GSBPM/) 4.1)
- R package [sampling](https://CRAN.R-project.org/package=sampling). Several algorithms
for drawing (complex) survey samples and calibrating design weights.
- R package [surveyplanning](https://cran.r-project.org/package=surveyplanning). Tools for sample survey planning, including sample size calculation, estimation of expected precision for the estimates of totals, and calculation of optimal sample size allocation.


#### Scraping for Statistics ([GSBPM](https://statswiki.unece.org/display/GSBPM/) 4.3)
- Java application [URLSearcher](https://github.com/SummaIstat/UrlSearcher). An application for searching Urls. Can be used to find websites of enterprise. By ISTAT.
- Java application [URLScorer](https://github.com/SummaIstat/UrlScorer). Gives a rule based score to scraped documents in a Solr database. By ISTAT.
- node.js tool [RobotTool](https://github.com/SNStatComp/RobotTool). A tool for checking (price) changes on the web. By Statistics Netherlands.
- Python [Social-Media-Presence](https://github.com/jmaslankowski/WP2-Social-Media-Presence). A script for detecting social media presence on enterprises websites. By Statistics Poland.
- Python [Sustainability Reporting](https://github.com/AlessandraSozzi/MSc-dissertation). A script for measuring sustainability reporting from enterprises websites. By ONS.
- node.js package [S4Sroboto](https://github.com/SNStatComp/S4Sroboto). A crawler framework, derived from the general package [roboto](https://www.npmjs.com/package/roboto) extended with some functionalities for statistical scraping. By Statistics Netherlands

#### Process ([GSBPM](https://statswiki.unece.org/display/GSBPM/) 5)
- Java application [Java-VTL](https://github.com/statisticsnorway/java-vtl). A partial implementation of the Validation Transformation Language, based on the VTL 1.1 draft specification. By Statistics Norway.
- Java application [ADaMSoft](http://adamsoft.sourceforge.net) implements procedures for data analysis, data, web and text mining. Also contains procedures for data validation and imputation, based on the principle of Fellegi and Holt.

#### Data integration and record linkage ([GSBPM](https://statswiki.unece.org/display/GSBPM/) 5.1)
- R package [reclin](https://cran.r-project.org/web/packages/reclin/index.html). Functions to assist in performing probabilistic record linkage and deduplication: generating pairs, comparing records, em-algorithm for estimating m- and u-probabilities, forcing one-to-one matching. Can also be used for pre- and post-processing for machine learning methods for record linkage.
- R package [RecordLinkage](https://CRAN.R-project.org/package=RecordLinkage). Implementation of the Fellegi-Sunter method for record linkage.
- R package [fastLink](https://cran.r-project.org/web/packages/fastLink/index.html). Implements a Fellegi-Sunter probabilistic record linkage model that allows for missing data and the inclusion of auxiliary information. Documentation can be found on http://imai.princeton.edu/research/linkage.html
- R packages [stringdist](https://CRAN.R-project.org/package=stringdist) and [fuzzyjoin](https://CRAN.R-project.org/package=fuzzyjoin) allow for matching records based on inaccurate keys.
- R package [XBRL](https://CRAN.R-project.org/package=XBRL). Extraction of Business Financial Information from [XBRL](https://www.xbrl.org/) Documents



#### Statistical data editing and imputation  ([GSBPM](https://statswiki.unece.org/display/GSBPM/) 5.3 | 5.4)

- R package [validate](https://CRAN.R-project.org/package=validate). Rule management and data validation.
- R package [validatetools](https://CRAN.R-project.org/package=validatetools). Checking and simplifying sets of validation rules.
- R package [errorlocate](https://CRAN.R-project.org/package=errorlocate). Error localisation based on the principle of Fellegi and Holt.
    - Uses [validate](https://CRAN.R-project.org/package=validate) rule definitions
    - supports categorical and/or numeric data
    - supports linear equalities, inequalities and conditional rules.
    - Configurable backend for MIP-based error localization.
- R package [VIM](https://CRAN.R-project.org/package=VIM). Visualisation and Imputation of missing values.
    - Advanced visualisation of missing data patterns
    - Imputation using (robust) linear regression methods
    - Imputation using several donor-based methods (kNN, hot-deck)
- R package [VIMGUI](https://CRAN.R-project.org/package=VIMGUI). Graphical frontend to [VIM](https://CRAN.R-project.org/package=VIM)
- R package [simputation](https://CRAN.R-project.org/package=simputation). Simple imputation: many methods using a uniform interface following the [tidy tools manifesto](https://cran.r-project.org/web/packages/tidyverse/vignettes/manifesto.html)
    - Allows to easily combiny many imputation methods/strategies.
    - Supports regression (standard, M-estimation, ridge/lasso/elasticnet), hot-deck methods (powered by [VIM](https://CRAN.R-project.org/package=VIM)), randomForest, EM-based, and iterative randomForest imputation. Reuse of fitted models and definition of simple user-defined methods are supported as well.
- R package [SeleMix](https://CRAN.R-project.org/package=SeleMix). Detection of outliers and influential errors using a latent variable model for selective editing.
- R package [univOutl](https://cran.r-project.org/web/packages/univOutl/index.html). Various methods for detecting univariate outliers.
- R package [extremevalues](https://CRAN.R-project.org/package=extremevalues). Detection of univariate outliers based on modeling the bulk distribution.
- R package [deductive](https://cran.r-project.org/web/packages=deductive). Deductive correction and imputation using edit rules and (partially) complete data.

#### Estimation and weighting ([GSBPM](https://statswiki.unece.org/display/GSBPM/) 5.6 | 5.7)

- R package [survey](https://CRAN.R-project.org/package=survey). Weighting and estimation for complex survey designs, possibly under nonresponse. Also computes estimator variance. See also R package [srvyr](https:://CRAN.R-project.org/package=survey) for integration with 
[tidy tools](https://cran.r-project.org/web/packages/tidyverse/vignettes/manifesto.html).
- R package [hbsae](https://CRAN.R-project.org/package=hbsae). Small area estimation based on hierarchical Bayesian models.
- R package [rsae](https://CRAN.R-project.org/package=rsae). Small area estimation
based on (robust) maximum likelihood estimation.
- R package [CalibrateSSB](https://CRAN.R-project.org/package=CalibrateSSB). Calculate weighs and estimates for panel data with non-response.
- R package [ReGenesees](https://joinup.ec.europa.eu/software/regenesees/description) (only availableon joinup) has a similar interface as the R package survey and many different estimators with sampling errors are implemented.
- R package [vardpoor](https://cran.r-project.org/package=vardpoor). Linearization of non-linear statistics and variance estimation.
- R package [convey](https://cran.r-project.org/package=convey). Variance estimation on indicators of income concentration and poverty using complex sample survey designs. Wrapper around the survey package.
- R package [icarus](https://cran.r-project.org/package=icarus). Provides detailed tools for performing calibration and several of its varitations, in a familiar setting for Calmar users in SAS.
- R package [gustave](https://cran.r-project.org/package=gustave). Provides a toolkit for analytical variance estimation in survey sampling.

#### Time series and seasonal adjustment ([GSBPM](https://statswiki.unece.org/display/GSBPM/) 5.6 | 5.7)

- [X-13ARIMA-SEATS](https://www.census.gov/srd/www/x13as/) Seasonal adjustment software
produced maintained and distributed by the US Census Bureau.
- R package [seasonal](https://CRAN.R-project.org/package=seasonal). Interface to the `X13-ARIMA-SEATS` program from R with a very nice shiny GUI.
- R package [x12](https://CRAN.R-project.org/package=x12). Alternative interface to the `X13-ARIMA-SEATS` program from R with a focus on batch processing time series.
- [JDemetra+](https://ec.europa.eu/eurostat/cros/content/download_en) The seasonal adjustment software officially recommended for the European Statistical System.   

#### Output validation ([GSBPM](https://statswiki.unece.org/display/GSBPM/) 6.2)
- R package [validate](https://CRAN.R-project.org/package=validate). Rule management and data validation.


 
#### Statistical disclosure control ([GSBPM](https://statswiki.unece.org/display/GSBPM/) 6.4)
- [Argus](http://research.cbs.nl/casc/) and [SDC Tools](https://github.com/sdcTools). Tools like Tau-Argus and Mu-Argus for dististical disclosure control from Statistics Netherlands and the Statistical disclosure control netwerk.
- R package [sdcMicro](https://CRAN.R-project.org/package=sdcMicro). Disclosure
  control for statistical microdata.
- R package [sdcTable](https://CRAN.R-project.org/package=sdcTable). Disclosure
  control for tabulated data.
- R package [easySdcTable](https://CRAN.R-projects.org/package=easySdcTable) provides an interface to the package sdcTable.
- R package [SmallCountRounding](https://CRAN.R-projects.org/package=SmallCountRounding) can be used to protect frequency tables by rounding necessary inner cells so that cross-classifications to be published are safe.
- R package [simPop](https://CRAN.R-project.org/package=simPop). Simulation of synthetic populations from census/survey data considering auxiliary information.




#### Statistical Dissemination ([GSBPM](https://statswiki.unece.org/display/GSBPM/) 7.2)
- [SDMX Converter](https://webgate.ec.europa.eu/fpfis/mwikis/sdmx/index.php/SDMX_Converter). Converter between differnt versions of SDMX and formats such as CSV, FLR etc. from Eurostat.
- [SDMX-RI](https://webgate.ec.europa.eu/fpfis/mwikis/sdmx/index.php/SDMX_Reference_Infrastructure_SDMX-RI). Framework for disseminating data in SDMX webservices from Eurostat.
- R package [rsdmx](https://github.com/opensdmx/rsdmx). Writing SDMX from R.
- [StatMiner](http://research.cbs.nl/Projects/StatMine/), Experimental visualization framework from Statistics Netherlands. [(github)](https://github.com/statmine/statminer), [(demo)](http://statmine.github.io/statminer)
- [SDMX-JSON](https://github.com/sdmx-twg/sdmx-json/blob/master/data-message/docs/1-sdmx-json-field-guide.md). JSON variant of SDMX. This is still a candidate standard.
- [JSON-Stat](https://json-stat.org/). Lightweight JSON based message format for statistical dissemination.

#### Visualisation ([GSBPM](https://statswiki.unece.org/display/GSBPM/) 7.2)

- R package [tabplot](https://CRAN.R-project.org/package=tabplot). Compare up
  to about 10-20 variables simultaneously using a [tableplot](https://cran.r-project.org/web/packages/tabplot/vignettes/tabplot-vignette.html). See also [tabplotd3](https://CRAN.R-project.org/package=tabplot) for a
web-based GUI.
- R package [tmap](https://CRAN.R-project.org/package=tmap) Thematic geographic maps, including bubble charts, choropleths, and more.
- A (growing) list of simplified maps useful for web cartography for World, Europe and countries [cartomap](https://github.com/cartomap)
- R package [treemap](https://CRAN.R-project.org/package=treemap). Space-filling visualisation of hierarchical data.
- R package [btb](https://CRAN.R-project.org/package=btb). Conservative kernel smoothing method for spatial analysis.


#### Access to official statistics ([GSBPM](https://statswiki.unece.org/display/GSBPM/) 7.4)

- R package [rsdmx](https://github.com/opensdmx/rsdmx). Easy access to data from statistical organisations that support SDMX webservices. The package contains a list of SDMX access points of various national and international statistical institutes.
- R package [oecd](https://cran.r-project.org/web/packages/OECD/index.html) Search and Extract Data from the OECD
- R package [sorvi](https://CRAN.R-project.org/package=sorvi) Finnish Open Government Data Toolkit
- R package [eurostat](https://CRAN.R-project.org/package=eurostat) Tools to download data from the Eurostat database together with search and manipulation utilities.
- R package [acs](https://CRAN.R-project.org/package=acs) Download, Manipulate, and Present American Community Survey and Decennial Data from the US Census.
- R package [inegiR](https://CRAN.R-project.org/package=inegiR) Access to data published by
[INEGI](http://www.inegi.org.mx/), Mexico's official statistics agency.
- R package [cbsodataR](https://CRAN.R-project.org/package=cbsodataR). Access
  to Statistics Netherlands' ([CBS](http://www.CBS.nl)) open data API from R.
- npm package [cbsodata.js](https://github.com/statmine/cbsodata.js). Access
  to Statistics Netherlands' ([CBS](http://www.CBS.nl)) open data API from js.
- R package [rjstat](https://cran.r-project.org/package=rjstat). Read and write data sets in the JSON-stat format. 
- R package [censusapi](https://cran.r-project.org/package=censusapi) A wrapper for the U.S. Census Bureau APIs that returns data frames of Census data and metadata.
- R package [nsoApi](https://github.com/bowerth/nsoApi) builds on other packages to access data from official statistics and tries to harmonize the API.
- R package [CANSIM2R](https://CRAN.R-project.org/package=CANSIM2R). Extract CANSIM (Statistics Canada) tables and transform them into readily usable data.
- Python package [pyscbwrapper](https://github.com/kirajcg/pyscbwrapper). Access to the open data API of the Swedish Statistical Institute

## Contributions

Awesome contributions are welcome, here are ways to do it:

- The GitHub way: send us a [pull request](https://help.github.com/articles/creating-a-pull-request/) to add directly to this list.
- Add an item to the
  [issue tracker](https://github.com/SNStatComp/awesome-official-statistics-software/issues)
issue tracker. (you need a GH account)
- Send an e-mail to `mark dot vanderloo at gmail dot com` or `olav dot tenbosch at gmail dot com` or tweet [\@markvdloo](https://twitter.com/markvdloo)

**Wear the badge.** Authors of software that is mentioned on this list gain the right to wear the [mentioned in awesome](https://github.com/sindresorhus/awesome/blob/master/awesome.md#awesome-mentioned-badge) badge on their website or GH repository. Please use the following code (or equivalent) to do so for your project.
```
[![Mentioned in Awesome Official Statistics ](https://awesome.re/mentioned-badge.svg)](http://www.awesomeofficialstatistics.org)
```



## License

[![Creative Commons License](https://i.creativecommons.org/l/by/4.0/88x31.png)](http://creativecommons.org/licenses/by/4.0/)  
This work is licensed under a [Creative Commons Attribution 4.0 International License](http://creativecommons.org/licenses/by/4.0/).

