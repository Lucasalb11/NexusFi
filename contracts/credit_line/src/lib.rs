#![no_std]

use soroban_sdk::{contract, contracterror, contractimpl, contracttype, Address, Env, Symbol};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum CreditError {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    Unauthorized = 3,
    NoCreditLine = 4,
    InsufficientCredit = 5,
    InvalidAmount = 6,
    CreditLineExists = 7,
}

#[contracttype]
#[derive(Clone)]
pub struct CreditInfo {
    pub limit: i128,
    pub used: i128,
    pub interest_rate_bps: u32,
    pub score_at_opening: u32,
    pub opened_at: u64,
}

#[contracttype]
pub enum DataKey {
    Admin,
    CreditLine(Address),
}

const BUMP_AMOUNT: u32 = 518_400;
const LIFETIME_THRESHOLD: u32 = 535_680;

/// Score tier thresholds and their corresponding credit limits (in 7-decimal token units).
/// Score >= 800 -> $10,000; >= 600 -> $5,000; >= 400 -> $2,000; < 400 -> $500
fn limit_for_score(score: u32) -> i128 {
    if score >= 800 {
        10_000_0000000
    } else if score >= 600 {
        5_000_0000000
    } else if score >= 400 {
        2_000_0000000
    } else {
        500_0000000
    }
}

fn rate_for_score(score: u32) -> u32 {
    if score >= 800 {
        300  // 3.0% APR
    } else if score >= 600 {
        800  // 8.0%
    } else if score >= 400 {
        1500 // 15.0%
    } else {
        2500 // 25.0%
    }
}

#[contract]
pub struct CreditLineContract;

#[contractimpl]
impl CreditLineContract {
    pub fn initialize(env: Env, admin: Address) -> Result<(), CreditError> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(CreditError::AlreadyInitialized);
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .instance()
            .extend_ttl(BUMP_AMOUNT, LIFETIME_THRESHOLD);
        Ok(())
    }

    /// Open a credit line for a user based on their AI credit score.
    /// Only admin (backend/CRE) can call this.
    pub fn open_credit_line(
        env: Env,
        user: Address,
        score: u32,
        timestamp: u64,
    ) -> Result<CreditInfo, CreditError> {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(CreditError::NotInitialized)?;
        admin.require_auth();

        let key = DataKey::CreditLine(user.clone());
        if env.storage().persistent().has(&key) {
            return Err(CreditError::CreditLineExists);
        }

        let info = CreditInfo {
            limit: limit_for_score(score),
            used: 0,
            interest_rate_bps: rate_for_score(score),
            score_at_opening: score,
            opened_at: timestamp,
        };

        env.storage().persistent().set(&key, &info);
        env.storage()
            .persistent()
            .extend_ttl(&key, BUMP_AMOUNT, LIFETIME_THRESHOLD);

        env.events().publish(
            (Symbol::new(&env, "credit_opened"), user),
            info.limit,
        );

        Ok(info)
    }

    /// Use credit (spend on the card). User must authorize.
    pub fn use_credit(env: Env, user: Address, amount: i128) -> Result<CreditInfo, CreditError> {
        user.require_auth();

        if amount <= 0 {
            return Err(CreditError::InvalidAmount);
        }

        let key = DataKey::CreditLine(user.clone());
        let mut info: CreditInfo = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(CreditError::NoCreditLine)?;

        let available = info.limit - info.used;
        if amount > available {
            return Err(CreditError::InsufficientCredit);
        }

        info.used += amount;
        env.storage().persistent().set(&key, &info);
        env.storage()
            .persistent()
            .extend_ttl(&key, BUMP_AMOUNT, LIFETIME_THRESHOLD);

        env.events().publish(
            (Symbol::new(&env, "credit_used"), user),
            amount,
        );

        Ok(info)
    }

    /// Repay credit balance. User must authorize.
    pub fn repay(env: Env, user: Address, amount: i128) -> Result<CreditInfo, CreditError> {
        user.require_auth();

        if amount <= 0 {
            return Err(CreditError::InvalidAmount);
        }

        let key = DataKey::CreditLine(user.clone());
        let mut info: CreditInfo = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(CreditError::NoCreditLine)?;

        let repay_amount = if amount > info.used { info.used } else { amount };
        info.used -= repay_amount;

        env.storage().persistent().set(&key, &info);
        env.storage()
            .persistent()
            .extend_ttl(&key, BUMP_AMOUNT, LIFETIME_THRESHOLD);

        env.events().publish(
            (Symbol::new(&env, "credit_repaid"), user),
            repay_amount,
        );

        Ok(info)
    }

    pub fn get_credit_info(env: Env, user: Address) -> Option<CreditInfo> {
        let key = DataKey::CreditLine(user);
        env.storage().persistent().get(&key)
    }

    pub fn get_available(env: Env, user: Address) -> i128 {
        let key = DataKey::CreditLine(user);
        if let Some(info) = env.storage().persistent().get::<_, CreditInfo>(&key) {
            info.limit - info.used
        } else {
            0
        }
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Env};

    fn setup() -> (Env, Address, CreditLineContractClient<'static>) {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let contract_id = env.register_contract(None, CreditLineContract);
        let client = CreditLineContractClient::new(&env, &contract_id);
        client.initialize(&admin);
        (env, admin, client)
    }

    #[test]
    fn test_open_and_use_credit() {
        let (env, _admin, client) = setup();
        let user = Address::generate(&env);

        let info = client.open_credit_line(&user, &782, &1700000000);
        assert_eq!(info.limit, 5_000_0000000);
        assert_eq!(info.used, 0);
        assert_eq!(info.interest_rate_bps, 800);

        let info = client.use_credit(&user, &1_000_0000000);
        assert_eq!(info.used, 1_000_0000000);
        assert_eq!(client.get_available(&user), 4_000_0000000);
    }

    #[test]
    fn test_repay() {
        let (env, _admin, client) = setup();
        let user = Address::generate(&env);

        client.open_credit_line(&user, &900, &1700000000);
        client.use_credit(&user, &3_000_0000000);
        let info = client.repay(&user, &1_000_0000000);

        assert_eq!(info.used, 2_000_0000000);
    }

    #[test]
    fn test_score_tiers() {
        let (env, _admin, client) = setup();

        let u1 = Address::generate(&env);
        let info1 = client.open_credit_line(&u1, &850, &1700000000);
        assert_eq!(info1.limit, 10_000_0000000);
        assert_eq!(info1.interest_rate_bps, 300);

        let u2 = Address::generate(&env);
        let info2 = client.open_credit_line(&u2, &350, &1700000000);
        assert_eq!(info2.limit, 500_0000000);
        assert_eq!(info2.interest_rate_bps, 2500);
    }

    #[test]
    #[should_panic]
    fn test_exceed_credit_limit() {
        let (env, _admin, client) = setup();
        let user = Address::generate(&env);

        client.open_credit_line(&user, &500, &1700000000);
        client.use_credit(&user, &3_000_0000000);
    }
}
