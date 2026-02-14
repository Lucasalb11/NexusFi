#![cfg(test)]

use super::*;
use soroban_sdk::{symbol_short, testutils::Address as _, Address, Env};

#[test]
fn test_initialize_and_name() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let contract_id = env.register_contract(None, NexusfiToken);
    let client = NexusfiTokenClient::new(&env, &contract_id);

    assert!(client.initialize(&admin));
    assert_eq!(client.name(), symbol_short!("NEXUS"));
}
