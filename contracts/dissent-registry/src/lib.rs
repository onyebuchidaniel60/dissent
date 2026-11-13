use near_sdk::json_types::U128;
use near_sdk::store::LookupMap;
use near_sdk::{env, near, AccountId, NearToken, PanicOnDefault, Promise};

const EVENT_STANDARD: &str = "dissent";
const EVENT_VERSION: &str = "1.0.0";

#[near(serializers = [json, borsh])]
#[derive(Clone)]
pub struct AuditCommitment {
    pub audit_id: String,
    pub client_id: AccountId,
    pub thesis_hash: String,
    pub conditions_hash: String,
    pub canonicalization_version: String,
    pub conditions_version: String,
    pub policy_hash: String,
    pub committed_at_block_height: u64,
    pub committed_at_timestamp_ns: u64,
}

#[near(serializers = [json, borsh])]
#[derive(Clone)]
pub enum Verdict {
    TRADE,
    REFUSE,
    ABSTAIN,
}

#[near(serializers = [json, borsh])]
#[derive(Clone)]
pub struct CertificateRecord {
    pub audit_id: String,
    pub certificate_hash: String,
    pub verdict: Verdict,
    pub policy_hash: String,
    pub client_id: AccountId,
    pub finalized_at_block_height: u64,
    pub finalized_at_timestamp_ns: u64,
}

#[near(serializers = [json, borsh])]
#[derive(Clone)]
pub struct FeeQuote {
    pub quote_id: String,
    pub audit_id: String,
    pub amount_yocto: U128,
    pub quote_hash: String,
    pub expires_at_ns: u64,
    pub used: bool,
}

#[near(serializers = [json, borsh])]
#[derive(Clone)]
pub struct FundingRecord {
    pub audit_id: String,
    pub quote_id: String,
    pub client_id: AccountId,
    pub amount_yocto: U128,
    pub bounty_pool_yocto: U128,
    pub funded_at_block_height: u64,
}

#[near(serializers = [json, borsh])]
#[derive(Clone)]
pub struct BountyAllocation {
    pub settlement_id: String,
    pub finding_id: String,
    pub recipient_id: AccountId,
    pub amount_yocto: U128,
    pub claimed: bool,
}

#[near(serializers = [json, borsh])]
#[derive(Clone)]
pub struct AllocationInput {
    pub settlement_id: String,
    pub finding_id: String,
    pub recipient_id: AccountId,
    pub amount_yocto: U128,
}

#[near(contract_state)]
#[derive(PanicOnDefault)]
pub struct DissentRegistry {
    owner_id: AccountId,
    adjudicator_id: AccountId,
    treasury_id: AccountId,
    payout_id: AccountId,
    commitments: LookupMap<String, AuditCommitment>,
    certificates: LookupMap<String, CertificateRecord>,
    quotes: LookupMap<String, FeeQuote>,
    funding: LookupMap<String, FundingRecord>,
    allocations: LookupMap<String, BountyAllocation>,
    funded_by_audit: LookupMap<String, U128>,
    allocated_by_audit: LookupMap<String, U128>,
}

#[near]
impl DissentRegistry {
    #[init]
    pub fn new(
        owner_id: AccountId,
        adjudicator_id: AccountId,
        treasury_id: AccountId,
        payout_id: AccountId,
    ) -> Self {
        Self {
            owner_id,
            adjudicator_id,
            treasury_id,
            payout_id,
            commitments: LookupMap::new(b"c"),
            certificates: LookupMap::new(b"x"),
            quotes: LookupMap::new(b"q"),
            funding: LookupMap::new(b"f"),
            allocations: LookupMap::new(b"a"),
            funded_by_audit: LookupMap::new(b"p"),
            allocated_by_audit: LookupMap::new(b"o"),
        }
    }

    pub fn commit_audit(
        &mut self,
        audit_id: String,
        thesis_hash: String,
        conditions_hash: String,
        canonicalization_version: String,
        conditions_version: String,
        policy_hash: String,
    ) -> AuditCommitment {
        require_hash(&thesis_hash);
        require_hash(&conditions_hash);
        require_hash(&policy_hash);
        assert!(!audit_id.is_empty(), "audit_id is required");
        assert!(
            !self.commitments.contains_key(&audit_id),
            "audit_id already committed"
        );

        let commitment = AuditCommitment {
            audit_id: audit_id.clone(),
            client_id: env::predecessor_account_id(),
            thesis_hash,
            conditions_hash,
            canonicalization_version,
            conditions_version,
            policy_hash,
            committed_at_block_height: env::block_height(),
            committed_at_timestamp_ns: env::block_timestamp(),
        };
        self.commitments.insert(audit_id.clone(), commitment.clone());
        emit_event(
            "dissent_audit_committed",
            serde_json::json!({
                "audit_id": audit_id,
                "client_id": commitment.client_id,
                "thesis_hash": commitment.thesis_hash,
                "conditions_hash": commitment.conditions_hash,
                "policy_hash": commitment.policy_hash,
                "block_height": commitment.committed_at_block_height
            }),
        );
        commitment
    }

