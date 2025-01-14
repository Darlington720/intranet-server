const paymentReferenceTokenTypeDefs = `#graphql

    type PaymentReferenceToken {
        id: ID!,
        student_no: String!,
        type: String!,  # prepayment_ref or invoice_ref
        prt: String!,
        amount:  Float!,
        allocations: String!, # pp or invoice_nos
        prt_expiry: String!,
        created_at: String!,
        invoices:  [Invoice],
        generated_by: String!
    }

    type Query {
        prts: [PaymentReferenceToken]
    }

    type Mutation {
        generatePRT(
            id: ID, 
            student_no:  String, 
            amount: Int!,
            type: String!,  # prepayment_ref or invoice_ref
            invoices: String
        ): PaymentReferenceToken
    }
`;

export default paymentReferenceTokenTypeDefs;
