#![no_std]

use soroban_sdk::{contract, contracterror, contractimpl, Address, Env, String};

mod storage;
mod test;

pub use storage::*;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum TokenError {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    Unauthorized = 3,
    InsufficientBalance = 4,
    InsufficientAllowance = 5,
    InvalidAmount = 6,
    OverflowError = 7,
}

#[contract]
pub struct NexusfiToken;

#[contractimpl]
impl NexusfiToken {
    pub fn initialize(
        env: Env,
        admin: Address,
        name: String,
        symbol: String,
        decimals: u32,
    ) -> Result<(), TokenError> {
        if storage::has_admin(&env) {
            return Err(TokenError::AlreadyInitialized);
        }
        storage::set_admin(&env, &admin);
        storage::set_name(&env, &name);
        storage::set_symbol(&env, &symbol);
        storage::set_decimals(&env, decimals);
        storage::set_total_supply(&env, 0);
        Ok(())
    }

    pub fn mint(env: Env, to: Address, amount: i128) -> Result<(), TokenError> {
        let admin = storage::get_admin(&env)?;
        admin.require_auth();

        if amount <= 0 {
            return Err(TokenError::InvalidAmount);
        }

        let balance = storage::get_balance(&env, &to);
        let new_balance = balance
            .checked_add(amount)
            .ok_or(TokenError::OverflowError)?;
        storage::set_balance(&env, &to, new_balance);

        let supply = storage::get_total_supply(&env);
        let new_supply = supply
            .checked_add(amount)
            .ok_or(TokenError::OverflowError)?;
        storage::set_total_supply(&env, new_supply);

        event::mint(&env, &to, amount);
        Ok(())
    }

    pub fn burn(env: Env, from: Address, amount: i128) -> Result<(), TokenError> {
        from.require_auth();

        if amount <= 0 {
            return Err(TokenError::InvalidAmount);
        }

        let balance = storage::get_balance(&env, &from);
        if balance < amount {
            return Err(TokenError::InsufficientBalance);
        }
        storage::set_balance(&env, &from, balance - amount);

        let supply = storage::get_total_supply(&env);
        storage::set_total_supply(&env, supply - amount);

        event::burn(&env, &from, amount);
        Ok(())
    }

    pub fn transfer(env: Env, from: Address, to: Address, amount: i128) -> Result<(), TokenError> {
        from.require_auth();

        if amount <= 0 {
            return Err(TokenError::InvalidAmount);
        }

        let from_balance = storage::get_balance(&env, &from);
        if from_balance < amount {
            return Err(TokenError::InsufficientBalance);
        }

        let to_balance = storage::get_balance(&env, &to);
        let new_to = to_balance
            .checked_add(amount)
            .ok_or(TokenError::OverflowError)?;

        storage::set_balance(&env, &from, from_balance - amount);
        storage::set_balance(&env, &to, new_to);

        event::transfer(&env, &from, &to, amount);
        Ok(())
    }

    pub fn approve(
        env: Env,
        from: Address,
        spender: Address,
        amount: i128,
        expiration_ledger: u32,
    ) -> Result<(), TokenError> {
        from.require_auth();

        if amount < 0 {
            return Err(TokenError::InvalidAmount);
        }

        storage::set_allowance(&env, &from, &spender, amount, expiration_ledger);
        event::approve(&env, &from, &spender, amount, expiration_ledger);
        Ok(())
    }

    pub fn transfer_from(
        env: Env,
        spender: Address,
        from: Address,
        to: Address,
        amount: i128,
    ) -> Result<(), TokenError> {
        spender.require_auth();

        if amount <= 0 {
            return Err(TokenError::InvalidAmount);
        }

        let (allowance, _) = storage::get_allowance(&env, &from, &spender);
        if allowance < amount {
            return Err(TokenError::InsufficientAllowance);
        }

        let from_balance = storage::get_balance(&env, &from);
        if from_balance < amount {
            return Err(TokenError::InsufficientBalance);
        }

        let to_balance = storage::get_balance(&env, &to);
        let new_to = to_balance
            .checked_add(amount)
            .ok_or(TokenError::OverflowError)?;

        storage::set_allowance(&env, &from, &spender, allowance - amount, 0);
        storage::set_balance(&env, &from, from_balance - amount);
        storage::set_balance(&env, &to, new_to);

        event::transfer(&env, &from, &to, amount);
        Ok(())
    }

    // --- Read-only queries (SEP-41 interface) ---

    pub fn balance(env: Env, id: Address) -> i128 {
        storage::get_balance(&env, &id)
    }

    pub fn total_supply(env: Env) -> i128 {
        storage::get_total_supply(&env)
    }

    pub fn name(env: Env) -> String {
        storage::get_name(&env)
    }

    pub fn symbol(env: Env) -> String {
        storage::get_symbol(&env)
    }

    pub fn decimals(env: Env) -> u32 {
        storage::get_decimals(&env)
    }

    pub fn allowance(env: Env, from: Address, spender: Address) -> i128 {
        let (amount, _) = storage::get_allowance(&env, &from, &spender);
        amount
    }

    pub fn admin(env: Env) -> Result<Address, TokenError> {
        storage::get_admin(&env)
    }
}

mod event {
    use soroban_sdk::{Address, Env, Symbol};

    pub fn mint(env: &Env, to: &Address, amount: i128) {
        let topics = (Symbol::new(env, "mint"), to.clone());
        env.events().publish(topics, amount);
    }

    pub fn burn(env: &Env, from: &Address, amount: i128) {
        let topics = (Symbol::new(env, "burn"), from.clone());
        env.events().publish(topics, amount);
    }

    pub fn transfer(env: &Env, from: &Address, to: &Address, amount: i128) {
        let topics = (Symbol::new(env, "transfer"), from.clone(), to.clone());
        env.events().publish(topics, amount);
    }

    pub fn approve(env: &Env, from: &Address, spender: &Address, amount: i128, expiration: u32) {
        let topics = (Symbol::new(env, "approve"), from.clone(), spender.clone());
        env.events().publish(topics, (amount, expiration));
    }
}
