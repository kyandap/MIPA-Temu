CREATE OR REPLACE PROCEDURE SP_CREATE_HANDOVER (
    p_item_id IN NUMBER,
    p_officer_id IN NUMBER,
    p_owner_id IN NUMBER,
    p_handover_code_hash IN VARCHAR2
)
IS
    v_item_status ITEMS.STATUS%TYPE;
    v_owner_id CLAIMS.USER_ID%TYPE;
BEGIN
    SELECT status
    INTO v_item_status
    FROM ITEMS
    WHERE item_id = p_item_id
    FOR UPDATE;

    IF v_item_status <> 'CLAIM_APPROVED' THEN
        RAISE_APPLICATION_ERROR(
            -20009,
            'Barang belum memiliki klaim yang disetujui.'
        );
    END IF;

    SELECT user_id
    INTO v_owner_id
    FROM CLAIMS
    WHERE item_id = p_item_id
      AND claim_status = 'APPROVED';

    IF v_owner_id <> p_owner_id THEN
        RAISE_APPLICATION_ERROR(
            -20010,
            'Pemilik tidak sesuai dengan klaim yang disetujui.'
        );
    END IF;

    INSERT INTO HANDOVER_RECORDS (
        item_id,
        officer_id,
        owner_id,
        handover_code_hash,
        status
    )
    VALUES (
        p_item_id,
        p_officer_id,
        p_owner_id,
        p_handover_code_hash,
        'PENDING'
    );
END;
/