const transactionTypeDefs = `#graphql

    # staff type is missing field -> email 
    type Transaction {
        id: ID!,
        student_no: String!,
        prt: String!,
        payment_date: String!,
        bank_txn_id: String,
        tredumo_txn_id: String!,
        bank_ref: String!,
        bank_name: String!,
        bank_branch: String!,
        amount: String!,
        acc_yr: String!,
        unallocated: String!,
        allocated: String!,
        posted_by: String!,
        is_dp: Int,
        is_pp: Int,
    }


    type Query {
        student_transactions(student_no: String!): [Transaction]
    }

    # type Mutation {
        
    # }

`;

export default transactionTypeDefs;
