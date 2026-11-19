CREATE INDEX idx_items_name
ON ITEMS(item_name);

CREATE INDEX idx_items_category
ON ITEMS(category_id);

CREATE INDEX idx_items_status
ON ITEMS(status);

CREATE INDEX idx_items_location
ON ITEMS(location_found);

CREATE INDEX idx_claims_item
ON CLAIMS(item_id);

CREATE INDEX idx_claims_user
ON CLAIMS(user_id);

CREATE INDEX idx_custody_item
ON CUSTODY_RECORDS(item_id);