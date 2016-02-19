CREATE TABLE visits
(ip inet,
 visit_time timestamp,
 uri varchar(200),
 constraint visits_pk primary key (ip, visit_time, uri));

