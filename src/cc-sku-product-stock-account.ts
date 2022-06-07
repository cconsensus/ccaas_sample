import { Object, Property } from 'fabric-contract-api';

export type EventPayload = {
  mspId: any;
  txId: any;
  clientId: any;
  X509Subject: jsrsasign.IdentityResponse;
  userCertificate: any;
  payload: any;
  eventDescription: string;
};

/**
 * Object to represent the item that will have de stock updated.
 */
@Object()
export class CcItemDocument {
  @Property()
  public uuid: string;
  @Property()
  public tenantId: string;
  @Property()
  public sku: string;
  @Property()
  public description: string;
  @Property()
  public quantity: number;
  @Property()
  public createdAt: string;
}

/**
 * Object representing the Item Document Key
 */
@Object()
export class CcItemDocumentKey {
  @Property()
  public readonly assetType: string = CcItemDocument.name as string;
  @Property()
  public tenantId: string;
  @Property()
  public sku: string;
}

/**
 * The product account
 */
@Object()
export class CcSkuProductStockAccount {
  @Property()
  public readonly assetType: string = CcSkuProductStockAccount.name as string;
  @Property()
  public tenantId: string;
  @Property()
  public sku: string;
  @Property('stock', 'number')
  public stock: number;
  @Property()
  public description: string;
  @Property()
  public createdAt: string;
  @Property()
  public updatedAt: string;
}

/**
 * The product account key object
 */
@Object()
export class CcSkuProductStockAccountKey {
  @Property()
  public readonly assetType: string = CcSkuProductStockAccount.name as string;
  @Property()
  public tenantId: string;
  @Property()
  public sku: string;
}

/**
 * The product account
 */
@Object()
export class QueryCcSkuProductStockAccount {
  @Property()
  public readonly assetType: string = CcSkuProductStockAccount.name as string;
  @Property()
  public tenantId: string;
  @Property()
  public sku: string;
  @Property()
  public createdAt: string;
  @Property()
  public updatedAt: string;
  @Property()
  public pageSize: number;
  @Property()
  public bookmark: string;
}
