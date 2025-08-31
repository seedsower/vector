use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
use std::collections::BTreeMap;

declare_id!("VectorProtocolDriftFork11111111111111111111");

#[program]
pub mod vector_protocol {
    use super::*;

    pub fn initialize_exchange(
        ctx: Context<InitializeExchange>,
        exchange_authority_bump: u8,
        insurance_fund_bump: u8,
        fee_structure: FeeStructure,
    ) -> Result<()> {
        let exchange = &mut ctx.accounts.exchange;
        exchange.authority = ctx.accounts.authority.key();
        exchange.exchange_authority_bump = exchange_authority_bump;
        exchange.insurance_fund_bump = insurance_fund_bump;
        exchange.fee_structure = fee_structure;
        exchange.oracle_config = OracleConfig::default();
        exchange.liquidation_config = LiquidationConfig::default();
        exchange.total_collateral = 0;
        exchange.total_markets = 0;
        exchange.is_initialized = true;
        Ok(())
    }

    pub fn initialize_commodity_market(
        ctx: Context<InitializeCommodityMarket>,
        market_index: u16,
        commodity_type: CommodityType,
        oracle_source: Pubkey,
        base_asset_reserve: u64,
        quote_asset_reserve: u64,
        funding_period: i64,
        maximum_leverage: u32,
    ) -> Result<()> {
        let market = &mut ctx.accounts.market;
        market.market_index = market_index;
        market.commodity_type = commodity_type;
        market.oracle_source = oracle_source;
        market.base_asset_reserve = base_asset_reserve;
        market.quote_asset_reserve = quote_asset_reserve;
        market.funding_period = funding_period;
        market.maximum_leverage = maximum_leverage;
        market.mark_price = 0;
        market.last_funding_rate = 0;
        market.last_funding_rate_ts = Clock::get()?.unix_timestamp;
        market.is_active = true;

        let exchange = &mut ctx.accounts.exchange;
        exchange.total_markets += 1;

        Ok(())
    }

    pub fn initialize_user_account(
        ctx: Context<InitializeUserAccount>,
        user_id: u32,
    ) -> Result<()> {
        let user = &mut ctx.accounts.user;
        user.authority = ctx.accounts.authority.key();
        user.user_id = user_id;
        user.collateral = 0;
        user.total_fee_paid = 0;
        user.total_token_discount = 0;
        user.total_referral_reward = 0;
        user.next_order_id = 1;
        user.margin_ratio = 100; // 1% in basis points (10000)
        user.liquidation_margin_ratio = 50; // 0.5% in basis points
        user.is_margin_trading_enabled = true;
        user.is_liquidation_candidate = false;
        user.last_active_slot = Clock::get()?.slot;
        Ok(())
    }

