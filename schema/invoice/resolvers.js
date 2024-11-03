import { db } from "../../config/config.js";
import { GraphQLError } from "graphql";
// import generateUniqueID from "../../utilities/generateUniqueID.js";
import { getStudents } from "../student/resolvers.js";
import { getTuitionFees } from "../tuition_fees/resolvers.js";
import generateInvoiceNo from "../../utilities/generateInvoiceNo.js";
import { getApplicant } from "../applicant/resolvers.js";
import { getRunningSemesters } from "../academic_schedule/resolvers.js";
import distributeTuitionFees from "../../utilities/distributeTuitionFees.js";
import moment from "moment";
import saveData from "../../utilities/db/saveData.js";
import { getFunctionalFees } from "../functional_fee/resolvers.js";
import distributeFees from "../../utilities/distributeFeesToSemesters.js";
import { getOtherFees } from "../other_fee/resolvers.js";
import generateInvoiceNoForDeadSem from "../../utilities/generateInvoiceNoForDeadSem.js";
import { getInvoiceAllocations } from "../allocation/resolvers.js";

const getInvoiceLineItems = async ({ invoice_no }) => {
  try {
    let sql = `SELECT line_items.*, fees_items.item_name
    FROM line_items 
    LEFT JOIN fees_items ON line_items.item_id = fees_items.id
    WHERE invoice_no = ? ORDER BY line_item_id ASC`;
    let values = [invoice_no];

    const [results, fields] = await db.execute(sql, values);
    // console.log("results", results);
    return results;
  } catch (error) {
    throw new GraphQLError("Error fetching line items", error.message);
  }
};

export const getStudentInvoices = async ({ student_id, student_no }) => {
  if (!student_id && !student_no) {
    throw new GraphQLError("System Error, Please try again later...");
  }
  try {
    let where = "";
    let values = [];
    if (student_id) {
      where += " AND student_invoices.student_id = ?";
      values.push(student_id);
    }

    if (student_no) {
      where += " AND student_invoices.student_no = ?";
      values.push(student_no);
    }

    let sql = `SELECT student_invoices.*, acc_yrs.acc_yr_title AS academic_year
    FROM student_invoices 
    LEFT JOIN acc_yrs ON acc_yrs.id = student_invoices.acc_yr_id
    WHERE student_invoices.deleted = 0 ${where} ORDER BY student_invoices.id ASC`;

    const [results, fields] = await db.execute(sql, values);
    // console.log("results", results);
    return results;
  } catch (error) {
    throw new GraphQLError("Error fetching line items", error.message);
  }
};

