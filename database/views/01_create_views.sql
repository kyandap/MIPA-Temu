CREATE OR REPLACE VIEW VW_ITEM_CATALOG AS
SELECT
    i.item_id,
    i.item_name,
    i.description,
    i.photo,
    i.location_found,
    i.date_found,
    i.status,
    c.category_name,
    u.full_name AS finder_name
FROM ITEMS i
JOIN CATEGORIES c
    ON i.category_id = c.category_id
JOIN USERS u
    ON i.user_id = u.user_id
WHERE i.status IN ('ACTIVE', 'IN_CUSTODY');

CREATE OR REPLACE VIEW VW_CLAIM_HISTORY AS
SELECT
    cl.claim_id,
    cl.item_id,
    i.item_name,
    u.full_name AS claimant_name,
    u.npm,
    cl.claim_status,
    cl.attempt_count,
    cl.claim_date
FROM CLAIMS cl
JOIN ITEMS i
    ON cl.item_id = i.item_id
JOIN USERS u
    ON cl.user_id = u.user_id;

CREATE OR REPLACE VIEW VW_CUSTODY_HISTORY AS
SELECT
    cr.custody_id,
    cr.item_id,
    i.item_name,
    u.full_name AS officer_name,
    cr.from_location,
    cr.to_location,
    cr.custody_date,
    cr.notes
FROM CUSTODY_RECORDS cr
JOIN ITEMS i
    ON cr.item_id = i.item_id
JOIN USERS u
    ON cr.officer_id = u.user_id;

CREATE OR REPLACE VIEW VW_HANDOVER_HISTORY AS
SELECT
    h.handover_id,
    h.item_id,
    i.item_name,
    officer.full_name AS officer_name,
    owner.full_name AS owner_name,
    h.handover_date,
    h.status
FROM HANDOVER_RECORDS h
JOIN ITEMS i
    ON h.item_id = i.item_id
JOIN USERS officer
    ON h.officer_id = officer.user_id
JOIN USERS owner
    ON h.owner_id = owner.user_id;