use near_sdk::json_types::U128;
use near_sdk::store::LookupMap;
use near_sdk::{env, near, AccountId, Gas, NearToken, PanicOnDefault, Promise};

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
    pub ft_token_id: AccountId,
    pub ft_token_decimals: u8,
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
    recipient_expiry: LookupMap<AccountId, u64>,
    certificates: LookupMap<String, bool>,
    used_certificates: LookupMap<String, bool>,
    ft_token_id: AccountId,
    ft_token_decimals: u8,
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
        ft_token_id: AccountId,
        ft_token_decimals: u8,
    ) -> Self {
        assert!(per_tx_cap_yocto.0 > 0, "per-transaction cap must be positive");
        assert!(daily_cap_yocto.0 > 0, "daily cap must be positive");
        assert!(
            per_tx_cap_yocto.0 <= daily_cap_yocto.0,
            "per-transaction cap cannot exceed daily cap"
        );
        assert_eq!(
            ft_token_decimals, 24,
            "vault requires a 24-decimal wNEAR token"
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
            recipient_expiry: LookupMap::new(b"e"),
            certificates: LookupMap::new(b"c"),
            used_certificates: LookupMap::new(b"u"),
            ft_token_id,
            ft_token_decimals,
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
        self.recipient_expiry.insert(recipient_id.clone(), 0);
        emit_event(
            "dissent_vault_recipient_updated",
            serde_json::json!({ "recipient_id": recipient_id, "allowed": allowed }),
        );
    }

    /// Allow a quote-specific recipient until an absolute nanosecond timestamp.
    /// This bounds a per-quote deposit address to the quote window instead of
    /// leaving it allowlisted forever.
    pub fn set_recipient_until(
        &mut self,
        recipient_id: AccountId,
        expires_at_ns: u64,
    ) {
        self.assert_owner();
        assert!(
            expires_at_ns > env::block_timestamp(),
            "recipient expiry must be in the future"
        );
        self.recipients.insert(recipient_id.clone(), true);
        self.recipient_expiry.insert(recipient_id.clone(), expires_at_ns);
        emit_event(
            "dissent_vault_recipient_updated",
            serde_json::json!({
                "recipient_id": recipient_id,
                "allowed": true,
                "expires_at_ns": expires_at_ns
            }),
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
        self.assert_spend_allowed(&certificate_id, &recipient_id, amount_yocto.0, &memo);
        self.record_spend(&certificate_id, amount_yocto.0);
        emit_event(
            "dissent_vault_spend",
            serde_json::json!({
                "asset": "native_near",
                "certificate_id": certificate_id,
                "recipient_id": recipient_id,
                "amount_yocto": amount_yocto.0.to_string(),
                "spent_today_yocto": self.spent_today_yocto.to_string()
            }),
        );
        Promise::new(recipient_id).transfer(NearToken::from_yoctonear(amount_yocto.0))
    }

    /// Spend the configured NEP-141 token (Tidepool wNEAR). The cap is tracked in
    /// yoctoNEAR-equivalent units; wNEAR is 1:1 with NEAR. The token contract is
    /// fixed at initialization so the agent cannot redirect the vault to an
    /// arbitrary token contract.
    pub fn spend_ft_as(
        &mut self,
        certificate_id: String,
        recipient_id: AccountId,
        amount_yocto: U128,
        memo: String,
    ) -> Promise {
        self.assert_spend_allowed(&certificate_id, &recipient_id, amount_yocto.0, &memo);
        self.record_spend(&certificate_id, amount_yocto.0);
        emit_event(
            "dissent_vault_spend",
            serde_json::json!({
                "asset": self.ft_token_id,
                "certificate_id": certificate_id,
                "recipient_id": recipient_id,
                "amount_yocto": amount_yocto.0.to_string(),
                "spent_today_yocto": self.spent_today_yocto.to_string()
            }),
        );
        Promise::new(self.ft_token_id.clone()).function_call(
            "ft_transfer".to_string(),
            serde_json::json!({
                "receiver_id": recipient_id,
                "amount": amount_yocto.0.to_string(),
                "memo": memo,
            })
            .to_string()
            .into_bytes(),
            NearToken::from_yoctonear(1),
            Gas::from_tgas(30),
        )
    }

    /// Owner-only conversion of native NEAR held by the vault into the configured
    /// NEP-141 token. This does not count against the trading caps; it only changes
    /// the vault's asset form. The token contract must have storage registered for
    /// the vault before this call.
    pub fn wrap(&mut self, amount_yocto: U128) -> Promise {
        self.assert_owner();
        assert!(amount_yocto.0 > 0, "wrap amount must be positive");
        assert!(
            env::account_balance().as_yoctonear() >= amount_yocto.0,
            "insufficient vault balance"
        );
        Promise::new(self.ft_token_id.clone()).function_call(
            "near_deposit".to_string(),
            b"{}".to_vec(),
            NearToken::from_yoctonear(amount_yocto.0),
            Gas::from_tgas(30),
        )
    }

    pub fn get_config(&self) -> VaultConfig {
        VaultConfig {
            owner_id: self.owner_id.clone(),
            agent_id: self.agent_id.clone(),
            treasury_id: self.treasury_id.clone(),
            per_tx_cap_yocto: U128(self.per_tx_cap_yocto),
            daily_cap_yocto: U128(self.daily_cap_yocto),
            paused: self.paused,
            ft_token_id: self.ft_token_id.clone(),
            ft_token_decimals: self.ft_token_decimals,
        }
    }

    pub fn get_ft_token_id(&self) -> AccountId {
        self.ft_token_id.clone()
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

    fn assert_spend_allowed(
        &self,
        certificate_id: &str,
        recipient_id: &AccountId,
        amount_yocto: u128,
        memo: &str,
    ) {
        assert_eq!(
            env::predecessor_account_id(),
            self.agent_id,
            "caller is not the vault agent"
        );
        assert!(!self.paused, "vault is paused");
        assert!(
            self.certificates.get(certificate_id).copied().unwrap_or(false),
            "certificate_id is not approved"
        );
        assert!(
            self.recipients.get(recipient_id).copied().unwrap_or(false),
            "recipient is not allowlisted"
        );
        let expiry = self.recipient_expiry.get(recipient_id).copied().unwrap_or(0);
        assert!(
            expiry == 0 || env::block_timestamp() <= expiry,
            "recipient allowlist has expired"
        );
        assert!(
            !self
                .used_certificates
                .get(certificate_id)
                .copied()
                .unwrap_or(false),
            "certificate already used"
        );
        assert!(
            memo.contains(certificate_id),
            "memo must contain the approved certificate_id"
        );
        assert!(amount_yocto > 0, "amount must be positive");
        assert!(
            amount_yocto <= self.per_tx_cap_yocto,
            "amount exceeds per-transaction cap"
        );
        let day = env::block_timestamp() / DAY_NS;
        let spent_today = if day == self.day_bucket {
            self.spent_today_yocto
        } else {
            0
        };
        assert!(
            spent_today + amount_yocto <= self.daily_cap_yocto,
            "amount exceeds daily cap"
        );
    }

    fn record_spend(&mut self, certificate_id: &str, amount_yocto: u128) {
        let day = env::block_timestamp() / DAY_NS;
        if day != self.day_bucket {
            self.day_bucket = day;
            self.spent_today_yocto = 0;
        }
        self.spent_today_yocto += amount_yocto;
        self.used_certificates
            .insert(certificate_id.to_string(), true);
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
            accounts(3),
            24,
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
    fn reports_configured_ft_token() {
        let vault = setup();
        assert_eq!(vault.get_ft_token_id(), accounts(3));
    }

    #[test]
    fn spend_ft_as_records_the_spend_and_emits_an_event() {
        let mut vault = setup();
        vault.approve_certificate("cert-1".to_string());
        vault.set_recipient(accounts(4), true);
        let mut context = VMContextBuilder::new();
        context
            .current_account_id(accounts(0))
            .predecessor_account_id(accounts(1))
            .account_balance(NearToken::from_near(10));
        testing_env!(context.build());
        vault.spend_ft_as(
            "cert-1".to_string(),
            accounts(4),
            U128(10),
            "cert-1".to_string(),
        );
        assert_eq!(vault.get_spent_today(), U128(10));
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
    #[should_panic(expected = "recipient is not allowlisted")]
    fn rejects_unlisted_ft_recipient() {
        let mut vault = setup();
        vault.approve_certificate("cert-1".to_string());
        let mut context = VMContextBuilder::new();
        context
            .current_account_id(accounts(0))
            .predecessor_account_id(accounts(1))
            .account_balance(NearToken::from_near(10));
        testing_env!(context.build());
        vault.spend_ft_as(
            "cert-1".to_string(),
            accounts(4),
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

    #[test]
    fn recipient_can_be_bounded_to_a_quote_window() {
        let mut vault = setup();
        let mut context = VMContextBuilder::new();
        context
            .current_account_id(accounts(0))
            .predecessor_account_id(accounts(0))
            .block_timestamp(1_000);
        testing_env!(context.build());
        vault.set_recipient_until(accounts(4), 2_000);
        assert!(vault.is_recipient(accounts(4)));
    }

    #[test]
    #[should_panic(expected = "recipient allowlist has expired")]
    fn rejects_expired_quote_recipient() {
        let mut vault = setup();
        vault.approve_certificate("cert-1".to_string());
        let mut context = VMContextBuilder::new();
        context
            .current_account_id(accounts(0))
            .predecessor_account_id(accounts(0))
            .block_timestamp(1_000);
        testing_env!(context.build());
        vault.set_recipient_until(accounts(4), 2_000);
        context
            .current_account_id(accounts(0))
            .predecessor_account_id(accounts(1))
            .block_timestamp(3_000)
            .account_balance(NearToken::from_near(10));
        testing_env!(context.build());
        vault.spend_ft_as(
            "cert-1".to_string(),
            accounts(4),
            U128(10),
            "cert-1".to_string(),
        );
    }

    #[test]
    #[should_panic(expected = "certificate already used")]
    fn rejects_replayed_certificate() {
        let mut vault = setup();
        vault.approve_certificate("cert-1".to_string());
        vault.set_recipient(accounts(4), true);
        let mut context = VMContextBuilder::new();
        context
            .current_account_id(accounts(0))
            .predecessor_account_id(accounts(1))
            .account_balance(NearToken::from_near(10));
        testing_env!(context.build());
        vault.spend_ft_as(
            "cert-1".to_string(),
            accounts(4),
            U128(10),
            "cert-1".to_string(),
        );
        vault.spend_ft_as(
            "cert-1".to_string(),
            accounts(4),
            U128(10),
            "cert-1".to_string(),
        );
    }

    #[test]
    #[should_panic(expected = "vault requires a 24-decimal wNEAR token")]
    fn rejects_wrong_token_decimals() {
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
            accounts(3),
            6,
        );
    }
}
