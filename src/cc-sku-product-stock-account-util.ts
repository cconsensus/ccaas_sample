import { Context } from 'fabric-contract-api';
import { CcSkuProductStockAccount, EventPayload } from './cc-sku-product-stock-account';
import { X509 } from 'jsrsasign';
import { Logger } from 'winston';

export const logger = (ctx: Context): Logger => {
  return ctx.logging.getLogger();
};

/**
 *Creates the initial graph to init the ledger.
 * @returns CcSkuProductStockAccount[]
 */
export const initLedgerObjs = (): CcSkuProductStockAccount[] => {
  const initLedgerObjs: CcSkuProductStockAccount[] = [];
  let obj = new CcSkuProductStockAccount();
  obj.description = 'Coke';
  obj.sku = '0012';
  obj.stock = 0;
  obj.tenantId = 'tenantId001';
  initLedgerObjs.push(obj);
  obj = new CcSkuProductStockAccount();
  obj.description = 'Orange Juice';
  obj.sku = '0013';
  obj.stock = 10;
  obj.tenantId = 'tenantId001';
  initLedgerObjs.push(obj);
  obj = new CcSkuProductStockAccount();
  obj.description = 'Canastra Cheese';
  obj.sku = '0014';
  obj.stock = 102;
  obj.tenantId = 'tenantId001';
  initLedgerObjs.push(obj);
  return initLedgerObjs;
};

/**
 * Check if this user has access to this service.
 * @param ctx
 */
export const validateAccess = (ctx: Context): void => {
  const hasRights = ctx.clientIdentity.assertAttributeValue('stockSupplyService', 'true');
  if (!hasRights) {
    throw new Error(`This user: ${ctx.clientIdentity.getID()} has no rights to access this service!`);
  }
};

/**
 * Emits the event.
 * @param ctx
 * @param {string} name
 * @param payload
 * @returns {void}
 */
export const emitEvent = (ctx: Context, name: string, payload: EventPayload): void => {
  logger(ctx).debug('###===> emitEvent configuring event');
  ctx.stub.setEvent(name, Buffer.from(JSON.stringify(payload)));
  logger(ctx).debug('###===> emitEvent Event configured');
};

/**
 * Builds the event payload with user data.
 * @param ctx
 * @param payloadJson
 * @returns string
 */
export const createEventPayload = (ctx: Context, payloadJson: any, eventDescription: string): EventPayload => {
  const certX509 = new X509();
  certX509.readCertPEM(ctx.clientIdentity.getIDBytes().toString());

  logger(ctx).debug(`==> certX509.getInfo(): \n ${certX509.getInfo()}`);
  logger(ctx).debug(`==> certX509.getPublicKey(): \n ${certX509.getPublicKey()}`);
  logger(ctx).debug(`==> certX509.getSubject(): \n ${JSON.stringify(certX509.getSubject())}`);

  const eventPayload = {
    mspId: ctx.clientIdentity.getMSPID(),
    txId: ctx.stub.getTxID(),
    clientId: ctx.clientIdentity.getID(),
    X509Subject: certX509.getSubject(),
    userCertificate: ctx.clientIdentity.getIDBytes(),
    payload: payloadJson,
    eventDescription,
  };
  return eventPayload;
};

/**
 * Wrapper to build the composite key.
 * @param ctx Context
 * @param assetType string
 * @param objectKey string[]
 * @returns string
 */
export const createCompositeKey = (ctx: Context, assetType: string, objectKey: string[]): string => {
  const compositeKey: string = ctx.stub.createCompositeKey(assetType, objectKey);
  return compositeKey;
};

/**
 * Error during product creation
 */
export class CreateSkuAccountError extends Error {
  public readonly message: string;
  public readonly stack: string;

  constructor(message: string, stack?: string) {
    super();
    this.message = message;
    if (stack) {
      this.stack = stack;
    }
  }
}

/**
 * Error during product update
 */
export class UpdateSkuProductAccountError extends Error {
  public readonly message: string;
  public readonly stack: string;

  constructor(message: string, stack?: string) {
    super();
    this.message = message;
    if (stack) {
      this.stack = stack;
    }
  }
}

/**
 * Error during product update
 */
export class NotFoundStockDocumentError extends Error {
  public readonly message: string;
  public readonly stack: string;

  constructor(message: string, stack?: string) {
    super();
    this.message = message;
    if (stack) {
      this.stack = stack;
    }
  }
}

export class InvoceChaincodeError extends Error {
  public readonly message: string;
  public readonly stack: string;
  public readonly status: number;

  constructor(message: string, status?: number, stack?: string) {
    super();
    this.message = message;
    if (stack) {
      this.stack = stack;
    }
    if (status) {
      this.status = status;
    }
  }
}

/**
 * Error during product update
 */
export class WrongTenantIdError extends Error {
  public readonly message: string;
  public readonly stack: string;

  constructor(message: string, stack?: string) {
    super();
    this.message = message;
    if (stack) {
      this.stack = stack;
    }
  }
}
