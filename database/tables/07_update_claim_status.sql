ALTER TABLE CLAIMS
DROP CONSTRAINT chk_claims_status;

ALTER TABLE CLAIMS
ADD CONSTRAINT chk_claims_status
CHECK (
    claim_status IN (
        'PENDING',
        'VERIFIED',
        'APPROVED',
        'REJECTED'
    )
);