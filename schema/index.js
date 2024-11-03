import { makeExecutableSchema } from "@graphql-tools/schema";
import { mergeTypeDefs, mergeResolvers } from "@graphql-tools/merge";
import { loadFiles } from "@graphql-tools/load-files";
import path from "path";
import { fileURLToPath } from "url";

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const typeDefsArray = await loadFiles(
    path.join(__dirname, "./**/typeDefs.js")
  );
  const resolversArray = await loadFiles(
    path.join(__dirname, "./**/resolvers.js")
  );

  return {
    typeDefsArray,
    resolversArray,
  };
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
const { typeDefsArray, resolversArray } = await main();

// Merge typeDefs and resolvers
export const typeDefs = mergeTypeDefs(typeDefsArray);
export const resolvers = mergeResolvers(resolversArray);

// console.log(typeDefsArray);
// const schema = makeExecutableSchema({
//   typeDefs: typeDefs,
//   resolvers: resolvers,
// });
