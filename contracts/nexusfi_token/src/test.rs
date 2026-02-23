#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String};

fn setup() -> (Env, Address, NexusfiTokenClient<'static>) {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let contract_id = env.register_contract(None, NexusfiToken);
    let client = NexusfiTokenClient::new(&env, &contract_id);

    client.initialize(
        &admin,
        &String::from_str(&env, "NexusFi USD"),
        &String::from_str(&env, "nUSD"),
        &7,
    );

    (env, admin, client)
}

#[test]
fn test_initialize() {
    let (env, _admin, client) = setup();
    assert_eq!(client.name(), String::from_str(&env, "NexusFi USD"));
    assert_eq!(client.symbol(), String::from_str(&env, "nUSD"));
    assert_eq!(client.decimals(), 7);
    assert_eq!(client.total_supply(), 0);
}

#[test]
fn test_mint_and_balance() {
    let (env, _admin, client) = setup();
    let user = Address::generate(&env);

    client.mint(&user, &10_000_0000000);
    assert_eq!(client.balance(&user), 10_000_0000000);
    assert_eq!(client.total_supply(), 10_000_0000000);
}

#[test]
fn test_transfer() {
    let (env, _admin, client) = setup();
    let alice = Address::generate(&env);
    let bob = Address::generate(&env);

    client.mint(&alice, &1_000_0000000);
    client.transfer(&alice, &bob, &300_0000000);

    assert_eq!(client.balance(&alice), 700_0000000);
    assert_eq!(client.balance(&bob), 300_0000000);
}

#[test]
fn test_burn() {
    let (env, _admin, client) = setup();
    let user = Address::generate(&env);

    client.mint(&user, &500_0000000);
    client.burn(&user, &200_0000000);

    assert_eq!(client.balance(&user), 300_0000000);
    assert_eq!(client.total_supply(), 300_0000000);
}

#[test]
fn test_approve_and_transfer_from() {
    let (env, _admin, client) = setup();
    let owner = Address::generate(&env);
    let spender = Address::generate(&env);
    let recipient = Address::generate(&env);

    client.mint(&owner, &1_000_0000000);
    client.approve(&owner, &spender, &500_0000000, &1000);

    assert_eq!(client.allowance(&owner, &spender), 500_0000000);

    client.transfer_from(&spender, &owner, &recipient, &200_0000000);

    assert_eq!(client.balance(&owner), 800_0000000);
    assert_eq!(client.balance(&recipient), 200_0000000);
    assert_eq!(client.allowance(&owner, &spender), 300_0000000);
}

#[test]
#[should_panic]
fn test_transfer_insufficient_balance() {
    let (env, _admin, client) = setup();
    let alice = Address::generate(&env);
    let bob = Address::generate(&env);

    client.mint(&alice, &100_0000000);
    client.transfer(&alice, &bob, &200_0000000);
}

#[test]
#[should_panic]
fn test_double_initialize() {
    let (env, _admin, client) = setup();
    let admin2 = Address::generate(&env);
    client.initialize(
        &admin2,
        &String::from_str(&env, "Dup"),
        &String::from_str(&env, "DUP"),
        &7,
    );
}