export const createTuitionInvoice = async ({
  student_details,
  student_no,
  academic_year,
  study_year,
  semester,
  invoice_category,
  invoice_type,
  tuition_invoice_no,
}) => {
  try {
    // now, lets talk about invoicing -> tuition
    const applicant = await getApplicant(student_details[0].applicant_id);

    if (!applicant) {
      throw new GraphQLError(`Failed to locate student biodata`);
    }

    // console.log("tution details", {
    //   acc_yr_id: student_details[0].entry_acc_yr,
    //   campus_id: student_details[0].campus_id,
    //   intake_id: student_details[0].intake_id,
    //   course_id: student_details[0].course_id,
    //   nationality_category_id: applicant.nationality_category_id,
    //   study_yr: study_year,
    //   study_time_id: student_details[0].study_time_id,
    // });
    // after getting the student, we need to fetch the fees structure if that student based on recent enrollment
    // lets begin with tuition
    const tuition_fees = await getTuitionFees({
      acc_yr_id: student_details[0].entry_acc_yr,
      campus_id: student_details[0].campus_id,
      intake_id: student_details[0].intake_id,
      course_id: student_details[0].course_id,
      nationality_category_id: applicant.nationality_category_id,
      study_yr: study_year,
      study_time_id: student_details[0].study_time_id,
    });

    // console.log("tuition fees-------", tuition_fees);

    if (tuition_fees.length == 0) {
      throw new GraphQLError(
        `Failed to Create Invoice\nTuition Fees for Study Year: ${study_year}, semester: ${semester} not set.`
      );
    }

    // distribute tuition fees
    const distributedTuitionFees = await distributeTuitionFees(
      student_details[0].course_duration,
      tuition_fees,
      2
    );

    // console.log("distributed tuition fees", distributedTuitionFees);

    // now filter out the exact year and semester
    const tuition = distributedTuitionFees.filter(
      (fee) =>
        fee.study_yr == parseInt(study_year) &&
        fee.semester == parseInt(semester)
    );

    // now that we have the tuition_fees for the given academic year and study_year, lets create the invoice
    // first, we need an invoice number, the convention is -> 2000101041-T-202410001

    // lets now aggregate all the items returned above to get the total amount
    let amount = 0;
    tuition.map((fee) => {
      amount += parseInt(fee.amount);
    });

    // lets get the closing date of the current sem for the given student intakes
    const running_sems = await getRunningSemesters({
      intake_id: student_details[0].intake_id,
    });

    const semesterEndDate = running_sems[0].end_date;
    const dueDate = moment(semesterEndDate)
      .subtract(1, "months")
      .format("YYYY-MM-DD");

    let amount_paid = 0;

    const data = {
      student_no,
      student_id: student_details[0].id,
      invoice_no: tuition_invoice_no,
      reference: `${student_no} TUITION FEES`,
      currency_code: "UGX",
      invoice_date: new Date(),
      due_date: dueDate,
      narration: invoice_category,
      study_year,
      semester,
      acc_yr_id: academic_year,
      total_amount: amount,
      total_credit: 0,
      total_ppas: 0,
      total_dps: 0,
      amount_paid,
      amount_due: amount - amount_paid,
      status: "pending",
      paid: 0,
      voided: 0,
      invoice_type: invoice_type,
      invoice_category: invoice_category,
    };

    // then the line items
    const line_items_data = tuition.map((fee) => ({
      invoice_no: tuition_invoice_no,
      student_no,
      item_id: fee.item_id,
      item_code: fee.item_code,
      unit_amount: fee.amount,
      quantity: 1,
      item_description: fee.item_description,
      item_comments: fee.item_description,
      date: new Date(),
    }));

    // console.log("created Invoice", data);
    // console.log("tuition", tuition);
    // console.log("the line items", line_items_data);

    await saveData({
      table: "student_invoices",
      data,
      id: null,
    });

    await saveData({
      table: "line_items",
      data: line_items_data,
      id: null,
    });
  } catch (error) {
    console.log("tuition error", error.message);
    throw new GraphQLError(error.message);
  }
};

export const createFunctionalInvoice = async ({
  student_details,
  student_no,
  academic_year,
  study_year,
  semester,
  invoice_category,
  invoice_type,
  functional_invoice_no,
}) => {
  try {
    const applicant = await getApplicant(student_details[0].applicant_id);

    // console.log("the applicant", applicant);

    if (!applicant) {
      throw new GraphQLError(`Failed to locate student biodata`);
    }

    // console.log("payload", {
    //   acc_yr_id: student_details[0].entry_acc_yr,
    //   campus_id: student_details[0].campus_id,
    //   intake_id: student_details[0].intake_id,
    //   level_id: student_details[0].level,
    //   nationality_category_id: applicant.nationality_category_id,
    //   study_time_id: student_details[0].study_time_id,
    // });

    // after getting the student, we need to fetch the fees structure if that student based on recent enrollment
    // functional fees
    const functional_fees = await getFunctionalFees({
      acc_yr_id: student_details[0].entry_acc_yr,
      campus_id: student_details[0].campus_id,
      intake_id: student_details[0].intake_id,
      level_id: student_details[0].level,
      nationality_category_id: applicant.nationality_category_id,
      study_time_id: student_details[0].study_time_id,
    });

    // console.log("the functional fees", functional_fees);

    if (functional_fees.length == 0) {
      throw new GraphQLError(
        `Functional Fees for Study Year: ${study_year}, semester: ${semester} not set.`
      );
    }

    // distribute tuition fees
    const distributedFunctionalFees = await distributeFees(
      student_details[0].course_duration,
      functional_fees,
      2
    );

    // console.log("distributed functional fees", distributedFunctionalFees);

    // now filter out the exact year and semester
    const functional = distributedFunctionalFees.filter(
      (fee) =>
        fee.study_yr == parseInt(study_year) &&
        fee.semester == parseInt(semester)
    );

    // console.log("functional", functional);

    if (functional.length == 0) {
      throw new GraphQLError(
        `Functional Fees for Study Year: ${study_year}, semester: ${semester} not set.`
      );
    }

    // lets now aggregate all the items returned above to get the total amount
    let amount = 0;
    functional.map((fee) => {
      amount += parseInt(fee.amount);
    });

    // lets get the closing date of the current sem for the given student intakes
    const running_sems = await getRunningSemesters({
      intake_id: student_details[0].intake_id,
    });

    const semesterEndDate = running_sems[0].end_date;
    const dueDate = moment(semesterEndDate)
      .subtract(1, "months")
      .format("YYYY-MM-DD");

    let amount_paid = 0;

    const data = {
      student_no,
      student_id: student_details[0].id,
      invoice_no: functional_invoice_no,
      reference: `${student_no} ${invoice_category} FEES`,
      currency_code: "UGX",
      invoice_date: new Date(),
      due_date: dueDate,
      narration: invoice_category,
      study_year,
      semester,
      acc_yr_id: academic_year,
      total_amount: amount,
      total_credit: 0,
      total_ppas: 0,
      total_dps: 0,
      amount_paid,
      amount_due: amount - amount_paid,
      status: "pending",
      paid: 0,
      voided: 0,
      invoice_type: invoice_type,
      invoice_category: invoice_category,
    };

    // then the line items
    const line_items_data = functional.map((fee) => ({
      invoice_no: functional_invoice_no,
      student_no,
      item_id: fee.item_id,
      item_code: fee.item_code,
      unit_amount: fee.amount,
      quantity: 1,
      item_description: fee.item_description,
      item_comments: fee.item_description,
      date: new Date(),
    }));

    console.log("created Invoice", data);
    console.log("the line items", data);

    await saveData({
      table: "student_invoices",
      data,
      id: null,
    });

    await saveData({
      table: "line_items",
      data: line_items_data,
      id: null,
    });
  } catch (error) {
    console.log("functional error", error);
    throw new GraphQLError(error.message);
  }
};

