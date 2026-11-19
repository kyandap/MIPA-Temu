CREATE OR REPLACE PROCEDURE SP_CONFIRM_HANDOVER (
    p_handover_id IN NUMBER
)
IS
    v_status HANDOVER_RECORDS.STATUS%TYPE;
BEGIN
    SELECT status
    INTO v_status
    FROM HANDOVER_RECORDS
    WHERE handover_id = p_handover_id
    FOR UPDATE;

    IF v_status <> 'PENDING' THEN
        RAISE_APPLICATION_ERROR(
            -20011,
            'Serah terima tidak dapat dikonfirmasi.'
        );
    END IF;

    UPDATE HANDOVER_RECORDS
    SET status = 'COMPLETED'
    WHERE handover_id = p_handover_id;
END;
/