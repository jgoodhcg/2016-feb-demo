-- name: add-visit!
-- log ip,uri, and time of visit
INSERT INTO visits
(ip, visit_time, uri)
VALUES (:ip ::inet, :time ::timestamp, :uri)
