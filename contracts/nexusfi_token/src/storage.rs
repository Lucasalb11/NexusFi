use soroban_sdk::{contracttype, Address, Env, String};

use crate::TokenError;

#[contracttype]
pub enum DataKey {
    Admin,
    Name,
    Symbol,
    Decimals,
    TotalSupply,
    Balance(Address),
    Allowance(Address, Address),
}

#[contracttype]
#[derive(Clone)]
pub struct AllowanceData {
    pub amount: i128,
    pub expiration_ledger: u32,
}

const BALANCE_BUMP: u32 = 518_400;   // ~30 days
const BALANCE_LIFETIME: u32 = 535_680;
const INSTANCE_BUMP: u32 = 518_400;
const INSTANCE_LIFETIME: u32 = 535_680;

fn bump_instance(env: &Env) {
    env.storage()
        .instance()
        .extend_ttl(INSTANCE_BUMP, INSTANCE_LIFETIME);
}

pub fn has_admin(env: &Env) -> bool {
    env.storage().instance().has(&DataKey::Admin)
}

pub fn get_admin(env: &Env) -> Result<Address, TokenError> {
    bump_instance(env);
    env.storage()
        .instance()
        .get(&DataKey::Admin)
        .ok_or(TokenError::NotInitialized)
}

pub fn set_admin(env: &Env, admin: &Address) {
    env.storage().instance().set(&DataKey::Admin, admin);
    bump_instance(env);
}

pub fn get_name(env: &Env) -> String {
    bump_instance(env);
    env.storage()
        .instance()
        .get(&DataKey::Name)
        .unwrap_or(String::from_str(env, "NexusFi USD"))
}

pub fn set_name(env: &Env, name: &String) {
    env.storage().instance().set(&DataKey::Name, name);
}

pub fn get_symbol(env: &Env) -> String {
    bump_instance(env);
    env.storage()
        .instance()
        .get(&DataKey::Symbol)
        .unwrap_or(String::from_str(env, "nUSD"))
}

pub fn set_symbol(env: &Env, symbol: &String) {
    env.storage().instance().set(&DataKey::Symbol, symbol);
}

pub fn get_decimals(env: &Env) -> u32 {
    bump_instance(env);
    env.storage()
        .instance()
        .get(&DataKey::Decimals)
        .unwrap_or(7)
}

pub fn set_decimals(env: &Env, decimals: u32) {
    env.storage().instance().set(&DataKey::Decimals, &decimals);
}

pub fn get_total_supply(env: &Env) -> i128 {
    bump_instance(env);
    env.storage()
        .instance()
        .get(&DataKey::TotalSupply)
        .unwrap_or(0)
}

pub fn set_total_supply(env: &Env, supply: i128) {
    env.storage().instance().set(&DataKey::TotalSupply, &supply);
}

pub fn get_balance(env: &Env, addr: &Address) -> i128 {
    let key = DataKey::Balance(addr.clone());
    if let Some(balance) = env.storage().persistent().get::<_, i128>(&key) {
        env.storage()
            .persistent()
            .extend_ttl(&key, BALANCE_BUMP, BALANCE_LIFETIME);
        balance
    } else {
        0
    }
}

pub fn set_balance(env: &Env, addr: &Address, amount: i128) {
    let key = DataKey::Balance(addr.clone());
    env.storage().persistent().set(&key, &amount);
    env.storage()
        .persistent()
        .extend_ttl(&key, BALANCE_BUMP, BALANCE_LIFETIME);
}

pub fn get_allowance(env: &Env, from: &Address, spender: &Address) -> (i128, u32) {
    let key = DataKey::Allowance(from.clone(), spender.clone());
    if let Some(data) = env.storage().temporary().get::<_, AllowanceData>(&key) {
        if data.expiration_ledger > 0 && data.expiration_ledger < env.ledger().sequence() {
            return (0, 0);
        }
        (data.amount, data.expiration_ledger)
    } else {
        (0, 0)
    }
}

pub fn set_allowance(
    env: &Env,
    from: &Address,
    spender: &Address,
    amount: i128,
    expiration_ledger: u32,
) {
    let key = DataKey::Allowance(from.clone(), spender.clone());
    let data = AllowanceData {
        amount,
        expiration_ledger,
    };
    env.storage().temporary().set(&key, &data);
    if expiration_ledger > 0 {
        let live_until = expiration_ledger.saturating_sub(env.ledger().sequence());
        if live_until > 0 {
            env.storage()
                .temporary()
                .extend_ttl(&key, live_until, live_until);
        }
    }
}
