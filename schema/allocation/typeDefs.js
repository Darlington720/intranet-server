const allocationTypeDefs = `#graphql

    type Allocation {
        id: ID!,
        student_no: String!,
        prt: String!,
        invoice_no: String!,
        acc_yr: String!,
        amount: String!,
        tredumo_txn_id: String!,
        allocation_date: String!,
        is_pp_allocation: Int,
        is_dp: Int,
        posted_by: String!
    }


    type Query {
        allocations: [Allocation]
    }

    # type Mutation {
        
    # }

`;

export default allocationTypeDefs;
