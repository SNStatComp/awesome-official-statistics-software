## Awesome official statistics software [![Awesome](https://cdn.rawgit.com/sindresorhus/awesome/d7305f38d29fed78fa85652e3a63e154dd8e8829/media/badge.svg)](https://github.com/sindresorhus/awesome)
An awesome list of open source software for official statistics.

#### An item on this list is awesome because it is
1. free, open source, and available for download and
2. used in the production of official statistics by at least one institute or provides access to official statistics.

We prefer software that is easy to install and use, has at least one stable version, and is actively maintained. [Contributions](#contributions) welcome.

#### News
- Mar 2021: Awesome list in Trusted Smart Statistics meeting: [slides](ppts/20220311_olav_ten_bosch_awesome_list.pdf)
- Nov 2021: Awesome list in keynote Edwin de Jonge at **[uRos2021](http://r-project.ro/conference2021.html#Edwin_de_Jonge)**
- Nov 2021: Awesome list in **[Int. Conf. on Data Science and Official Statistics (ICDSOS)](https://icdsos.stis.ac.id/)**: [slides](https://drive.google.com/file/d/1Hp4TJUvkOOn1duXHPImjD74Kh394untx/view?usp=sharing)
- Oct 2021: Awesome list in **[Px-meeting 2021](https://www.scb.se/px-meeting-2021)**: [slides](https://www.scb.se/globalassets/vara-tjanster/px-programmen/2021-10-21-multilingual-px-files-with-r-and-pxjob-.pdf)
- Jan 2021: Awesome list in **[10th EG meeting on SDMX](https://www.imf.org/en/News/Seminars/Conferences/2021/01/25/10th-statistical-data-and-metadata-exchange)**: [slides](https://www.imf.org/-/media/Files/News/Seminars/2021/SDMX/siv-presentation-01-stocktaking-of-sdmx-tools.ashx)
- Dec 2020: Awesome list presented on **uRos2020**: [slides](https://r-project.ro/conference2020-presentations.html#Olav_TEN_BOSCH,_Mark_VAN_DER_LOO_and_Alexander_KOWARIK)
- Dec 2019: **100  items on the list!!!**
- Jun 2019: Awesome list presented on **Modernstats World**: [slides](https://www.unece.org/fileadmin/DAM/stats/documents/ece/ces/ge.58/2019/mtg2/MWW2019_Soapbox_Netherlands_ten_Bosch.pdf)
- Dec 2017: List started during UNECE SDE 2017


#### Visuals
[![GSBPM use](viz/GSBPM_Small.png)](https://observablehq.com/@olavtenbosch/visualizing-awesomeofficialstatistics-org#GSBPM)
[![clickable version](viz/ClickableAwesomeSmall.png)](https://observablehq.com/@olavtenbosch/clickable-awesomeofficialstatistics-org)
[![word cloud](viz/wordCloudSmall.png)](https://observablehq.com/@olavtenbosch/visualizing-awesomeofficialstatistics-org#wordCloud)


*****

#### Design frame and sample ([GSBPM](https://statswiki.unece.org/display/GSBPM/) 2.1)
- R package [SamplingStrata](https://cran.r-project.org/package=SamplingStrata). Optimal Stratification of Sampling Frames for Multipurpose Sampling Surveys.
- R package [R2BEAT](https://cran.r-project.org/package=R2BEAT) Multistage Sampling Allocation and PSU Selection

#### Design variable descriptions ([GSBPM](https://statswiki.unece.org/display/GSBPM/) 2.2)
- Excel [SDMX Matrix Generator](https://gitlab.com/sis-cc/sdmx-tools/sdmx-matrix-generator). Excel-based visual SDMX artefact authoring tool which generates SDMX-ML for upload into an SDMX repository such as a registry. By OECD.

#### Sampling ([GSBPM](https://statswiki.unece.org/display/GSBPM/) 4.1)
- R package [sampling](https://cran.r-project.org/package=sampling). Several algorithms for drawing survey samples, including a variety of unequal probabiltiy sampling designs (high entropy, systematic, Rao-Sampford, etc.), and calibrating design weights.
- R package [surveyplanning](https://cran.r-project.org/package=surveyplanning). Tools for sample survey planning, including sample size calculation, estimation of expected precision for the estimates of totals, and calculation of optimal sample size allocation.
- R package [PracTools](https://cran.r-project.org/package=PracTools). Functions and datasets related to Valliant, Dever, and Kreuter (2018 2nd ed), [*Practical Tools for Designing and Weighting Survey Samples*](https://doi.org/10.1007/978-3-319-93632-1).
 
#### Scraping for Statistics ([GSBPM](https://statswiki.unece.org/display/GSBPM/) 4.3)
- Java application [URLSearcher](https://github.com/SummaIstat/UrlSearcher). An application for searching Urls. Can be used to find websites of enterprise. By ISTAT.
- Java application [URLScorer](https://github.com/SummaIstat/UrlScorer). Gives a rule based score to scraped documents in a Solr database. By ISTAT.
- Node.js tool [RobotTool](https://github.com/SNStatComp/RobotTool). A tool for checking (price) changes on the web. By Statistics Netherlands.
- Python [Social-Media-Presence](https://github.com/jmaslankowski/WP2-Social-Media-Presence). A script for detecting social media presence on enterprises websites. By Statistics Poland.
- Python [Sustainability Reporting](https://github.com/AlessandraSozzi/MSc-dissertation). A script for measuring sustainability reporting from enterprises websites. By ONS.
- Python [urlfinding](https://github.com/SNStatComp/urlfinding). Software for finding websites of enterprises using a search engine and machine learning. By [Statistics Netherlands](https:www.cbs.nl)


#### Process ([GSBPM](https://statswiki.unece.org/display/GSBPM/) 5)
- R package [blaise](https://cran.r-project.org/package=blaise). Reading and writing Files in the Blaise Format from R. By Statistics Netherlands.
- Java application [Java-VTL](https://github.com/statisticsnorway/java-vtl). A partial implementation of the Validation Transformation Language, based on the VTL 1.1 draft specification. By Statistics Norway.
- Java application [ADaMSoft](http://adamsoft.sourceforge.net) implements procedures for data analysis, data, web and text mining. Also contains procedures for data validation and imputation, based on the principle of Fellegi and Holt.
- R package [dcmodify](https://cran.r-project.org/package=dcmodify). Derive new variables or modify data using externally defined data modification rules.

#### Data integration and record linkage ([GSBPM](https://statswiki.unece.org/display/GSBPM/) 5.1)
- R package [reclin](https://cran.r-project.org/package=reclin). Functions to assist in performing probabilistic record linkage and deduplication: generating pairs, comparing records, em-algorithm for estimating m- and u-probabilities, forcing one-to-one matching. Can also be used for pre- and post-processing for machine learning methods for record linkage.
- R package [RecordLinkage](https://cran.r-project.org/package=RecordLinkage). Implementation of the Fellegi-Sunter method for record linkage.
- R package [StatMatch](https://cran.r-project.org/package=StatMatch). Statistical Matching or Data Fusion
- R package [fastLink](https://cran.r-project.org/package=fastLink). Implements a Fellegi-Sunter probabilistic record linkage model that allows for missing data and the inclusion of auxiliary information. [Documentation](http://imai.princeton.edu/research/linkage.html)
- R packages [stringdist](https://cran.r-project.org/package=stringdist). Approximate string matching. Supports various string distances (Damerau-Levenshtein, Hamming, Levenshtein, optimal sting alignment), qgrams (q- gram, cosine, jaccard distance) and heuristic metrics (Jaro, Jaro-Winkler). An implementation of soundex is provided as well.
- R packages [fuzzyjoin](https://cran.r-project.org/package=fuzzyjoin). Join tables based on exact or similar matches. Allows for matching records based on inaccurate keys.
- R Java MySQL [RELAIS](https://joinup.ec.europa.eu/solution/relais-record-linkage-istat/releases). A toolkit providing techniques for dealing with record linkage. The purpose is to identify the same real world entity that can be differently represented in data sources. By Istat.
- R package [XBRL](https://cran.r-project.org/package=XBRL). Extraction of Business Financial Information from [XBRL](https://www.xbrl.org/)


#### Statistical data editing and imputation  ([GSBPM](https://statswiki.unece.org/display/GSBPM/) 5.3 | 5.4)
- R package [validate](https://cran.r-project.org/package=validate). Data validation checks such as on length, format, range, missingness, availability, uniqueness, multivariate checks, statistical checks and checks on SDMX codelist. See [Cookbook](https://data-cleaning.github.io/validate/). By Statistics Netherlands
- R package [validatedb](https://cran.r-project.org/package=validatedb). [validate](https://CRAN.R-project.org/package=validate) on a SQL database, providing validation on bigger data.
- R package [validatetools](https://cran.r-project.org/package=validatetools). Checking validation rules on redundancies and contradictions. Useful if your validation rule set grows in complexity.
- R package [errorlocate](https://cran.r-project.org/package=errorlocate). Error localisation based on Fellegi and Holt, supporting categorical and/or numeric data, linear equalities, inequalities and conditional rules and MIP-based error localization.
- R package [VIM](https://cran.r-project.org/package=VIM). Visualisation and imputation of missing data. Imputation using (robust) linear regression methods or donor-based methods (kNN, hot-deck).
- R package [simputation](https://cran.r-project.org/package=simputation). Front-end to (combinations of) advanced imputation methods following the [tidy tools manifesto](https://cran.r-project.org/web/packages/tidyverse/vignettes/manifesto.html). Supports regression (standard, M-estimation, ridge/lasso/elasticnet), hot-deck methods (powered by [VIM](https://CRAN.R-project.org/package=VIM)), randomForest, EM-based, and iterative randomForest imputation. Reuse of fitted models and definition of simple user-defined methods are supported as well.
- R package [SeleMix](https://cran.r-project.org/package=SeleMix). Detection of outliers and influential errors using a latent variable model for selective editing.
- R package [univOutl](https://cran.r-project.org/package=univOutl). Various methods for detecting univariate outliers.
- R package [extremevalues](https://cran.r-project.org/package=extremevalues). Detection of univariate outliers based on modeling the bulk distribution.
- R package [deductive](https://cran.r-project.org/package=deductive). Deductive correction and imputation using edit rules and (partially) complete data.
- R package [rspa](https://cran.r-project.org/package=rspa). Adapt Numerical Records to Fit (in)Equality Restrictions.
- R package [mice](https://cran.r-project.org/package=mice). Multiple imputation by chained equations, aka fully conditional specification, accompanied by [van Buuren (2018) _Flexible Imputation of Missing Data_](https://stefvanbuuren.name/fimd/).


#### Estimation and weighting ([GSBPM](https://statswiki.unece.org/display/GSBPM/) 5.6 | 5.7)
- R package [survey](https://cran.r-project.org/package=survey). Weighting and estimation for complex survey designs, possibly under nonresponse. Also computes estimator variance. See also R package [srvyr](https:://CRAN.R-project.org/package=survey) for integration with 
[tidy tools](https://cran.r-project.org/web/packages/tidyverse/vignettes/manifesto.html).
- R package [hbsae](https://cran.r-project.org/package=hbsae). Small area estimation based on hierarchical Bayesian models.
- R package [rsae](https://cran.r-project.org/package=rsae). Small area estimation
based on (robust) maximum likelihood estimation.
- R package [CalibrateSSB](https://cran.r-project.org/package=CalibrateSSB). Calculate weighs and estimates for panel data with non-response.
- R package [ReGenesees](https://github.com/DiegoZardetto/ReGenesees). Like [survey](https://CRAN.r-project.org/package=survey), but with specific features (e.g. partitioned calibration) that make it fit for processing large-scale surveys. Implements different estimators with sampling errors, and ships with a dedicated GUI (package [ReGenesees.GUI](https://github.com/DiegoZardetto/ReGenesees.GUI)).
- R package [vardpoor](https://cran.r-project.org/package=vardpoor). Linearization of non-linear statistics and variance estimation.
- R package [convey](https://cran.r-project.org/package=convey). Variance estimation on indicators of income concentration and poverty using complex sample survey designs. Wrapper around the survey package.
- R package [icarus](https://cran.r-project.org/package=icarus). Provides detailed tools for performing calibration and several of its varitations, in a familiar setting for Calmar users in SAS.
- R package [gustave](https://cran.r-project.org/package=gustave). Provides a toolkit for analytical variance estimation in survey sampling.
- R package [rtrim](https://cran.r-project.org/package=rtrim). Trends and Indices for Monitoring data. Provides tools for estimating animal/plant populations based on site counts, including occurrence of missing data.
- R package [surveysd](https://cran.r-project.org/package=surveysd). Calibration, bootstrap and error estimation for complex surveys.
- R package [inca](https://cran.r-project.org/package=inca). Calibration weighting with integer weights.


#### Time series and seasonal adjustment ([GSBPM](https://statswiki.unece.org/display/GSBPM/) 5.6 | 5.7)
- Fortran [X-13ARIMA-SEATS](https://www.census.gov/data/software/x13as.X-13ARIMA-SEATS.html) Seasonal adjustment software, by Census Bureau
produced maintained and distributed by the US Census Bureau.
- R package [seasonal](https://cran.r-project.org/package=seasonal). Interface to the `X13-ARIMA-SEATS` program from R with a very nice shiny GUI.
- R package [x12](https://cran.r-project.org/package=x12). Alternative interface to the `X13-ARIMA-SEATS` program from R with a focus on batch processing time series.
- Java application [JDemetra+](https://ec.europa.eu/eurostat/cros/content/download_en) The seasonal adjustment software officially recommended for the European Statistical System.
- R package [RJDemetra](https://jdemetra.github.io/rjdemetra/) R interface to JDemetra+.
- R package [tempdisagg](https://cran.r-project.org/package=tempdisagg) methods for temporal disaggregation and interpolation of time series.


#### Output validation ([GSBPM](https://statswiki.unece.org/display/GSBPM/) 6.2)
- R package [validate](https://cran.r-project.org/package=validate). Rule management and data validation.

 
#### Statistical disclosure control ([GSBPM](https://statswiki.unece.org/display/GSBPM/) 6.4)
- Java application [μ-ARGUS](https://github.com/sdcTools/muargus). Tool to create safe micro-data files. See also the [casc page](http://research.cbs.nl/casc/).
- Java application [T-ARGUS](https://github.com/sdcTools/tauargus). Tool to protect statistical tables. See also the [casc page](http://research.cbs.nl/casc/).
- R package [sdcMicro](https://cran.r-project.org/package=sdcMicro). Disclosure control for statistical microdata.
- R package [sdcTable](https://cran.r-project.org/package=sdcTable). Disclosure control for tabulated data.
- R package [easySdcTable](https://cran.r-project.org/package=easySdcTable) provides an interface to the package sdcTable.
- R package [sdcHierarchies](https://cran.r-project.org/package=sdcHierarchies) allows to generate, modify and export nested hierarchies.
- R package [SmallCountRounding](https://cran.r-project.org/package=SmallCountRounding) can be used to protect frequency tables by rounding necessary inner cells so that cross-classifications to be published are safe.
- R package [simPop](https://cran.r-project.org/package=simPop). Simulation of synthetic populations from census/survey data considering auxiliary information.
- R package [sdcSpatial](https://cran.r-project.org/package=sdcSpatial). Create privacy protected density maps from location data. Includes visual sensitivity assessment and several protection methods.
- R package [synthpop](https://cran.r-project.org/package=synthpop). Produce synthetic versions of microdata containing confidential information so that they are safe to be released to users for exploratory analysis.


#### Statistical Dissemination ([GSBPM](https://statswiki.unece.org/display/GSBPM/) 7.2)
- Java application [SDMX Converter](https://ec.europa.eu/eurostat/web/sdmx-infospace/sdmx-it-tools/sdmx-converter). Converts between SDMX versions and formats like CSV, FLR etc. By Eurostat.
- Java application [SDMX-RI](https://ec.europa.eu/eurostat/web/sdmx-infospace/sdmx-it-tools/sdmx-ri). Framework for disseminating data in SDMX webservices. By Eurostat.
- C# HTML5 JavaScript [PxStat](https://github.com/CSOIreland/PxStat). Data Dissemination Management System for creating and publishing Statistics over the Web with focus on Accessibility and LOD. By [CSO](https://www.cso.ie/).
- C# VB.NET ASP.NET [PxWeb](https://github.com/statisticssweden/PxWeb). Web application for dissemination of statistical tables in [Px format](https://www.scb.se/en/services/statistical-programs-for-px-files/px-file-format/) or SQL data in the [Nordic Data Model](https://www.scb.se/en/services/statistical-programs-for-px-files/px-web/px-web-med-sql-databas/).
- Node.js and other [.Stat Suite](https://sis-cc.gitlab.io/dotstatsuite-documentation/). An SDMX-based platform to build tailored data portals, topical or regional data explorers, or lightweight reporting platforms. By [SIS-CC](https://siscc.org).
- JSON [SDMX-JSON](https://github.com/sdmx-twg/sdmx-json). JSON variant of SDMX. Works together with the [SDMX-REST API](https://github.com/sdmx-twg/sdmx-rest).
- JSON [JSON-stat](https://json-stat.org/). Simple lightweight JSON format for statistical dissemination. Based on a Cube model with dimensions organised in categories.

#### Visualisation ([GSBPM](https://statswiki.unece.org/display/GSBPM/) 7.2)
- R package [tabplot](https://cran.r-project.org/package=tabplot). Compare up
  to about 10-20 variables simultaneously using a [tableplot](https://cran.r-project.org/web/packages/tabplot/vignettes/tabplot-vignette.html). See also [tabplotd3](https://CRAN.R-project.org/package=tabplot) for a
web-based GUI. Note: 2022-03-03: Temporarily not on Cran but expected to be back in 2022.
- R package [tmap](https://cran.r-project.org/package=tmap). Thematic geographic maps, including bubble charts, choropleths, and more.
- R package [oceanis](https://cran.r-project.org/package=oceanis). To create maps for statistical analysis such as proportional circles, chroropleth, typology and flows. By INSEE.
- GeoJSON/TopoJSON [cartomap](https://github.com/cartomap) A (growing) list of simplified maps useful for web cartography for World, Europe and countries.
- GeoJSON/TopoJSON [Nuts2json](https://github.com/eurostat/Nuts2json) Simplified geometries for web maps of European NUTS regions. By Eurostat.
- R package [treemap](https://cran.r-project.org/package=treemap). Space-filling visualisation of hierarchical data.
- R package [btb](https://cran.r-project.org/package=btb). Conservative kernel smoothing method for spatial analysis.
- Node.js [StatMiner](http://research.cbs.nl/Projects/StatMine/), Experimental visualization framework from Statistics Netherlands.
- JavaScript [Visual](https://github.com/idescat/visual). Javascript library for data visualization that encapsulates complexity supporting chart types such as bar, rank, pie, time series bar/line, population pyramid, scatterplots and Choropleth maps. By Idescat.
- R package [PantaRhei](https://cran.r-project.org/package=PantaRhei). Sankey plots suited for (circulair) economical systems such as energy systems, material flow accounts and water accounts. Supports loops. 


#### Access to official statistics ([GSBPM](https://statswiki.unece.org/display/GSBPM/) 7.4)
- R package [rsdmx](https://cran.r-project.org/package=rsdmx). Easy access to data from statistical organisations that support SDMX webservices. The package contains a list of SDMX access points of various national and international statistical institutes.
- R package and C++ [readsdmx](https://cran.r-project.org/package=readsdmx). Read SDMX into dataframes from local SDMX-ML file or web-service. By OECD.
- Python [sdmx](https://sdmx1.readthedocs.io/en/latest/). Python library that implements SDMX 2.1 to explore data from SDMX data providers, parse data and metadata and convert it into Pandas objects.
- R package [rjstat](https://cran.r-project.org/package=rjstat). Read and write data sets in the JSON-stat format.
- Python package [pyjstat](https://pypi.org/project/pyjstat/). Read and write JSON-stat.
- Java module [json-stat.java](https://github.com/statisticsnorway/json-stat.java) Read and write JSON-stat. By Statistics Norway.
- R package [oecd](https://cran.r-project.org/package=OECD) Search and Extract Data from the OECD
- R package [sorvi](https://cran.r-project.org/package=sorvi) Finnish Open Government Data Toolkit
- R package [eurostat](https://cran.r-project.org/package=eurostat) Tools to download data from the Eurostat database together with search and manipulation utilities.
- R package [restatapi](https://cran.r-project.org/package=restatapi) Search and retrieve data from Eurostat database, by Eurostat.
- R package [acs](https://cran.r-project.org/package=acs) Download, Manipulate, and Present American Community Survey and Decennial Data from the US Census.
- R package [inegiR](https://cran.r-project.org/package=inegiR) Access to data published by [INEGI](http://www.inegi.org.mx/), Mexico's official statistics agency.
- R package [cbsodataR](https://cran.r-project.org/package=cbsodataR). Access to Statistics Netherlands' ([CBS](http://www.CBS.nl)) open data API from R.
- Node.js package [cbsodata.js](https://github.com/statmine/cbsodata.js). Access to Statistics Netherlands' ([CBS](http://www.CBS.nl)) open data API from js.
- Python package [cbsodata.py](https://github.com/J535D165/cbsodata). Access to Statistics Netherlands' ([CBS](http://www.CBS.nl)) open data API from Python.
- R package [censusapi](https://cran.r-project.org/package=censusapi) A wrapper for the U.S. Census Bureau APIs that returns data frames of Census data and metadata.
- R package [nsoApi](https://github.com/bowerth/nsoApi) builds on other packages to access data from official statistics and tries to harmonize the API.
- R package [CANSIM2R](https://cran.r-project.org/package=CANSIM2R). Extract CANSIM (Statistics Canada) tables and transform them into readily usable data.
- Python package [pyscbwrapper](https://github.com/kirajcg/pyscbwrapper). Access to the open data API of the Swedish Statistical Institute
- R package [pxweb](https://cran.r-project.org/package=pxweb). Generic interface for the PX-Web/PC-Axis API used by many National Statistical Agencies.
- R package [PxWebApiData](https://cran.r-project.org/package=PxWebApiData). Easy API access to e.g. Statistics Norway, Statistics Sweden and Statistics Finland.
- R package [rdbnomics](https://git.nomics.world/dbnomics/rdbnomics). Access to the [DB.nomics database](https://next.nomics.world/) which provide macroeconomic data from 38 official providers such as INSEE, Eurostat, Wolrd bank, etc.
- R package [readabs](https://cran.r-project.org/package=readabs) Download data from the Australian Bureau of Statistics.
- R package [statcanR](https://cran.r-project.org/package=statcanR). An R connection to Statistics Canada's Web Data Service. Open economic data (formerly CANSIM tables) are accessible as a data frame in the R environment.
- R package [cdlTools](https://cran.r-project.org/package=cdlTools). Downloads USDA National Agricultural Statistics Service (NASS) cropscape data for a specified state.
- Java package [SDMX Connectors](https://github.com/amattioc/SDMX). Browse SDMX data providers, build your queries and get data directly in your favourite tool (R, SAS, Matlab, Stata and Excel). By Banca d'Italia.
- Node.js package [sdmx-rest](https://www.npmjs.com/package/sdmx-rest). This library allows to easily create and execute SDMX REST queries from a JavaScript client application.
- R package [csodata](https://cran.r-project.org/package=csodata) Download data from Central Statistics 
  Office (CSO) of Ireland.
- R package [iriR](https://cran.r-project.org/package=iriR). Client for the European Commission’s Industrial R&D Investment Scoreboard (IRI)
- R package [czso](https://cran.r-project.org/package=czso). Access open data from the Czech Statistical Office.
- R package [ipumsr](https://cran.r-project.org/package=ipumsr). Access to the Integrated Public Use Microdata Series archive ipums.org (international censuses, harmonized U.S. data).
- R package [eph](https://cran.r-project.org/package=eph). Tools to download and manipulate the [EPH-INDEC](https://www.indec.gob.ar/) from Argentina (EPH is the Spanish acronym for Permanent Household Survey)

## Other lists
- [CSPA Service catalogue](https://www.statistical-services.org)
- [Code from NTTS 2021 publications](https://github.com/NTTSConf/NTTS21)

## Contributions

Awesome contributions are welcome, here are ways to do it:

- The GitHub way: send us a [pull request](https://help.github.com/articles/creating-a-pull-request/) to add directly to this list.
- Add an item to the
  [issue tracker](https://github.com/SNStatComp/awesome-official-statistics-software/issues)
issue tracker. (you need a GH account)
- Send an e-mail to `mark dot vanderloo at gmail dot com` or `olav dot tenbosch at gmail dot com` or tweet [\@olavtenbosch](https://twitter.com/olavtenbosch) or [\@markvdloo](https://twitter.com/markvdloo)

**Wear the badge.** Authors of software that is mentioned on this list gain the right to wear the [mentioned in awesome](https://github.com/sindresorhus/awesome/blob/master/awesome.md#awesome-mentioned-badge) badge on their website or GH repository. Please use the following code (or equivalent) to do so for your project.
```
[![Mentioned in Awesome Official Statistics ](https://awesome.re/mentioned-badge.svg)](http://www.awesomeofficialstatistics.org)
```


## License

[![Creative Commons License](https://i.creativecommons.org/l/by/4.0/88x31.png)](http://creativecommons.org/licenses/by/4.0/)  
This work is licensed under a [Creative Commons Attribution 4.0 International License](http://creativecommons.org/licenses/by/4.0/).

