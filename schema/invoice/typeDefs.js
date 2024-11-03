const invoiceTypeDefs = `#graphql

    type Invoice {
        id: ID!
        student_no: String! # student_no
        student_id: String!
        # student_name: String!
        # student_email: String!
        invoice_no: String!
        reference: String # a simple description of the invoice -> 2000101041 Tuition Fees
        currency_code: String # UGX
        invoice_date: String! 
        due_date: String! # if exceeded, the student is charged with late payment fees
        narration: String!
        study_year: String
        semester: String
        academic_year: String!
        total_amount: Float!
        total_credit: Float # more like exemptions
        # totalBankPayments: Float 
        total_ppas: Float # total prepaid allocations -> money allocated to settle the invoice
        total_dps: Float # total deffered payments -> money agreed on to pay by the student on a later date
        amount_paid: Float
        amount_due: Float
        status: String # paid, pending, partially_paid
        paid: Int! 
        #   tracking: Boolean
        voided: Int!
        voided_by: String
        voided_on: String
        voided_reason: String
        invoice_type: String! # mandatory, optional
        invoice_category: String! # tution
        #   invoice_namespace: String!
        line_items: [LineItem]!
        # creditNotes: [CreditNote]
        txns: [Allocation]
        exempted: String
        exempt_reason: String
        exempt_date: String
        exempt_by: String # New field for exemptions like dead semester
        allocate_amount: String # amount to be allocated
    }

    type LineItem {
        line_item_id: ID!,
        date: String!
        invoice_no: String!
        student_no: String!
        # accountCode: String!
        item_code: String!
        item_name: String!
        unit_amount: Float!
        quantity: Int!
        item_description: String!
        item_comments: String
    }

    type Query {
        invoices(student_id: String, student_no: String): [Invoice]!
    }

    type Mutation {
        createTuitionInvoice(invoiceInput: InvoiceInput): ResponseMessage!
        createFunctionalInvoice(invoiceInput: InvoiceInput): ResponseMessage!
        createOtherFeesInvoice(student_no: String!, acc_yr: String!, study_yr: String!, semester: String!): ResponseMessage!
    }

    # Input Types for creating invoices and other records
    input InvoiceInput {
        student_no: String!,
        study_year: String,
        semester: String,
        academic_year: String!,
        status: String,
        voided: String,
        voided_by: String,
        # voided_on: String,
        voided_reason: String,
        invoice_type: String, 
        invoice_category: String!,
        exempted: String,
        exempt_reason: String,
        # exempt_date: ,
        exempt_by: String,
    }

    input ExemptReasonInput {
        reason: String
        exempt_date: String
        exempt_by: String
    }
`;

export default invoiceTypeDefs;