    pub fn deposit_collateral(
        ctx: Context<DepositCollateral>,
        amount: u64,
    ) -> Result<()> {
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.user_token_account.to_account_info(),
                    to: ctx.accounts.user_collateral_account.to_account_info(),
                    authority: ctx.accounts.authority.to_account_info(),
                },
            ),
            amount,
        )?;

        let user = &mut ctx.accounts.user;
        user.collateral = user.collateral.checked_add(amount).unwrap();
        user.last_active_slot = Clock::get()?.slot;

        let exchange = &mut ctx.accounts.exchange;
        exchange.total_collateral = exchange.total_collateral.checked_add(amount).unwrap();

        Ok(())
    }

    pub fn place_perp_order(
        ctx: Context<PlacePerpOrder>,
        order_type: OrderType,
        market_index: u16,
        base_asset_amount: u64,
        price: u64,
        direction: PositionDirection,
        reduce_only: bool,
        post_only: bool,
    ) -> Result<()> {
        let user = &mut ctx.accounts.user;
        let market = &ctx.accounts.market;
        
        // Validate market is active
        require!(market.is_active, VectorError::MarketNotActive);
        
        // Validate user has sufficient collateral
        require!(user.collateral > 0, VectorError::InsufficientCollateral);
        
        let order_id = user.next_order_id;
        user.next_order_id += 1;

        // Create new order
        let order = Order {
            order_id,
            user_order_id: order_id,
            market_index,
            order_type,
            direction,
            base_asset_amount,
            price,
            reduce_only,
            post_only,
            trigger_price: 0,
            discount_tier: DiscountTier::None,
            immediate_or_cancel: false,
            existing_position_direction: PositionDirection::Long,
            oracle_price_offset: 0,
            slot: Clock::get()?.slot,
            ts: Clock::get()?.unix_timestamp,
        };

        // Add order to user's orders (simplified)
        user.last_active_slot = Clock::get()?.slot;

        emit!(OrderRecord {
            user: user.authority,
            order,
            market_index,
            ts: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    pub fn liquidate_perp(
        ctx: Context<LiquidatePerp>,
        market_index: u16,
        liquidator_max_base_asset_amount: u64,
    ) -> Result<()> {
        let user = &mut ctx.accounts.user;
        let liquidator = &mut ctx.accounts.liquidator;
        let market = &ctx.accounts.market;

        // Check if user is liquidatable
        require!(
            is_user_liquidatable(user, market)?,
            VectorError::UserNotLiquidatable
        );

        // Perform liquidation logic
        let liquidation_fee = calculate_liquidation_fee(
            liquidator_max_base_asset_amount,
            market.mark_price,
        )?;

        // Transfer liquidation fee to liquidator
        liquidator.collateral = liquidator.collateral.checked_add(liquidation_fee).unwrap();
        user.collateral = user.collateral.checked_sub(liquidation_fee).unwrap();

        user.is_liquidation_candidate = false;
        user.last_active_slot = Clock::get()?.slot;

        emit!(LiquidationRecord {
            user: user.authority,
            liquidator: liquidator.authority,
            market_index,
            liquidation_fee,
            ts: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    pub fn update_oracle_prices(
        ctx: Context<UpdateOraclePrices>,
        oracle_updates: Vec<OracleUpdate>,
    ) -> Result<()> {
        for update in oracle_updates {
            let market = &mut ctx.accounts.markets[update.market_index as usize];
            market.mark_price = update.price;
            market.oracle_confidence = update.confidence;
            market.last_oracle_update_slot = Clock::get()?.slot;
        }
        Ok(())
    }
}

// Account Structures
#[account]
pub struct Exchange {
    pub authority: Pubkey,
    pub exchange_authority_bump: u8,
    pub insurance_fund_bump: u8,
    pub fee_structure: FeeStructure,
    pub oracle_config: OracleConfig,
    pub liquidation_config: LiquidationConfig,
    pub total_collateral: u64,
    pub total_markets: u16,
    pub is_initialized: bool,
}

#[account]
pub struct CommodityMarket {
    pub market_index: u16,
    pub commodity_type: CommodityType,
    pub oracle_source: Pubkey,
    pub base_asset_reserve: u64,
    pub quote_asset_reserve: u64,
    pub funding_period: i64,
    pub maximum_leverage: u32,
    pub mark_price: u64,
    pub last_funding_rate: i64,
    pub last_funding_rate_ts: i64,
    pub oracle_confidence: u8,
    pub last_oracle_update_slot: u64,
    pub is_active: bool,
}

#[account]
pub struct User {
    pub authority: Pubkey,
    pub user_id: u32,
    pub collateral: u64,
    pub total_fee_paid: u64,
    pub total_token_discount: u64,
    pub total_referral_reward: u64,
    pub next_order_id: u32,
    pub margin_ratio: u32,
    pub liquidation_margin_ratio: u32,
    pub is_margin_trading_enabled: bool,
    pub is_liquidation_candidate: bool,
    pub last_active_slot: u64,
}

// Enums and Structs
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum CommodityType {
    // Precious Metals
    Gold,
    Silver,
    Platinum,
    Palladium,
    Rhodium,
    Iridium,
    Ruthenium,
    Osmium,
    Rhenium,
    Indium,
    
    // Energy
    CrudeOilWTI,
    BrentCrude,
    NaturalGas,
    Gasoline,
    HeatingOil,
    Coal,
    Uranium,
    Ethanol,
    Propane,
    Electricity,
    
    // Agriculture
    Corn,
    Wheat,
    Soybeans,
    Sugar,
    Coffee,
    Cocoa,
    Cotton,
    Rice,
    Cattle,
    LeanHogs,
    
    // Industrial Metals
    Copper,
    Aluminum,
    Zinc,
    Nickel,
    Lead,
    Tin,
    IronOre,
    Steel,
    Lithium,
    Cobalt,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum OrderType {
    Market,
    Limit,
    TriggerMarket,
    TriggerLimit,
    Oracle,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum PositionDirection {
    Long,
    Short,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum DiscountTier {
    None,
    First,
    Second,
    Third,
    Fourth,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct Order {
    pub order_id: u32,
    pub user_order_id: u32,
    pub market_index: u16,
    pub order_type: OrderType,
    pub direction: PositionDirection,
    pub base_asset_amount: u64,
    pub price: u64,
    pub reduce_only: bool,
    pub post_only: bool,
    pub trigger_price: u64,
    pub discount_tier: DiscountTier,
    pub immediate_or_cancel: bool,
    pub existing_position_direction: PositionDirection,
    pub oracle_price_offset: i32,
    pub slot: u64,
    pub ts: i64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct FeeStructure {
    pub fee_numerator: u64,
    pub fee_denominator: u64,
    pub discount_tier_1_minimum: u64,
    pub discount_tier_1_discount: u64,
    pub discount_tier_2_minimum: u64,
    pub discount_tier_2_discount: u64,
    pub discount_tier_3_minimum: u64,
    pub discount_tier_3_discount: u64,
    pub discount_tier_4_minimum: u64,
    pub discount_tier_4_discount: u64,
    pub referral_discount: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct OracleConfig {
    pub oracle_authority: Pubkey,
    pub oracle_delay: u64,
    pub oracle_staleness_threshold: u64,
    pub oracle_confidence_threshold: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct LiquidationConfig {
    pub liquidation_fee: u64,
    pub liquidation_margin_buffer: u32,
    pub insurance_fund_fee: u64,
    pub liquidator_fee: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct OracleUpdate {
    pub market_index: u16,
    pub price: u64,
    pub confidence: u8,
}

// Context Structures
#[derive(Accounts)]
pub struct InitializeExchange<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + std::mem::size_of::<Exchange>(),
    )]
    pub exchange: Account<'info, Exchange>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitializeCommodityMarket<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + std::mem::size_of::<CommodityMarket>(),
    )]
    pub market: Account<'info, CommodityMarket>,
    #[account(mut)]
    pub exchange: Account<'info, Exchange>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitializeUserAccount<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + std::mem::size_of::<User>(),
    )]
    pub user: Account<'info, User>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DepositCollateral<'info> {
    #[account(mut)]
    pub user: Account<'info, User>,
    #[account(mut)]
    pub exchange: Account<'info, Exchange>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user_collateral_account: Account<'info, TokenAccount>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct PlacePerpOrder<'info> {
    #[account(mut)]
    pub user: Account<'info, User>,
    pub market: Account<'info, CommodityMarket>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct LiquidatePerp<'info> {
    #[account(mut)]
    pub user: Account<'info, User>,
    #[account(mut)]
    pub liquidator: Account<'info, User>,
    pub market: Account<'info, CommodityMarket>,
    pub liquidator_authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct UpdateOraclePrices<'info> {
    pub markets: Vec<Account<'info, CommodityMarket>>,
    pub oracle_authority: Signer<'info>,
}

// Events
#[event]
pub struct OrderRecord {
    pub user: Pubkey,
    pub order: Order,
    pub market_index: u16,
    pub ts: i64,
}

#[event]
pub struct LiquidationRecord {
    pub user: Pubkey,
    pub liquidator: Pubkey,
    pub market_index: u16,
    pub liquidation_fee: u64,
    pub ts: i64,
}

// Helper Functions
fn is_user_liquidatable(user: &User, market: &CommodityMarket) -> Result<bool> {
    // Simplified liquidation check
    let margin_requirement = (user.collateral * user.liquidation_margin_ratio) / 10000;
    Ok(user.collateral < margin_requirement)
}

fn calculate_liquidation_fee(base_asset_amount: u64, mark_price: u64) -> Result<u64> {
    let notional_value = base_asset_amount.checked_mul(mark_price).unwrap();
    Ok(notional_value / 1000) // 0.1% liquidation fee
}

// Error Types
#[error_code]
pub enum VectorError {
    #[msg("Market is not active")]
    MarketNotActive,
    #[msg("Insufficient collateral")]
    InsufficientCollateral,
    #[msg("User is not liquidatable")]
    UserNotLiquidatable,
    #[msg("Invalid oracle price")]
    InvalidOraclePrice,
    #[msg("Unauthorized")]
    Unauthorized,
}