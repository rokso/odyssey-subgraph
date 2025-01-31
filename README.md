# Odyssey Subgraph
Subgraph for Odyssey Protocol

## Setup
Run `yarn install`

## Generate code from Graphql schema and ABI
Run `yarn codegen`

## Build
Run `yarn build --network networkName`
> Current supported networks are base, hemi, mainnet and optimism.

## Deploy
Follow deployment guide [here](https://thegraph.com/docs/en/subgraphs/developing/deploying/using-subgraph-studio/) to understand the process of deployment.

**Graph auth**
- Get the graph deploy key, follow steps [here](https://thegraph.com/docs/en/subgraphs/developing/deploying/using-subgraph-studio/#graph-auth).
- Run `yarn graph auth <Deploy Key>
  
**Deploy Subgraph**
- Run `yarn deploy`
> This command is going to ask subgraph name. As a rule of thumb you should follow "odyssey-subgraph-${networkName}" pattern for subgraph name.