    pub fn get_commitment(&self, audit_id: String) -> Option<AuditCommitment> {
        self.commitments.get(&audit_id).cloned()
    }

    pub fn issue_quote(
        &mut self,
        audit_id: String,
        quote_id: String,
        amount_yocto: U128,
        quote_hash: String,
        expires_at_ns: u64,
    ) -> FeeQuote {
        self.assert_adjudicator();
        assert!(
            self.commitments.contains_key(&audit_id),
            "commitment does not exist"
        );
        assert!(!quote_id.is_empty(), "quote_id is required");
        assert!(
            !self.quotes.contains_key(&quote_id),
            "quote_id already exists"
        );
        require_hash(&quote_hash);
        assert!(amount_yocto.0 > 0, "quote amount must be positive");
        assert!(
            expires_at_ns > env::block_timestamp(),
            "quote must expire in the future"
        );

        let quote = FeeQuote {
            quote_id: quote_id.clone(),
            audit_id,
            amount_yocto,
            quote_hash,
            expires_at_ns,
            used: false,
        };
        self.quotes.insert(quote_id, quote.clone());
        quote
    }

    pub fn get_quote(&self, quote_id: String) -> Option<FeeQuote> {
        self.quotes.get(&quote_id).cloned()
    }

    #[payable]
    pub fn fund_audit(&mut self, audit_id: String, quote_id: String, quote_hash: String) {
        let predecessor = env::predecessor_account_id();
        let commitment = self
            .commitments
            .get(&audit_id)
            .cloned()
            .expect("commitment does not exist");
        assert_eq!(predecessor, commitment.client_id, "caller is not the client");
        assert!(
            !self.funding.contains_key(&audit_id),
            "audit is already funded"
        );

        let quote = self
            .quotes
            .get(&quote_id)
            .cloned()
            .expect("quote does not exist");
        assert_eq!(quote.audit_id, audit_id, "quote belongs to another audit");
        assert!(!quote.used, "quote has already been used");
        assert!(
            quote.expires_at_ns > env::block_timestamp(),
            "quote has expired"
        );
        assert_eq!(quote.quote_hash, quote_hash, "quote hash mismatch");
        assert_eq!(
            env::attached_deposit(),
            NearToken::from_yoctonear(quote.amount_yocto.0),
            "attached deposit must equal the quote exactly"
        );

        let bounty_pool = quote.amount_yocto.0 * 80 / 100;
        let record = FundingRecord {
            audit_id: audit_id.clone(),
            quote_id: quote_id.clone(),
            client_id: predecessor,
            amount_yocto: quote.amount_yocto,
            bounty_pool_yocto: U128(bounty_pool),
            funded_at_block_height: env::block_height(),
        };
        self.funding.insert(audit_id.clone(), record.clone());
        self.funded_by_audit
            .insert(audit_id.clone(), U128(bounty_pool));
        self.allocated_by_audit.insert(audit_id.clone(), U128(0));

        let mut used_quote = quote;
        used_quote.used = true;
        self.quotes.insert(quote_id, used_quote);

        emit_event(
            "dissent_audit_funded",
            serde_json::json!({
                "audit_id": audit_id,
                "client_id": record.client_id,
                "amount_yocto": record.amount_yocto.0.to_string(),
                "bounty_pool_yocto": record.bounty_pool_yocto.0.to_string(),
                "block_height": record.funded_at_block_height
            }),
        );
    }

    pub fn get_funding(&self, audit_id: String) -> Option<FundingRecord> {
        self.funding.get(&audit_id).cloned()
    }

    pub fn finalize_certificate(
        &mut self,
        audit_id: String,
        certificate_hash: String,
        verdict: Verdict,
        policy_hash: String,
    ) -> CertificateRecord {
        self.assert_adjudicator();
        require_hash(&certificate_hash);
        require_hash(&policy_hash);
        let commitment = self
            .commitments
            .get(&audit_id)
            .cloned()
            .expect("commitment does not exist");
        assert_eq!(
            commitment.policy_hash, policy_hash,
            "policy hash does not match commitment"
        );
        assert!(
            !self.certificates.contains_key(&audit_id),
            "certificate already finalized"
        );

        let record = CertificateRecord {
            audit_id: audit_id.clone(),
            certificate_hash,
            verdict,
            policy_hash,
            client_id: commitment.client_id,
            finalized_at_block_height: env::block_height(),
            finalized_at_timestamp_ns: env::block_timestamp(),
        };
        self.certificates.insert(audit_id.clone(), record.clone());
        emit_event(
            "dissent_certificate_finalized",
            serde_json::json!({
                "audit_id": audit_id,
                "certificate_hash": record.certificate_hash,
                "policy_hash": record.policy_hash,
                "block_height": record.finalized_at_block_height
            }),
        );
        record
    }

