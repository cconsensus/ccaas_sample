import { Context, Contract, Info, Param, Returns, Transaction } from 'fabric-contract-api';
import { Iterators } from 'fabric-shim-api';
import { CcItemDocument, CcSkuProductStockAccount, CcSkuProductStockAccountKey, QueryCcSkuProductStockAccount } from './cc-sku-product-stock-account';
import { createCompositeKey, logger, NotFoundStockDocumentError, UpdateSkuProductAccountError } from './cc-sku-product-stock-account-util';

@Info({
  title: 'cc-sku-product-stock-account-contract',
  description: 'Chaincode to deal with Sku Product Stock Accounts',
})
export class CcSkuProductStockAccountContract extends Contract {
  constructor() {
    super('br.com.cconsensus.ccskuproducstockaccountcontract');
  }

  /**
   *  Override unknownTransaction
   * @param ctx
   * @returns {Promise<void>}
   */
  public async unknownTransaction(ctx: Context): Promise<void> {
    logger(ctx).debug(`==> unknownTransaction called by: ${ctx.clientIdentity.getMSPID()}`);
    logger(ctx).debug(`==> unknownTransaction Transaction ID: ${ctx.stub.getTxID()}`);
    logger(ctx).debug(`==> unknownTransaction Transaction ID: ${ctx.clientIdentity.getIDBytes().toString()}`);
    throw new Error(`An unknownTransaction was called here: ${ctx.clientIdentity.getMSPID()}`);
  }

  /**
   * Override beforeTransaction
   * @param ctx
   * @returns {Promise<void>}
   */
  public async beforeTransaction(ctx: Context): Promise<void> {
    logger(ctx).debug(`==> beforeTransaction called by: ${ctx.clientIdentity.getMSPID()}`);
    logger(ctx).debug(`==> beforeTransaction Transaction ID: ${ctx.stub.getTxID()}`);
    logger(ctx).debug(`==> beforeTransaction Transaction ID: ${ctx.clientIdentity.getIDBytes().toString()}`);
  }

  /**
   * Override afterTransaction
   * @param ctx
   * @returns {Promise<void>}
   */
  public async afterTransaction(ctx: Context): Promise<void> {
    logger(ctx).debug(`==> afterTransaction called by: ${ctx.clientIdentity.getMSPID()}`);
    logger(ctx).debug(`==> afterTransaction Transaction ID: ${ctx.stub.getTxID()}`);
    logger(ctx).debug(`==> afterTransaction Transaction ID: ${ctx.clientIdentity.getIDBytes().toString()}`);
  }

  /**
   * Checks if this Fiscal Document exists
   * @param ctx Context
   * @param ccFiscalDocumentKey CcFiscalDocumentKey
   * @returns boolean
   */
  @Transaction(false)
  @Returns('boolean')
  @Param('ccSkuProductStockAccountKey', 'CcSkuProductStockAccountKey', 'Checks if the sku product account exists.')
  public async skuProductStockAccountExists(ctx: Context, ccSkuProductStockAccountKey: CcSkuProductStockAccountKey): Promise<boolean> {
    logger(ctx).debug('===== skuProductStockAccountExists INIT =====');
    const compositeKey = createCompositeKey(ctx, ccSkuProductStockAccountKey.assetType, [ccSkuProductStockAccountKey.tenantId, ccSkuProductStockAccountKey.sku]);
    const data: Uint8Array = await ctx.stub.getState(compositeKey);
    logger(ctx).debug('===== skuProductStockAccountExists END =====');
    return !!data && data.length > 0;
  }

  /**
   * @todo
   * Update or creates the stock document object.
   * @param ctx Context
   * @param ccSkuProductStockAccount CcSkuProductStockAccount
   */
  private async updateOrCreateSkuProductStockAccount(ctx: Context, ccSkuProductStockAccount: CcSkuProductStockAccount): Promise<void> {
    logger(ctx).debug('===== INIT updateOrCreateSkuProductStockAccount =====');
    const buffer: Buffer = Buffer.from(JSON.stringify(ccSkuProductStockAccount));
    const compositeKey = createCompositeKey(ctx, ccSkuProductStockAccount.assetType, [ccSkuProductStockAccount.tenantId, ccSkuProductStockAccount.sku]);
    await ctx.stub.putState(compositeKey, buffer);
    logger(ctx).debug(`===== updateOrCreateSkuProductStockAccount sku asset: ${compositeKey} =====`);
    logger(ctx).debug('===== END updateOrCreateSkuProductStockAccount =====');
  }

