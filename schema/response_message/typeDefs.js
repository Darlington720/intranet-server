const responseMessageTypeDefs = `#graphql

        type ResponseMessage {
          success: String!,
          message: String!
        }

        type Response {
          success: Boolean,
          message: String!,
          # result: Any
        }

`;

export default responseMessageTypeDefs;
