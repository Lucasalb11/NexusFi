#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, Address, BytesN, Env, Vec,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum ScoreError {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    Unauthorized = 3,
    InvalidScore = 4,
}

#[contracttype]
#[derive(Clone)]
pub struct ScoreRecord {
    pub score: u32,
    pub timestamp: u64,
    pub metadata_hash: BytesN<32>,
}

#[contracttype]
pub enum DataKey {
    Admin,
    Score(Address),
    History(Address),
}

const MAX_SCORE: u32 = 1000;
const MAX_HISTORY: u32 = 20;

const BUMP_AMOUNT: u32 = 518_400;
const LIFETIME_THRESHOLD: u32 = 535_680;

#[contract]
pub struct CreditScoreContract;

#[contractimpl]
impl CreditScoreContract {
    pub fn initialize(env: Env, admin: Address) -> Result<(), ScoreError> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(ScoreError::AlreadyInitialized);
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .instance()
            .extend_ttl(BUMP_AMOUNT, LIFETIME_THRESHOLD);
        Ok(())
    }

    /// Only the admin (CRE workflow / backend service) can write scores.
    pub fn set_score(
        env: Env,
        user: Address,
        score: u32,
        timestamp: u64,
        metadata_hash: BytesN<32>,
    ) -> Result<(), ScoreError> {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(ScoreError::NotInitialized)?;
        admin.require_auth();

        if score > MAX_SCORE {
            return Err(ScoreError::InvalidScore);
        }

        let record = ScoreRecord {
            score,
            timestamp,
            metadata_hash,
        };

        let score_key = DataKey::Score(user.clone());
        env.storage().persistent().set(&score_key, &record);
        env.storage()
            .persistent()
            .extend_ttl(&score_key, BUMP_AMOUNT, LIFETIME_THRESHOLD);

        let history_key = DataKey::History(user.clone());
        let mut history: Vec<ScoreRecord> = env
            .storage()
            .persistent()
            .get(&history_key)
            .unwrap_or(Vec::new(&env));

        history.push_back(record);
        if history.len() > MAX_HISTORY {
            history.remove(0);
        }

        env.storage().persistent().set(&history_key, &history);
        env.storage()
            .persistent()
            .extend_ttl(&history_key, BUMP_AMOUNT, LIFETIME_THRESHOLD);

        env.events().publish(
            (soroban_sdk::Symbol::new(&env, "score_updated"), user),
            score,
        );

        Ok(())
    }

    pub fn get_score(env: Env, user: Address) -> Option<ScoreRecord> {
        let key = DataKey::Score(user);
        env.storage().persistent().get(&key)
    }

    pub fn get_history(env: Env, user: Address) -> Vec<ScoreRecord> {
        let key = DataKey::History(user);
        env.storage()
            .persistent()
            .get(&key)
            .unwrap_or(Vec::new(&env))
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Env};

    #[test]
    fn test_set_and_get_score() {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let user = Address::generate(&env);
        let contract_id = env.register_contract(None, CreditScoreContract);
        let client = CreditScoreContractClient::new(&env, &contract_id);

        client.initialize(&admin);

        let hash = BytesN::from_array(&env, &[0u8; 32]);
        client.set_score(&user, &782, &1700000000, &hash);

        let record = client.get_score(&user).unwrap();
        assert_eq!(record.score, 782);
        assert_eq!(record.timestamp, 1700000000);

        let history = client.get_history(&user);
        assert_eq!(history.len(), 1);
    }

    #[test]
    #[should_panic]
    fn test_invalid_score_over_max() {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let user = Address::generate(&env);
        let contract_id = env.register_contract(None, CreditScoreContract);
        let client = CreditScoreContractClient::new(&env, &contract_id);

        client.initialize(&admin);
        let hash = BytesN::from_array(&env, &[0u8; 32]);
        client.set_score(&user, &1500, &1700000000, &hash);
    }
}