  /**
   * Creates the fiscal document associated to the Stock Document
   * @param ctx Context
   * @param ccItemDocument CcItemDocument
   */
  @Transaction(true)
  @Param('ccItemDocument', 'CcItemDocument', 'Add or remove stock by item of stock document')
  @Param('isAddOperation', 'boolean', 'Add or remove stock by item of stock document')
  private async updateStock(ctx: Context, ccItemDocument: CcItemDocument, isAddOperation: boolean): Promise<CcSkuProductStockAccount> {
    logger(ctx).debug(`===== INIT updateStock isAddOperation: ${isAddOperation} =====`);
    const ccSkuProductStockAccountKey = new CcSkuProductStockAccount();
    ccSkuProductStockAccountKey.tenantId = ccItemDocument.tenantId;
    ccSkuProductStockAccountKey.sku = ccItemDocument.sku;
    let account: CcSkuProductStockAccount = await this.getSkuProductStockAccountByKeyWithoutExistsCheck(ctx, ccSkuProductStockAccountKey);
    if (account) {
      // account exists
      logger(ctx).debug('===== updateStock account exists =====');
      // If account exists, update it.
      logger(ctx).debug('===== account is active account exists =====');
      isAddOperation ? (account.stock += ccItemDocument.quantity) : (account.stock -= ccItemDocument.quantity);
      account.updatedAt = ccItemDocument.createdAt;
    } else {
      // there is no account. Need check if we can create it.
      logger(ctx).debug('===== updateStock account not exists =====');
      account = new CcSkuProductStockAccount();
      account.tenantId = ccItemDocument.tenantId;
      account.sku = ccItemDocument.sku;
      account.createdAt = ccItemDocument.createdAt;
      account.updatedAt = ccItemDocument.createdAt;
      account.stock = ccItemDocument.quantity;
    }
    if (!account) {
      throw new UpdateSkuProductAccountError('WEIRD ERROR. UPDATE STOCK ALGORITM IS PRESENTING UNDESIRED RESULTS. CALL THE BUILDERS.');
    }
    logger(ctx).debug(`===== updateStock Updating / Creating account - STOCK SET TO: ${account.stock} =====`);
    await this.updateOrCreateSkuProductStockAccount(ctx, account);
    logger(ctx).debug('===== END updateStock =====');
    return account;
  }

  /**
   * Add the stock supplu to product account.
   * @param ctx Context
   * @param ccItemDocument CcItemDocument
   */
  @Transaction(true)
  @Returns('CcSkuProductStockAccount')
  @Param('ccItemDocument', 'CcItemDocument', 'Add stock by item of stock document')
  public async addStock(ctx: Context, ccItemDocument: CcItemDocument): Promise<CcSkuProductStockAccount> {
    const ret = await this.updateStock(ctx, ccItemDocument, true);
    return ret;
  }

  /**
   * Add the stock supplu to product account.
   * @param ctx Context
   * @param ccItemDocument CcItemDocument
   */
  @Transaction(true)
  @Returns('CcSkuProductStockAccount')
  @Param('ccItemDocument', 'CcItemDocument', 'Remove stock by item of stock document')
  public async removeStock(ctx: Context, ccItemDocument: CcItemDocument): Promise<CcSkuProductStockAccount> {
    const ret = await this.updateStock(ctx, ccItemDocument, false);
    return ret;
  }

