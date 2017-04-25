
## awesome-official-statistics-software
An awesome list of open source statistical software packages useful for creating official statistics.

### Awesome official statistics software


#### Statistical data editing

- R package [validate](https://CRAN.R-project.org/package=validate). Rule management and data validation.
- R package [errorlocate](https://CRAN.R-project.org/package=errorlocate). Error localisation based on the principle of Fellegi and Holt.
    - Uses `validate` rule definitions
    - supports categorical and/or numeric data
    - supports linear equalities, inequalities and conditional rules.
    - Configurable backend for MIP-based error localization.
- R package [VIM](https://CRAN.R-project.org/package=VIM). Visualisation and Imputation of missing values.
    - Advanced visualisation of missing data patterns
    - Imputation using (robust) linear regression methods
    - Imputation using several donor-based methods (kNN, hot-deck)
- R package [VIMGUI](https://CRAN.R-project.org/package=VIMGUI). Graphical frontend to [VIM](https://CRAN.R-project.org/package=VIM)
- R package [simputation](https://CRAN.R-project.org/package=simputation). Simple imputation: many methods using a uniform interface following th [tidy tools manifesto](https://cran.r-project.org/web/packages/tidyverse/vignettes/manifesto.html)
    - Allows to easily combiny many imputation methods/strategies.
    - Supports regression (standard, M-estimation, ridge/lasso/elasticnet), hot-deck methods (powered by [VIM](https://CRAN.R-project.org/package=VIM)), randomForest, EM-based, and iterative randomForest imputation. Reuse of fitted models and definition of simple user-defined methods are supported as well.



#### Estimation and weighting


#### Time series and seasonal adjustment

    
#### Statistical disclosure control
- Java [Argus](http://research.cbs.nl/casc/). Tau-Argus and Mu-Argus for dististical disclosure control from Statistics Netherlands.

#### Scraping for Statistics

#### Statistical Dissemination
- R package [rsdmx](https://github.com/opensdmx/rsdmx). Reading SDMX webservices. Contains list of available SDMX webservices from national and international statistical institutes.
- Nodejs, d3 [http://research.cbs.nl/Projects/StatMine/](http://research.cbs.nl/Projects/StatMine/). Experimental visualization framework from Statistics Netherlands.
- SDMX-RI [SDMX-RI](https://webgate.ec.europa.eu/fpfis/mwikis/sdmx/index.php/SDMX_Reference_Infrastructure_SDMX-RI). Framework for disseminating data in SDMX format from Eurostat.
