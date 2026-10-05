# CMS

Pages and homepage sections are structured JSON, not arbitrary HTML. `PageBuilderService` validates a fixed component allow-list and reorders sections without mutating source data. Sanitize any enabled custom HTML block and restrict it to trusted roles.

Navigation, banners, collections, scheduled homepage sections, films, series, episodes, metadata, media, access rules, and offers belong in database-backed admin workflows.