export const createDeadSemInvoice = async ({
  student_details,
  student_no,
  academic_year,
  study_year,
  semester,
  invoice_category,
  invoice_type,

  distribute_fee = false,
  dead_semesters = [],
  running_sems,
}) => {
  try {
    const dead_sem_invoice_no = await generateInvoiceNoForDeadSem({
      student_no,
      study_yr: study_year,
      sem: semester,
    });
    const fee_name = "DEAD SEM";
    const applicant = await getApplicant(student_details[0].applicant_id);

    if (!applicant) {
      throw new GraphQLError(`Failed to locate student biodata`);
    }

    const other_fees = await getOtherFees({
      acc_yr_id: academic_year,
      campus_id: student_details[0].campus_id,
      intake_id: student_details[0].intake_id,
      nationality_category_id: applicant.nationality_category_id,
      fee_name: "dead sem",
    });

    if (!other_fees[0]) {
      throw new GraphQLError("The fee needed for allocation not yet set!");
    }

    console.log("the dead sem fees", other_fees);

    if (!distribute_fee) {
      // no need of distributing, just create the invoice from the data generated

      //    const semesterEndDate = running_sems[0].end_date;
      // const dueDate = moment(semesterEndDate)
      //   .subtract(1, "months")
      //   .format("YYYY-MM-DD");

      let amount = 0;
      let amount_paid = 0;
      amount += parseInt(other_fees[0].amount);

      const data = {
        student_no,
        student_id: student_details[0].id,
        invoice_no: dead_sem_invoice_no,
        reference: `${student_no} ${invoice_category} FEES`,
        currency_code: "UGX",
        invoice_date: new Date(),
        // due_date: dueDate,
        narration: invoice_category,
        study_year,
        semester,
        acc_yr_id: academic_year,
        total_amount: amount,
        total_credit: 0,
        total_ppas: 0,
        total_dps: 0,
        amount_paid,
        amount_due: amount - amount_paid,
        status: "pending",
        paid: 0,
        voided: 0,
        invoice_type: invoice_type,
        invoice_category: invoice_category,
      };

      // then the line items
      const line_items_data = {
        invoice_no: dead_sem_invoice_no,
        student_no,
        item_id: other_fees[0].item_id,
        item_code: other_fees[0].item_code,
        unit_amount: other_fees[0].amount,
        quantity: 1,
        item_description: other_fees[0].item_description,
        item_comments: other_fees[0].item_description,
        date: new Date(),
      };

      console.log("created Invoice", data);
      console.log("the line items", line_items_data);

      await saveData({
        table: "student_invoices",
        data,
        id: null,
      });

      await saveData({
        table: "line_items",
        data: line_items_data,
        id: null,
      });
    } else {
      // go ahead and distribute the fee
    }

    // after getting the student, we need to fetch the fees structure if that student based on recent enrollment
    // functional fees
    // const functional_fees = await getFunctionalFees({
    //   acc_yr_id: student_details[0].entry_acc_yr,
    //   campus_id: student_details[0].campus_id,
    //   intake_id: student_details[0].intake_id,
    //   level_id: student_details[0].level,
    //   nationality_category_id: applicant.nationality_category_id,
    //   study_time_id: student_details[0].study_time_id,
    // });

    // // distribute tuition fees
    // const distributedFunctionalFees = await distributeFees(
    //   student_details[0].course_duration,
    //   functional_fees,
    //   2
    // );

    // // console.log("distributed functional fees", distributedFunctionalFees);

    // // now filter out the exact year and semester
    // const functional = distributedFunctionalFees.filter(
    //   (fee) =>
    //     fee.study_yr == parseInt(study_year) &&
    //     fee.semester == parseInt(semester)
    // );

    // // lets now aggregate all the items returned above to get the total amount
    // let amount = 0;
    // functional.map((fee) => {
    //   amount += parseInt(fee.amount);
    // });

    // // lets get the closing date of the current sem for the given student intakes
    // const running_sems = await getRunningSemesters({
    //   intake_id: student_details[0].intake_id,
    // });

    // const semesterEndDate = running_sems[0].end_date;
    // const dueDate = moment(semesterEndDate)
    //   .subtract(1, "months")
    //   .format("YYYY-MM-DD");

    // let amount_paid = 0;

    // const data = {
    //   student_no,
    //   student_id: student_details[0].id,
    //   invoice_no,
    //   reference: `${student_no} ${invoice_category} FEES`,
    //   currency_code: "UGX",
    //   invoice_date: new Date(),
    //   due_date: dueDate,
    //   narration: invoice_category,
    //   study_year,
    //   semester,
    //   acc_yr_id: academic_year,
    //   total_amount: amount,
    //   total_credit: 0,
    //   total_ppas: 0,
    //   total_dps: 0,
    //   amount_paid,
    //   amount_due: amount - amount_paid,
    //   status: "pending",
    //   paid: 0,
    //   voided: 0,
    //   invoice_type: invoice_type,
    //   invoice_category: invoice_category,
    // };

    // // then the line items
    // const line_items_data = functional.map((fee) => ({
    //   invoice_no,
    //   student_no,
    //   item_id: fee.item_id,
    //   item_code: fee.item_code,
    //   unit_amount: fee.amount,
    //   quantity: 1,
    //   item_description: fee.item_description,
    //   item_comments: fee.item_description,
    //   date: new Date(),
    // }));

    // // console.log("created Invoice", data);
    // // console.log("the line items", line_items_data);

    // await saveData({
    //   table: "student_invoices",
    //   data,
    //   id: null,
    // });

    // await saveData({
    //   table: "line_items",
    //   data: line_items_data,
    //   id: null,
    // });
  } catch (error) {
    throw new GraphQLError(error.message);
  }
};

