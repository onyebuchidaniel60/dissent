use near_sdk::json_types::U128;
use near_sdk::store::LookupMap;
use near_sdk::{env, near, AccountId, NearToken, PanicOnDefault, Promise};

const DAY_NS: u64 = 86_400_000_000_000;
const EVENT_STANDARD: &str = "dissent-vault";
const EVENT_VERSION: &str = "1.0.0";

#[near(serializers = [json, borsh])]
#[derive(Clone)]
pub struct VaultConfig {
    pub owner_id: AccountId,
    pub agent_id: AccountId,
    pub treasury_id: AccountId,
    pub per_tx_cap_yocto: U128,
    pub daily_cap_yocto: U128,
    pub paused: bool,
}

#[near(contract_state)]
#[derive(PanicOnDefault)]
pub struct DissentVault {
    owner_id: AccountId,
    agent_id: AccountId,
    treasury_id: AccountId,
    per_tx_cap_yocto: u128,
    daily_cap_yocto: u128,
    spent_today_yocto: u128,
    day_bucket: u64,
    paused: bool,
    recipients: LookupMap<AccountId, bool>,
    certificates: LookupMap<String, bool>,
}

#[near]
impl DissentVault {
    #[init]
    pub fn new(
        owner_id: AccountId,
        agent_id: AccountId,
        treasury_id: AccountId,
        per_tx_cap_yocto: U128,
        daily_cap_yocto: U128,
    ) -> Self {
        assert!(per_tx_cap_yocto.0 > 0, "per-transaction cap must be positive");
        assert!(daily_cap_yocto.0 > 0, "daily cap must be positive");
        assert!(
            per_tx_cap_yocto.0 <= daily_cap_yocto.0,
            "per-transaction cap cannot exceed daily cap"
        );
        Self {
            owner_id,
            agent_id,
            treasury_id,
            per_tx_cap_yocto: per_tx_cap_yocto.0,
            daily_cap_yocto: daily_cap_yocto.0,
            spent_today_yocto: 0,
            day_bucket: 0,
            paused: false,
            recipients: LookupMap::new(b"r"),
            certificates: LookupMap::new(b"c"),
        }
    }

    #[payable]
    pub fn deposit(&mut self) {
        assert!(
            env::attached_deposit().as_yoctonear() > 0,
            "deposit must be positive"
        );
        emit_event(
            "dissent_vault_deposited",
            serde_json::json!({
                "depositor": env::predecessor_account_id(),
                "amount_yocto": env::attached_deposit().as_yoctonear().to_string()
            }),
        );
    }

    pub fn approve_certificate(&mut self, certificate_id: String) {
        self.assert_owner();
        assert!(!certificate_id.is_empty(), "certificate_id is required");
        self.certificates.insert(certificate_id.clone(), true);
        emit_event(
            "dissent_vault_certificate_approved",
            serde_json::json!({ "certificate_id": certificate_id }),
        );
    }

    pub fn revoke_certificate(&mut self, certificate_id: String) {
        self.assert_owner();
        self.certificates.insert(certificate_id.clone(), false);
        emit_event(
            "dissent_vault_certificate_revoked",
            serde_json::json!({ "certificate_id": certificate_id }),
        );
    }

    pub fn set_recipient(&mut self, recipient_id: AccountId, allowed: bool) {
        self.assert_owner();
        self.recipients.insert(recipient_id.clone(), allowed);
        emit_event(
            "dissent_vault_recipient_updated",
            serde_json::json!({ "recipient_id": recipient_id, "allowed": allowed }),
        );
    }

    pub fn set_caps(&mut self, per_tx_cap_yocto: U128, daily_cap_yocto: U128) {
        self.assert_owner();
        assert!(per_tx_cap_yocto.0 > 0, "per-transaction cap must be positive");
        assert!(daily_cap_yocto.0 > 0, "daily cap must be positive");
        assert!(
            per_tx_cap_yocto.0 <= daily_cap_yocto.0,
            "per-transaction cap cannot exceed daily cap"
        );
        self.per_tx_cap_yocto = per_tx_cap_yocto.0;
        self.daily_cap_yocto = daily_cap_yocto.0;
    }

    pub fn set_paused(&mut self, paused: bool) {
        self.assert_owner();
        self.paused = paused;
    }

    pub fn withdraw(&mut self, amount_yocto: U128) {
        self.assert_owner();
        assert!(amount_yocto.0 > 0, "withdraw amount must be positive");
        assert!(
            amount_yocto.0 <= env::account_balance().as_yoctonear(),
            "insufficient vault balance"
        );
        Promise::new(self.treasury_id.clone())
            .transfer(NearToken::from_yoctonear(amount_yocto.0));
    }

    pub fn spend_as(
        &mut self,
        certificate_id: String,
        recipient_id: AccountId,
        amount_yocto: U128,
        memo: String,
    ) -> Promise {
        let predecessor = env::predecessor_account_id();
        assert_eq!(predecessor, self.agent_id, "caller is not the vault agent");
        assert!(!self.paused, "vault is paused");
        assert!(
            self.certificates.get(&certificate_id).copied().unwrap_or(false),
            "certificate_id is not approved"
        );
        assert!(
            self.recipients.get(&recipient_id).copied().unwrap_or(false),
            "recipient is not allowlisted"
        );
        assert!(
            memo.contains(&certificate_id),
            "memo must contain the approved certificate_id"
        );
        assert!(amount_yocto.0 > 0, "amount must be positive");
        assert!(
            amount_yocto.0 <= self.per_tx_cap_yocto,
            "amount exceeds per-transaction cap"
        );

        let day = env::block_timestamp() / DAY_NS;
        if day != self.day_bucket {
            self.day_bucket = day;
            self.spent_today_yocto = 0;
        }
        assert!(
            self.spent_today_yocto + amount_yocto.0 <= self.daily_cap_yocto,
            "amount exceeds daily cap"
        );
        assert!(
            env::account_balance().as_yoctonear() >= amount_yocto.0,
            "insufficient vault balance"
        );

        self.spent_today_yocto += amount_yocto.0;
        emit_event(
            "dissent_vault_spend",
            serde_json::json!({
                "certificate_id": certificate_id,
                "recipient_id": recipient_id,
                "amount_yocto": amount_yocto.0.to_string(),
                "spent_today_yocto": self.spent_today_yocto.to_string()
            }),
        );
        Promise::new(recipient_id).transfer(NearToken::from_yoctonear(amount_yocto.0))
    }