    pub fn get_certificate(&self, audit_id: String) -> Option<CertificateRecord> {
        self.certificates.get(&audit_id).cloned()
    }

    pub fn record_bounty_allocations(
        &mut self,
        audit_id: String,
        certificate_hash: String,
        policy_hash: String,
        allocations: Vec<AllocationInput>,
    ) {
        self.assert_adjudicator();
        let certificate = self
            .certificates
            .get(&audit_id)
            .cloned()
            .expect("certificate does not exist");
        assert_eq!(
            certificate.certificate_hash, certificate_hash,
            "certificate hash mismatch"
        );
        assert_eq!(certificate.policy_hash, policy_hash, "policy hash mismatch");
        assert!(!allocations.is_empty(), "allocations are required");

        let funded = self
            .funded_by_audit
            .get(&audit_id)
            .cloned()
            .unwrap_or(U128(0))
            .0;
        let mut allocated = self
            .allocated_by_audit
            .get(&audit_id)
            .cloned()
            .unwrap_or(U128(0))
            .0;

        for allocation in allocations {
            assert!(allocation.amount_yocto.0 > 0, "amount must be positive");
            assert_eq!(
                allocation.recipient_id, self.payout_id,
                "recipient is not allowlisted"
            );
            assert!(
                !self.allocations.contains_key(&allocation.settlement_id),
                "settlement_id already recorded"
            );
            allocated += allocation.amount_yocto.0;
            assert!(allocated <= funded, "allocation exceeds funded pool");
            self.allocations.insert(
                allocation.settlement_id.clone(),
                BountyAllocation {
                    settlement_id: allocation.settlement_id,
                    finding_id: allocation.finding_id,
                    recipient_id: allocation.recipient_id,
                    amount_yocto: allocation.amount_yocto,
                    claimed: false,
                },
            );
        }

        self.allocated_by_audit.insert(audit_id.clone(), U128(allocated));
        emit_event(
            "dissent_bounty_allocated",
            serde_json::json!({
                "audit_id": audit_id,
                "certificate_hash": certificate_hash,
                "allocated_yocto": allocated.to_string()
            }),
        );
    }

    pub fn get_allocation(&self, settlement_id: String) -> Option<BountyAllocation> {
        self.allocations.get(&settlement_id).cloned()
    }

    #[payable]
    pub fn claim_bounty(&mut self, settlement_id: String) -> Promise {
        let caller = env::predecessor_account_id();
        let mut allocation = self
            .allocations
            .get(&settlement_id)
            .cloned()
            .expect("allocation does not exist");
        assert_eq!(caller, allocation.recipient_id, "caller is not the recipient");
        assert!(!allocation.claimed, "allocation already claimed");
        assert!(allocation.amount_yocto.0 > 0, "allocation is empty");

        allocation.claimed = true;
        let amount = allocation.amount_yocto.0;
        self.allocations.insert(settlement_id.clone(), allocation);

        emit_event(
            "dissent_bounty_claimed",
            serde_json::json!({
                "settlement_id": settlement_id,
                "recipient_id": caller,
                "amount_yocto": amount.to_string()
            }),
        );

        Promise::new(caller).transfer(NearToken::from_yoctonear(amount))
    }

    pub fn get_owner(&self) -> AccountId {
        self.owner_id.clone()
    }

    pub fn get_adjudicator(&self) -> AccountId {
        self.adjudicator_id.clone()
    }

    pub fn get_treasury(&self) -> AccountId {
        self.treasury_id.clone()
    }

    pub fn get_payout(&self) -> AccountId {
        self.payout_id.clone()
    }

    fn assert_adjudicator(&self) {
        assert_eq!(
            env::predecessor_account_id(),
            self.adjudicator_id,
            "caller is not the adjudicator"
        );
    }
}

fn require_hash(value: &str) {
    assert_eq!(value.len(), 64, "hash must be 64 lowercase hex characters");
    assert!(
        value.bytes().all(|byte| byte.is_ascii_hexdigit() && !byte.is_ascii_uppercase()),
        "hash must be 64 lowercase hex characters"
    );
}

fn emit_event(event: &str, data: serde_json::Value) {
    let payload = serde_json::json!({
        "standard": EVENT_STANDARD,
        "version": EVENT_VERSION,
        "event": event,
        "data": [data]
    });
    env::log_str(&format!("EVENT_JSON:{}", payload));
}