const invoiceResolvers = {
  Query: {
    invoices: async (parent, args) => {
      const { student_id, student_no } = args;

      const invoices = await getStudentInvoices({
        student_id,
        student_no,
      });

      return invoices;
    },
  },
  Invoice: {
    line_items: async (parent, args) => {
      const invoice_no = parent.invoice_no;

      const lineItems = await getInvoiceLineItems({
        invoice_no,
      });

      return lineItems;
    },
    txns: async (parent, args) => {
      const invoice_no = parent.invoice_no;

      const allocations = await getInvoiceAllocations({
        invoice_no,
      });

      return allocations;
    },
  },

  Mutation: {
    createTuitionInvoice: async (parent, args) => {
      const {
        student_no,
        study_year,
        semester,
        academic_year,
        // status,
        invoice_type,
        invoice_category,
        exempted,
        exempt_reason,
        exempt_date,
        exempt_by,
      } = args.invoiceInput;

      // console.log("the args", args);
      try {
        // now, lets start with getting the specific student details
        const student_details = await getStudents({
          std_no: student_no,
          get_course_details: 1,
        });

        if (!student_details[0]) {
          throw new GraphQLError(
            `No student with student number ${student_no}`
          );
        }

        const applicant = await getApplicant(student_details[0].applicant_id);

        if (!applicant) {
          throw new GraphQLError(`Failed to locate student biodata`);
        }

        // after getting the student, we need to fetch the fees structure if that student based on recent enrollment
        // lets begin with tuition
        const tuition_fees = await getTuitionFees({
          acc_yr_id: academic_year,
          campus_id: student_details[0].campus_id,
          intake_id: student_details[0].intake_id,
          course_id: student_details[0].course_id,
          nationality_category_id: applicant.nationality_category_id,
          study_yr: study_year,
          study_time_id: student_details[0].study_time_id,
        });

        // console.log("payload", {
        //   acc_yr_id: academic_year,
        //   campus_id: student_details[0].campus_id,
        //   intake_id: student_details[0].intake_id,
        //   course_id: student_details[0].course_id,
        //   nationality_category_id: applicant.nationality_category_id,
        //   study_yr: study_year,
        //   study_time_id: student_details[0].study_time_id,
        // });

        // console.log("the tuition fees", tuition_fees);

        // distribute tuition fees
        const distributedTuitionFees = await distributeTuitionFees(
          student_details[0].course_duration,
          tuition_fees,
          2
        );

        // console.log("distributed tuition fees", distributedTuitionFees);

        // now filter out the exact year and semester
        const tuition = distributedTuitionFees.filter(
          (fee) =>
            fee.study_yr == parseInt(study_year) &&
            fee.semester == parseInt(semester)
        );

        // now that we have the tuition_fees for the given academic year and study_year, lets create the invoice
        // first, we need an invoice number, the convention is -> 2000101041-T-202410001
        const invoice_no = await generateInvoiceNo({
          student_no,
          invoice_category: invoice_category, // invoice_category
        });

        // lets now aggregate all the items returned above to get the total amount
        let amount = 0;
        tuition.map((fee) => {
          amount += parseInt(fee.amount);
        });

        // lets get the closing date of the current sem for the given student intakes
        const running_sems = await getRunningSemesters({
          intake_id: student_details[0].intake_id,
        });

        const semesterEndDate = running_sems[0].end_date;
        const dueDate = moment(semesterEndDate)
          .subtract(1, "months")
          .format("YYYY-MM-DD");

        let amount_paid = 0;

        const data = {
          student_no,
          student_id: student_details[0].id,
          invoice_no,
          reference: `${student_no} TUITION FEES`,
          currency_code: "UGX",
          invoice_date: new Date(),
          due_date: dueDate,
          narration: invoice_category,
          study_year,
          semester,
          acc_yr_id: academic_year,
          total_amount: amount,
          total_credit: 0,
          total_ppas: 0,
          total_dps: 0,
          amount_paid,
          amount_due: amount - amount_paid,
          status: "pending",
          paid: 0,
          voided: 0,
          invoice_type: invoice_type,
          invoice_category: invoice_category,
        };

        // then the line items
        const line_items_data = tuition.map((fee) => ({
          invoice_no,
          student_no,
          item_id: fee.item_id,
          item_code: fee.item_code,
          unit_amount: fee.amount,
          quantity: 1,
          item_description: fee.item_description,
          item_comments: fee.item_description,
          date: new Date(),
        }));

        // console.log("created Invoice", data);
        // console.log("the line items", line_items_data);

        await saveData({
          table: "student_invoices",
          data,
          id: null,
        });

        await saveData({
          table: "line_items",
          data: line_items_data,
          id: null,
        });

        return {
          success: "true",
          message: "Invoice created Successfully",
        };
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },

    createFunctionalInvoice: async (parent, args) => {
      const {
        student_no,
        study_year,
        semester,
        academic_year,
        // status,
        invoice_type,
        invoice_category,
        exempted,
        exempt_reason,
        exempt_date,
        exempt_by,
      } = args.invoiceInput;

      // console.log("the args", args);
      try {
        // now, lets start with getting the specific student details
        const student_details = await getStudents({
          std_no: student_no,
          get_course_details: 1,
        });

        if (!student_details[0]) {
          throw new GraphQLError(
            `No student with student number ${student_no}`
          );
        }

        const applicant = await getApplicant(student_details[0].applicant_id);

        if (!applicant) {
          throw new GraphQLError(`Failed to locate student biodata`);
        }

        // after getting the student, we need to fetch the fees structure if that student based on recent enrollment
        // functional fees

        const functional_fees = await getFunctionalFees({
          acc_yr_id: academic_year,
          campus_id: student_details[0].campus_id,
          intake_id: student_details[0].intake_id,
          level_id: student_details[0].level,
          nationality_category_id: applicant.nationality_category_id,
          study_time_id: student_details[0].study_time_id,
        });

        // console.log("payload", {
        //   acc_yr_id: academic_year,
        //   campus_id: student_details[0].campus_id,
        //   intake_id: student_details[0].intake_id,
        //   level_id: student_details[0].level,
        //   nationality_category_id: applicant.nationality_category_id,
        //   study_time_id: student_details[0].study_time_id,
        // });

        // console.log("student details", student_details);

        // distribute tuition fees
        const distributedFunctionalFees = await distributeFees(
          student_details[0].course_duration,
          functional_fees,
          2
        );

        // console.log("distributed functional fees", distributedFunctionalFees);

        // now filter out the exact year and semester
        const functional = distributedFunctionalFees.filter(
          (fee) =>
            fee.study_yr == parseInt(study_year) &&
            fee.semester == parseInt(semester)
        );

        // now that we have the tuition_fees for the given academic year and study_year, lets create the invoice
        // first, we need an invoice number, the convention is -> 2000101041-T-202410001
        const invoice_no = await generateInvoiceNo({
          student_no,
          invoice_category: invoice_category, // invoice_category
        });

        // lets now aggregate all the items returned above to get the total amount
        let amount = 0;
        functional.map((fee) => {
          amount += parseInt(fee.amount);
        });

        // lets get the closing date of the current sem for the given student intakes
        const running_sems = await getRunningSemesters({
          intake_id: student_details[0].intake_id,
        });

        const semesterEndDate = running_sems[0].end_date;
        const dueDate = moment(semesterEndDate)
          .subtract(1, "months")
          .format("YYYY-MM-DD");

        let amount_paid = 0;

        const data = {
          student_no,
          student_id: student_details[0].id,
          invoice_no,
          reference: `${student_no} ${invoice_category} FEES`,
          currency_code: "UGX",
          invoice_date: new Date(),
          due_date: dueDate,
          narration: invoice_category,
          study_year,
          semester,
          acc_yr_id: academic_year,
          total_amount: amount,
          total_credit: 0,
          total_ppas: 0,
          total_dps: 0,
          amount_paid,
          amount_due: amount - amount_paid,
          status: "pending",
          paid: 0,
          voided: 0,
          invoice_type: invoice_type,
          invoice_category: invoice_category,
        };

        // then the line items
        const line_items_data = functional.map((fee) => ({
          invoice_no,
          student_no,
          item_id: fee.item_id,
          item_code: fee.item_code,
          unit_amount: fee.amount,
          quantity: 1,
          item_description: fee.item_description,
          item_comments: fee.item_description,
          date: new Date(),
        }));

        // console.log("created Invoice", data);
        // console.log("the line items", line_items_data);

        await saveData({
          table: "student_invoices",
          data,
          id: null,
        });

        await saveData({
          table: "line_items",
          data: line_items_data,
          id: null,
        });

        return {
          success: "true",
          message: "Invoice created Successfully",
        };
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },

    createOtherFeesInvoice: async (parent, args) => {
      const { student_no, acc_yr, study_yr, semester } = args;

      try {
        // now, lets start with getting the specific student details
        const student_details = await getStudents({
          std_no: student_no,
          get_course_details: 1,
        });

        if (!student_details[0]) {
          throw new GraphQLError(
            `No student with student number ${student_no}`
          );
        }

        const invoice_no = await generateInvoiceNoForDeadSem({
          student_no,
          study_yr,
          sem: semester,
        });

        const result = await createDeadSemInvoice({
          student_details: student_details,
          academic_year: acc_yr,
          student_no,
          study_year: study_yr,
          semester,
          dead_semesters: [{}, {}],
          invoice_category: "DEAD SEMESTER",
          invoice_type: "mandatory",
          invoice_no,
        });

        console.log("result", result);
      } catch (error) {
        throw new GraphQLError(error.message);
      }
    },
  },
};

export default invoiceResolvers;