    pub fn get_config(&self) -> VaultConfig {
        VaultConfig {
            owner_id: self.owner_id.clone(),
            agent_id: self.agent_id.clone(),
            treasury_id: self.treasury_id.clone(),
            per_tx_cap_yocto: U128(self.per_tx_cap_yocto),
            daily_cap_yocto: U128(self.daily_cap_yocto),
            paused: self.paused,
        }
    }

    pub fn get_balance(&self) -> U128 {
        U128(env::account_balance().as_yoctonear())
    }

    pub fn get_spent_today(&self) -> U128 {
        let day = env::block_timestamp() / DAY_NS;
        if day == self.day_bucket {
            U128(self.spent_today_yocto)
        } else {
            U128(0)
        }
    }

    pub fn is_recipient(&self, recipient_id: AccountId) -> bool {
        self.recipients.get(&recipient_id).copied().unwrap_or(false)
    }

    pub fn is_certificate_approved(&self, certificate_id: String) -> bool {
        self.certificates.get(&certificate_id).copied().unwrap_or(false)
    }

    fn assert_owner(&self) {
        assert_eq!(
            env::predecessor_account_id(),
            self.owner_id,
            "caller is not the vault owner"
        );
    }
}

fn emit_event(event: &str, data: serde_json::Value) {
    env::log_str(&format!(
        "EVENT_JSON:{}",
        serde_json::json!({
            "standard": EVENT_STANDARD,
            "version": EVENT_VERSION,
            "event": event,
            "data": [data]
        })
    ));
}

#[cfg(test)]
mod tests {
    use super::*;
    use near_sdk::test_utils::{accounts, VMContextBuilder};
    use near_sdk::testing_env;

    fn setup() -> DissentVault {
        let mut context = VMContextBuilder::new();
        context
            .current_account_id(accounts(0))
            .predecessor_account_id(accounts(0))
            .account_balance(NearToken::from_near(10));
        testing_env!(context.build());
        DissentVault::new(
            accounts(0),
            accounts(1),
            accounts(2),
            U128(500_000_000_000_000_000_000_000),
            U128(1_000_000_000_000_000_000_000_000),
        )
    }

    #[test]
    fn owner_can_approve_and_allowlist() {
        let mut vault = setup();
        vault.approve_certificate("cert-1".to_string());
        vault.set_recipient(accounts(3), true);
        assert!(vault.is_certificate_approved("cert-1".to_string()));
        assert!(vault.is_recipient(accounts(3)));
    }

    #[test]
    #[should_panic(expected = "recipient is not allowlisted")]
    fn rejects_unlisted_recipient() {
        let mut vault = setup();
        vault.approve_certificate("cert-1".to_string());
        let mut context = VMContextBuilder::new();
        context
            .current_account_id(accounts(0))
            .predecessor_account_id(accounts(1))
            .account_balance(NearToken::from_near(10));
        testing_env!(context.build());
        vault.spend_as(
            "cert-1".to_string(),
            accounts(3),
            U128(1),
            "cert-1".to_string(),
        );
    }

    #[test]
    #[should_panic(expected = "amount exceeds per-transaction cap")]
    fn rejects_per_tx_cap_breach() {
        let mut vault = setup();
        vault.approve_certificate("cert-1".to_string());
        vault.set_recipient(accounts(3), true);
        let mut context = VMContextBuilder::new();
        context
            .current_account_id(accounts(0))
            .predecessor_account_id(accounts(1))
            .account_balance(NearToken::from_near(10));
        testing_env!(context.build());
        vault.spend_as(
            "cert-1".to_string(),
            accounts(3),
            U128(500_000_000_000_000_000_000_001),
            "cert-1".to_string(),
        );
    }

    #[test]
    #[should_panic(expected = "memo must contain the approved certificate_id")]
    fn rejects_bad_memo() {
        let mut vault = setup();
        vault.approve_certificate("cert-1".to_string());
        vault.set_recipient(accounts(3), true);
        let mut context = VMContextBuilder::new();
        context
            .current_account_id(accounts(0))
            .predecessor_account_id(accounts(1))
            .account_balance(NearToken::from_near(10));
        testing_env!(context.build());
        vault.spend_as(
            "cert-1".to_string(),
            accounts(3),
            U128(1),
            "wrong memo".to_string(),
        );
    }

    #[test]
    #[should_panic(expected = "certificate_id is not approved")]
    fn rejects_unapproved_certificate() {
        let mut vault = setup();
        vault.set_recipient(accounts(3), true);
        let mut context = VMContextBuilder::new();
        context
            .current_account_id(accounts(0))
            .predecessor_account_id(accounts(1))
            .account_balance(NearToken::from_near(10));
        testing_env!(context.build());
        vault.spend_as(
            "cert-unknown".to_string(),
            accounts(3),
            U128(1),
            "cert-unknown".to_string(),
        );
    }
}
