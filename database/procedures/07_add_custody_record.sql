CREATE OR REPLACE PROCEDURE SP_ADD_CUSTODY_RECORD (
    p_item_id IN NUMBER,
    p_officer_id IN NUMBER,
    p_from_location IN VARCHAR2,
    p_to_location IN VARCHAR2,
    p_notes IN VARCHAR2
)
IS
    v_item_status ITEMS.STATUS%TYPE;
BEGIN
    SELECT status
    INTO v_item_status
    FROM ITEMS
    WHERE item_id = p_item_id
    FOR UPDATE;

    IF v_item_status NOT IN ('ACTIVE', 'IN_CUSTODY') THEN
        RAISE_APPLICATION_ERROR(
            -20012,
            'Perpindahan barang tidak dapat dicatat.'
        );
    END IF;

    INSERT INTO CUSTODY_RECORDS (
        item_id,
        officer_id,
        from_location,
        to_location,
        notes
    )
    VALUES (
        p_item_id,
        p_officer_id,
        p_from_location,
        p_to_location,
        p_notes
    );

    UPDATE ITEMS
    SET status = 'IN_CUSTODY'
    WHERE item_id = p_item_id;
END;
/