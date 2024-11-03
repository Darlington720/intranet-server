// Function to generate invoice based on enrollment
const generateInvoice = (enrollment, feeStructure) => {
  const { studyYear, semester, studentId, enrollmentId } = enrollment;

  // Find fees applicable to the student's study year and semester
  const studentFees = feeStructure.find(
    (fees) => fees.studyYear === studyYear && fees.semester === semester
  );

  if (!studentFees) {
    throw new Error("No applicable fees found for the student");
  }

  // Calculate total amount based on fee structure
  const totalAmount = studentFees.tuition + studentFees.additionalFees;

  // Create invoice object
  const invoice = {
    invoiceId: `INV-${enrollmentId}-${Date.now()}`, // Unique invoice number
    studentId,
    enrollmentId,
    studyYear,
    semester,
    amountDue: totalAmount,
    dueDate: calculateDueDate(semester), // You can define the logic for due date
    status: "Pending",
    createdOn: new Date(),
  };

  return invoice;
};

// Helper function to calculate the invoice due date
const calculateDueDate = (semester) => {
  // Logic to calculate due date based on semester
  const dueDate = new Date();
  // Assume a standard due date period of 30 days from enrollment
  dueDate.setDate(dueDate.getDate() + 30);
  return dueDate;
};
