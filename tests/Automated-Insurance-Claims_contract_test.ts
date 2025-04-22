import {
    Clarinet,
    Tx,
    Chain,
    Account,
    types,
  } from "https://deno.land/x/clarinet@v1.6.2/index.ts";
  import { assertEquals, assertNotEquals } from "https://deno.land/std@0.203.0/assert/mod.ts";
  
  Clarinet.test({
    name: "register-oracle: should register a new oracle by contract owner",
    async fn(chain: Chain, accounts: Map<string, Account>) {
      const deployer = accounts.get("deployer")!;
  
      const block = chain.mineBlock([
        Tx.contractCall(
          "auto-insurance",
          "register-oracle",
          [
            types.ascii("oracle-001"),
            types.utf8("WeatherOracle"),
            types.uint(1),
          ],
          deployer.address
        ),
      ]);
  
      block.receipts[0].result.expectOk().expectBool(true);
  
      const oracle = chain.callReadOnlyFn(
        "auto-insurance",
        "get-oracle",
        [types.ascii("oracle-001")],
        deployer.address
      );
  
      oracle.result.expectSome().expectTuple();
    },
  });
  
  Clarinet.test({
    name: "get-risk-profile: should retrieve correct risk profile for drought",
    async fn(chain: Chain, accounts: Map<string, Account>) {
      const deployer = accounts.get("deployer")!;
      const result = chain.callReadOnlyFn(
        "auto-insurance",
        "get-risk-profile",
        [types.uint(1)],
        deployer.address
      );
  
      result.result.expectSome().expectTuple();
    },
  });
  
  Clarinet.test({
    name: "calculate-premium: should return correct premium for drought profile",
    async fn(chain: Chain, accounts: Map<string, Account>) {
      const deployer = accounts.get("deployer")!;
      const result = chain.callReadOnlyFn(
        "auto-insurance",
        "calculate-premium",
        [
          types.uint(1), // drought profile
          types.uint(100000000), // coverage: 1000 STX
          types.utf8("Kaduna"),
        ],
        deployer.address
      );
  
      // base-rate = 500 (5%), risk = 300 (3%) → total = 8%
      // 8% of 100000000 = 8000000
      result.result.expectOk().expectUint(8000000);
    },
  });
  
  Clarinet.test({
    name: "submit-oracle-data: should allow oracle to submit weather data",
    async fn(chain: Chain, accounts: Map<string, Account>) {
      const deployer = accounts.get("deployer")!;
  
      chain.mineBlock([
        Tx.contractCall(
          "auto-insurance",
          "register-oracle",
          [types.ascii("oracle-001"), types.utf8("WeatherOracle"), types.uint(1)],
          deployer.address
        ),
      ]);
  
      const block = chain.mineBlock([
        Tx.contractCall(
          "auto-insurance",
          "submit-oracle-data",
          [
            types.ascii("oracle-001"),
            types.uint(1), // weather type: rainfall
            types.utf8("Kaduna"),
            types.uint(100),
            types.uint(111111111),
          ],
          deployer.address
        ),
      ]);
  
      block.receipts[0].result.expectOk().expectBool(true);
    },
  });
  
  Clarinet.test({
    name: "some-condition-met: should return false if condition not met or missing",
    async fn(chain: Chain, accounts: Map<string, Account>) {
      const deployer = accounts.get("deployer")!;
      const result = chain.callReadOnlyFn(
        "auto-insurance",
        "some-condition-met",
        [types.uint(999)], // non-existent policy
        deployer.address
      );
  
      result.result.expectBool(false);
    },
  });
  