  /**
   * Returns the fiscal document by key
   * @param ctx Context
   * @param ccFiscalDocumentKey CcFiscalDocumentKey
   * @returns CcFiscalDocument
   */
  @Transaction(false)
  @Returns('CcSkuProductStockAccount')
  @Param('ccSkuProductStockAccountKey', 'CcSkuProductStockAccountKey', 'Get fiscal document by key.')
  public async getSkuProductStockAccountByKeyWithoutExistsCheck(ctx: Context, ccSkuProductStockAccountKey: CcSkuProductStockAccountKey): Promise<CcSkuProductStockAccount> {
    logger(ctx).debug('===== getSkuProductStockAccountByKeyWithoutExistsCheck INIT =====');
    const key: string[] = [ccSkuProductStockAccountKey.tenantId, ccSkuProductStockAccountKey.sku];
    const compositeKey = createCompositeKey(ctx, ccSkuProductStockAccountKey.assetType, key);
    const data: Uint8Array = await ctx.stub.getState(compositeKey);
    if (!!data && data.length) {
      logger(ctx).debug('===== getSkuProductStockAccountByKeyWithoutExistsCheck Account is found!! =====');
      return JSON.parse(data.toString()) as CcSkuProductStockAccount;
    } else {
      logger(ctx).debug('===== getSkuProductStockAccountByKeyWithoutExistsCheck Account is not found!! =====');
      return undefined;
    }
  }
  /**
   * Returns the fiscal document by key
   * @param ctx Context
   * @param ccFiscalDocumentKey CcFiscalDocumentKey
   * @returns CcFiscalDocument
   */
  @Transaction(false)
  @Returns('CcSkuProductStockAccount')
  @Param('ccSkuProductStockAccountKey', 'CcSkuProductStockAccountKey', 'Get fiscal document by key.')
  public async getSkuProductStockAccountByKey(ctx: Context, ccSkuProductStockAccountKey: CcSkuProductStockAccountKey): Promise<CcSkuProductStockAccount> {
    logger(ctx).debug('===== getSkuProductStockAccountByKey INIT =====');
    const key: string[] = [ccSkuProductStockAccountKey.tenantId, ccSkuProductStockAccountKey.sku];
    const accountExists = await this.skuProductStockAccountExists(ctx, ccSkuProductStockAccountKey);
    if (!accountExists) {
      throw new NotFoundStockDocumentError('THIS SKU PRODUCT ACCOUNT DOES NOT EXISTS.');
    }
    const compositeKey = createCompositeKey(ctx, ccSkuProductStockAccountKey.assetType, key);
    const data: Uint8Array = await ctx.stub.getState(compositeKey);
    const ccSkuProductStockAccount: CcSkuProductStockAccount = JSON.parse(data.toString()) as CcSkuProductStockAccount;
    logger(ctx).debug('===== getSkuProductStockAccountByKey END =====');
    return ccSkuProductStockAccount;
  }

  /**
   * Builds the dinamic query
   * @param queryCcFiscalDocument QueryCcFiscalDocument
   * @returns string
   */
  private _buildTheSkuDinamicQuery(queryCcSkuProductStockAccount: QueryCcSkuProductStockAccount): string {
    const selector = {
      assetType: queryCcSkuProductStockAccount.assetType,
      uuid: {},
      tenantId: {},
      sku: {},
      sequence: {},
      createdAt: {},
      updatedAt: {},
      isActive: {},
    };
    queryCcSkuProductStockAccount.tenantId ? (selector.tenantId = queryCcSkuProductStockAccount.tenantId) : (selector.tenantId = undefined);
    queryCcSkuProductStockAccount.sku ? (selector.sku = queryCcSkuProductStockAccount.sku) : (selector.sku = undefined);
    queryCcSkuProductStockAccount.createdAt ? (selector.createdAt = queryCcSkuProductStockAccount.createdAt) : (selector.createdAt = undefined);
    queryCcSkuProductStockAccount.updatedAt ? (selector.updatedAt = queryCcSkuProductStockAccount.updatedAt) : (selector.updatedAt = undefined);

    if (!selector) {
      throw new NotFoundStockDocumentError('SKU ACCOUNT DOES NOT EXISTS, unable to query assets. We do not received any parameters!');
    }

    const fields = ['assetType', 'tenantId', 'sku', 'stock', 'createdAt', 'updatedAt'];

    const couchDbQuery = { selector, fields };
    return JSON.stringify(couchDbQuery);
  }

  /**
   * Paginated item document query
   * @param ctx Context
   * @param queryCcFiscalDocument QueryCcFiscalDocument
   * @returns any
   */
  @Transaction(false)
  @Returns('any')
  @Param('queryCcSkuProductStockAccount', 'QueryCcSkuProductStockAccount', 'Object containing the query parameters and selectors.')
  public async findSkuProductStockAccountPaginated(ctx: Context, queryCcSkuProductStockAccount: QueryCcSkuProductStockAccount): Promise<any> {
    logger(ctx).debug('===== findSkuProductStockAccountPaginated INIT =====');
    const queryResults = await this._findByQueryPaginated(
      ctx,
      this._buildTheSkuDinamicQuery(queryCcSkuProductStockAccount),
      queryCcSkuProductStockAccount.pageSize,
      queryCcSkuProductStockAccount.bookmark,
    );
    logger(ctx).debug('===== findSkuProductStockAccountPaginated END =====');
    return queryResults;
  }

  /**
   * Query the item document asset
   * @param ctx Context
   * @param queryCcItemDocument QueryCcItemDocument
   * @returns any
   */
  @Transaction(false)
  @Returns('any')
  @Param('queryCcSkuProductStockAccount', 'QueryCcSkuProductStockAccount', 'Object containing the query parameters and selectors.')
  public async findSkuProductStockAccount(ctx: Context, queryCcSkuProductStockAccount: QueryCcSkuProductStockAccount): Promise<any> {
    logger(ctx).debug('===== findSkuProductStockAccount INIT =====');
    const queryResults = await this.getAllResults(ctx.stub.getQueryResult(this._buildTheSkuDinamicQuery(queryCcSkuProductStockAccount)));
    logger(ctx).debug('===== findSkuProductStockAccount END =====');
    return queryResults;
  }

