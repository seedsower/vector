import { AnchorProvider, Program, web3, BN, IdlAccounts } from '@coral-xyz/anchor';
import { Connection, PublicKey, Keypair, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } from '@solana/spl-token';
import { VectorProtocol } from './types/vector_protocol';
import vectorProtocolIdl from './idl/vector_protocol.json';

export const VECTOR_PROGRAM_ID = new PublicKey('VectorProtocolDriftFork11111111111111111111');

export type Exchange = IdlAccounts<VectorProtocol>['exchange'];
export type CommodityMarket = IdlAccounts<VectorProtocol>['commodityMarket'];
export type User = IdlAccounts<VectorProtocol>['user'];

export enum CommodityType {
  // Precious Metals
  Gold = 'Gold',
  Silver = 'Silver',
  Platinum = 'Platinum',
  Palladium = 'Palladium',
  Rhodium = 'Rhodium',
  Iridium = 'Iridium',
  Ruthenium = 'Ruthenium',
  Osmium = 'Osmium',
  Rhenium = 'Rhenium',
  Indium = 'Indium',
  
  // Energy
  CrudeOilWTI = 'CrudeOilWTI',
  BrentCrude = 'BrentCrude',
  NaturalGas = 'NaturalGas',
  Gasoline = 'Gasoline',
  HeatingOil = 'HeatingOil',
  Coal = 'Coal',
  Uranium = 'Uranium',
  Ethanol = 'Ethanol',
  Propane = 'Propane',
  Electricity = 'Electricity',
  
  // Agriculture
  Corn = 'Corn',
  Wheat = 'Wheat',
  Soybeans = 'Soybeans',
  Sugar = 'Sugar',
  Coffee = 'Coffee',
  Cocoa = 'Cocoa',
  Cotton = 'Cotton',
  Rice = 'Rice',
  Cattle = 'Cattle',
  LeanHogs = 'LeanHogs',
  
  // Industrial Metals
  Copper = 'Copper',
  Aluminum = 'Aluminum',
  Zinc = 'Zinc',
  Nickel = 'Nickel',
  Lead = 'Lead',
  Tin = 'Tin',
  IronOre = 'IronOre',
  Steel = 'Steel',
  Lithium = 'Lithium',
  Cobalt = 'Cobalt',
}

export enum OrderType {
  Market = 'Market',
  Limit = 'Limit',
  TriggerMarket = 'TriggerMarket',
  TriggerLimit = 'TriggerLimit',
  Oracle = 'Oracle',
}

export enum PositionDirection {
  Long = 'Long',
  Short = 'Short',
}

export class VectorProtocolClient {
  public program: Program<VectorProtocol>;
  public provider: AnchorProvider;
  public connection: Connection;

  constructor(connection: Connection, wallet: any, programId: PublicKey = VECTOR_PROGRAM_ID) {
    this.connection = connection;
    this.provider = new AnchorProvider(connection, wallet, {});
    this.program = new Program(vectorProtocolIdl as VectorProtocol, programId, this.provider);
  }

