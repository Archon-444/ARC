# Subgraph deploy

## ArcTokenFactory address

Before building or deploying the token-launcher subgraph, set the **ArcTokenFactory** contract address.

1. Open `subgraph.yaml`.
2. Find the `ArcTokenFactory` data source (under `dataSources:`).
3. Replace the placeholder:
   ```yaml
   source:
     address: "0x0000000000000000000000000000000000000000"
   ```
   with your deployed factory address (same as frontend `NEXT_PUBLIC_TOKEN_FACTORY_ADDRESS`):
   ```yaml
   source:
     address: "0xYourDeployedFactoryAddress"
   ```

If you use a deploy script, you can set it from env, e.g.:

```bash
export TOKEN_FACTORY_ADDRESS=0x...   # or NEXT_PUBLIC_TOKEN_FACTORY_ADDRESS
# Then run a one-line replace in subgraph.yaml before graph codegen/deploy
```

After the address is set, run `graph codegen` and `graph build` as usual.
