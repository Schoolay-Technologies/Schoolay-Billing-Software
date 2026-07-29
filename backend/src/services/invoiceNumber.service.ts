import { Types } from "mongoose";

import { InvoiceSequenceModel } from
  "../models/invoiceSequence.model.js";

export async function generateInvoiceNumber(
  schoolId: Types.ObjectId,
  schoolCode: string,
  financialYear: string
): Promise<string> {
  const sequence =
    await InvoiceSequenceModel.findOneAndUpdate(
      {
        schoolId,
        financialYear
      },
      {
        $inc: {
          currentNumber: 1
        }
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true
      }
    );

  const runningNumber = String(
    sequence.currentNumber
  ).padStart(4, "0");

  return `SCH/${schoolCode}/${financialYear}/${runningNumber}`;
}