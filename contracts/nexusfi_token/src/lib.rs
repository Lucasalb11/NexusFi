//! NexusFi - Soroban token contract (placeholder).
//! Substitua pela lógica do seu token ou use o token padrão do Stellar.

#![no_std]

use soroban_sdk::{contract, contractimpl, Env, Symbol};

#[contract]
pub struct NexusfiToken;

#[contractimpl]
impl NexusfiToken {
    /// Inicialização do contrato (placeholder).
    pub fn initialize(_env: Env, _admin: soroban_sdk::Address) -> bool {
        true
    }

    /// Exemplo: retorna nome do token.
    pub fn name(env: Env) -> Symbol {
        Symbol::new(&env, "NEXUS")
    }
}

#[cfg(test)]
mod test;