  // Exchange Management
  async initializeExchange(
    authority: Keypair,
    feeStructure: any
  ): Promise<{ exchangePubkey: PublicKey; signature: string }> {
    const [exchangePubkey] = PublicKey.findProgramAddressSync(
      [Buffer.from('exchange')],
      this.program.programId
    );

    const tx = await this.program.methods
      .initializeExchange(
        254, // exchange_authority_bump
        254, // insurance_fund_bump
        feeStructure
      )
      .accounts({
        exchange: exchangePubkey,
        authority: authority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([authority])
      .rpc();

    return { exchangePubkey, signature: tx };
  }

  // Market Management
  async initializeCommodityMarket(
    authority: Keypair,
    marketIndex: number,
    commodityType: CommodityType,
    oracleSource: PublicKey,
    baseAssetReserve: BN,
    quoteAssetReserve: BN,
    fundingPeriod: BN,
    maximumLeverage: number
  ): Promise<{ marketPubkey: PublicKey; signature: string }> {
    const [marketPubkey] = PublicKey.findProgramAddressSync(
      [Buffer.from('market'), Buffer.from([marketIndex])],
      this.program.programId
    );

    const [exchangePubkey] = PublicKey.findProgramAddressSync(
      [Buffer.from('exchange')],
      this.program.programId
    );

    const tx = await this.program.methods
      .initializeCommodityMarket(
        marketIndex,
        { [commodityType.toLowerCase()]: {} },
        oracleSource,
        baseAssetReserve,
        quoteAssetReserve,
        fundingPeriod,
        maximumLeverage
      )
      .accounts({
        market: marketPubkey,
        exchange: exchangePubkey,
        authority: authority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([authority])
      .rpc();

    return { marketPubkey, signature: tx };
  }

  // User Account Management
  async initializeUserAccount(
    authority: Keypair,
    userId: number
  ): Promise<{ userPubkey: PublicKey; signature: string }> {
    const [userPubkey] = PublicKey.findProgramAddressSync(
      [Buffer.from('user'), authority.publicKey.toBuffer()],
      this.program.programId
    );

    const tx = await this.program.methods
      .initializeUserAccount(userId)
      .accounts({
        user: userPubkey,
        authority: authority.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([authority])
      .rpc();

    return { userPubkey, signature: tx };
  }

  // Trading Operations
  async placePerpOrder(
    authority: Keypair,
    orderType: OrderType,
    marketIndex: number,
    baseAssetAmount: BN,
    price: BN,
    direction: PositionDirection,
    reduceOnly: boolean = false,
    postOnly: boolean = false
  ): Promise<string> {
    const [userPubkey] = PublicKey.findProgramAddressSync(
      [Buffer.from('user'), authority.publicKey.toBuffer()],
      this.program.programId
    );

    const [marketPubkey] = PublicKey.findProgramAddressSync(
      [Buffer.from('market'), Buffer.from([marketIndex])],
      this.program.programId
    );

    const tx = await this.program.methods
      .placePerpOrder(
        { [orderType.toLowerCase()]: {} },
        marketIndex,
        baseAssetAmount,
        price,
        { [direction.toLowerCase()]: {} },
        reduceOnly,
        postOnly
      )
      .accounts({
        user: userPubkey,
        market: marketPubkey,
        authority: authority.publicKey,
      })
      .signers([authority])
      .rpc();

    return tx;
  }

  // Liquidation
  async liquidatePerp(
    liquidatorAuthority: Keypair,
    userToLiquidate: PublicKey,
    marketIndex: number,
    maxBaseAssetAmount: BN
  ): Promise<string> {
    const [userPubkey] = PublicKey.findProgramAddressSync(
      [Buffer.from('user'), userToLiquidate.toBuffer()],
      this.program.programId
    );

    const [liquidatorPubkey] = PublicKey.findProgramAddressSync(
      [Buffer.from('user'), liquidatorAuthority.publicKey.toBuffer()],
      this.program.programId
    );

    const [marketPubkey] = PublicKey.findProgramAddressSync(
      [Buffer.from('market'), Buffer.from([marketIndex])],
      this.program.programId
    );

    const tx = await this.program.methods
      .liquidatePerp(marketIndex, maxBaseAssetAmount)
      .accounts({
        user: userPubkey,
        liquidator: liquidatorPubkey,
        market: marketPubkey,
        liquidatorAuthority: liquidatorAuthority.publicKey,
      })
      .signers([liquidatorAuthority])
      .rpc();

    return tx;
  }

  // Oracle Updates
  async updateOraclePrices(
    oracleAuthority: Keypair,
    oracleUpdates: Array<{ marketIndex: number; price: BN; confidence: number }>
  ): Promise<string> {
    const marketPubkeys = oracleUpdates.map(update => {
      const [marketPubkey] = PublicKey.findProgramAddressSync(
        [Buffer.from('market'), Buffer.from([update.marketIndex])],
        this.program.programId
      );
      return marketPubkey;
    });

    const tx = await this.program.methods
      .updateOraclePrices(oracleUpdates)
      .accounts({
        markets: marketPubkeys,
        oracleAuthority: oracleAuthority.publicKey,
      })
      .signers([oracleAuthority])
      .rpc();

    return tx;
  }

  // Account Fetchers
  async getExchange(): Promise<Exchange | null> {
    const [exchangePubkey] = PublicKey.findProgramAddressSync(
      [Buffer.from('exchange')],
      this.program.programId
    );

    try {
      return await this.program.account.exchange.fetch(exchangePubkey);
    } catch {
      return null;
    }
  }

  async getCommodityMarket(marketIndex: number): Promise<CommodityMarket | null> {
    const [marketPubkey] = PublicKey.findProgramAddressSync(
      [Buffer.from('market'), Buffer.from([marketIndex])],
      this.program.programId
    );

    try {
      return await this.program.account.commodityMarket.fetch(marketPubkey);
    } catch {
      return null;
    }
  }

  async getUser(authority: PublicKey): Promise<User | null> {
    const [userPubkey] = PublicKey.findProgramAddressSync(
      [Buffer.from('user'), authority.toBuffer()],
      this.program.programId
    );

    try {
      return await this.program.account.user.fetch(userPubkey);
    } catch {
      return null;
    }
  }

  async getAllMarkets(): Promise<Array<{ publicKey: PublicKey; account: CommodityMarket }>> {
    return await this.program.account.commodityMarket.all();
  }

  async getAllUsers(): Promise<Array<{ publicKey: PublicKey; account: User }>> {
    return await this.program.account.user.all();
  }

  // Market Data Helpers
  calculateMarkPrice(market: CommodityMarket): number {
    // Simplified mark price calculation
    return market.markPrice.toNumber() / 1e6; // Assuming 6 decimal precision
  }

  calculateFundingRate(market: CommodityMarket): number {
    return market.lastFundingRate.toNumber() / 1e9; // Assuming 9 decimal precision
  }

  calculatePositionValue(baseAssetAmount: BN, markPrice: number): number {
    return baseAssetAmount.toNumber() * markPrice;
  }

  calculateLiquidationPrice(
    position: { size: BN; direction: PositionDirection; entryPrice: BN },
    collateral: BN,
    maintenanceMarginRatio: number
  ): number {
    const entryPrice = position.entryPrice.toNumber() / 1e6;
    const size = position.size.toNumber();
    const collateralValue = collateral.toNumber() / 1e6;
    
    if (position.direction === PositionDirection.Long) {
      return entryPrice - (collateralValue * maintenanceMarginRatio) / size;
    } else {
      return entryPrice + (collateralValue * maintenanceMarginRatio) / size;
    }
  }

  // Event Listeners
  addEventListener(eventName: string, callback: (event: any) => void): number {
    return this.program.addEventListener(eventName, callback);
  }

  removeEventListener(listenerId: number): Promise<void> {
    return this.program.removeEventListener(listenerId);
  }

  // Utility Methods
  static createDefaultFeeStructure() {
    return {
      feeNumerator: new BN(1),
      feeDenominator: new BN(1000),
      discountTier1Minimum: new BN(100000),
      discountTier1Discount: new BN(10),
      discountTier2Minimum: new BN(1000000),
      discountTier2Discount: new BN(20),
      discountTier3Minimum: new BN(5000000),
      discountTier3Discount: new BN(30),
      discountTier4Minimum: new BN(10000000),
      discountTier4Discount: new BN(40),
      referralDiscount: new BN(5),
    };
  }

  static getAllCommodityTypes(): CommodityType[] {
    return Object.values(CommodityType);
  }

  static getCommodityCategory(commodityType: CommodityType): string {
    const preciousMetals = [
      CommodityType.Gold, CommodityType.Silver, CommodityType.Platinum,
      CommodityType.Palladium, CommodityType.Rhodium, CommodityType.Iridium,
      CommodityType.Ruthenium, CommodityType.Osmium, CommodityType.Rhenium, CommodityType.Indium
    ];
    
    const energy = [
      CommodityType.CrudeOilWTI, CommodityType.BrentCrude, CommodityType.NaturalGas,
      CommodityType.Gasoline, CommodityType.HeatingOil, CommodityType.Coal,
      CommodityType.Uranium, CommodityType.Ethanol, CommodityType.Propane, CommodityType.Electricity
    ];
    
    const agriculture = [
      CommodityType.Corn, CommodityType.Wheat, CommodityType.Soybeans,
      CommodityType.Sugar, CommodityType.Coffee, CommodityType.Cocoa,
      CommodityType.Cotton, CommodityType.Rice, CommodityType.Cattle, CommodityType.LeanHogs
    ];
    
    const industrialMetals = [
      CommodityType.Copper, CommodityType.Aluminum, CommodityType.Zinc,
      CommodityType.Nickel, CommodityType.Lead, CommodityType.Tin,
      CommodityType.IronOre, CommodityType.Steel, CommodityType.Lithium, CommodityType.Cobalt
    ];

    if (preciousMetals.includes(commodityType)) return 'Precious Metals';
    if (energy.includes(commodityType)) return 'Energy';
    if (agriculture.includes(commodityType)) return 'Agriculture';
    if (industrialMetals.includes(commodityType)) return 'Industrial Metals';
    
    return 'Unknown';
  }
}