  /**
   * Consulta com query personalizada.
   * @param ctx
   * @param queryString
   * @param pageSize
   * @param bookmark
   */
  private async _findByQueryPaginated(ctx: Context, queryString: string, pageSize: number, bookmark: string): Promise<string> {
    logger(ctx).debug('===== findByQueryPaginated INIT =====');
    const { iterator, metadata } = await ctx.stub.getQueryResultWithPagination(queryString, pageSize, bookmark);
    const results = {
      results: await this.getAllResultsPaginated(iterator),
      fetchedRecordsCount: metadata.fetchedRecordsCount,
      pageSize,
      bookmark: metadata.bookmark,
    };
    logger(ctx).debug(`findByQueryPaginated: \n  ${JSON.stringify(results, null, 2)}`);
    logger(ctx).debug('===== findByQueryPaginated END =====');
    return JSON.stringify(results);
  }

  /**
   * Get History
   * @param ctx
   * @param tenantId
   * @param sku
   * @param sequence
   */
  @Transaction(false)
  @Returns('any')
  @Param('ccSkuProductStockAccountKey', 'CcSkuProductStockAccountKey', 'Get sku product stock account history by key.')
  public async getSkuProductStockAccountHistoryByKey(ctx: Context, ccSkuProductStockAccountKey: CcSkuProductStockAccountKey): Promise<any> {
    logger(ctx).debug('===== getSkuProductStockAccountHistoryByKey INIT =====');
    const compositeKey = createCompositeKey(ctx, ccSkuProductStockAccountKey.assetType, [ccSkuProductStockAccountKey.tenantId, ccSkuProductStockAccountKey.sku]);
    const results = await this.getAllHitoryResults(ctx.stub.getHistoryForKey(compositeKey));
    if (!results || results.length === 0) {
      throw new NotFoundStockDocumentError('SKU PRODUCT STOCK DOCUMENT DOES NOT EXISTS, unable to load ASSET HSTORY.');
    }
    logger(ctx).debug(`getHistory: \n ${JSON.stringify(results, null, 2)}`);
    const history = {
      AssetType: ccSkuProductStockAccountKey.assetType,
      key: compositeKey,
      history: results,
    };
    logger(ctx).debug('===== getSkuProductStockAccountHistoryByKey END =====');
    return history;
  }

  /**
   * Get all results
   * @param resultsIterator
   * @private
   */
  private async getAllResultsPaginated(resultsIterator: Iterators.StateQueryIterator): Promise<any[]> {
    const allResults = [];
    let res = await resultsIterator.next();
    while (!res.done) {
      if (res.value && res.value.value.toString()) {
        try {
          const jsonRes = JSON.parse(res.value.value.toString());
          jsonRes.key = res.value.key;
          allResults.push(jsonRes);
        } catch (err) {
          let jsonRes;
          jsonRes.record = res.value.value.toString();
          jsonRes.key = res.value.key;
          allResults.push(jsonRes);
        }
      }
      res = await resultsIterator.next();
    }
    return allResults;
  }

  /**
   * Get all results
   * @param resultsIterator
   * @private
   */
  private async getAllResults(resultsIterator: Promise<Iterators.StateQueryIterator> & AsyncIterable<Iterators.KV>): Promise<any[]> {
    const allResults = [];
    for await (const { key, value } of resultsIterator) {
      const strValue = Buffer.from(value).toString('utf8');
      let record;
      try {
        record = JSON.parse(strValue);
        record.key = key;
      } catch (err) {
        record = strValue;
        record.key = key;
      }
      allResults.push(record);
    }
    return allResults;
  }

  /**
   * Get all hstories.
   * @param resultsIterator
   * @private
   */
  private async getAllHitoryResults(resultsIterator: Promise<Iterators.HistoryQueryIterator> & AsyncIterable<Iterators.KeyModification>): Promise<any[]> {
    const allResults = [];
    for await (const { isDelete, value, timestamp, txId } of resultsIterator) {
      const strValue = Buffer.from(value).toString('utf8');
      let record;
      try {
        record = JSON.parse(strValue);
      } catch (err) {
        record = strValue;
      }
      allResults.push({ isDelete, record, timestamp, txId });
    }
    return allResults;
  }
}
