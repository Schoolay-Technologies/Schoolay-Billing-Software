import "dotenv/config";

import mongoose from "mongoose";

import { connectDatabase } from "../config/database.js";
import { InvoiceModel } from "../models/invoice.model.js";

type FulfilmentStatus =
  | "NOT_COMPLETED"
  | "PARTIALLY_COMPLETED"
  | "COMPLETELY_DELIVERED";

function calculateFulfilmentStatus(
  orderedQuantity: number,
  deliveredQuantity: number
): FulfilmentStatus {
  if (deliveredQuantity <= 0) {
    return "NOT_COMPLETED";
  }

  if (deliveredQuantity >= orderedQuantity) {
    return "COMPLETELY_DELIVERED";
  }

  return "PARTIALLY_COMPLETED";
}

async function backfillOrderTracking(): Promise<void> {
  try {
    await connectDatabase();

    console.log(
      "Starting backfill of order tracking fields..."
    );

    /*
     * Update older invoices that were created before
     * placeOfOrder was added to the schema.
     */
    const placeOfOrderResult =
      await InvoiceModel.updateMany(
        {
          placeOfOrder: {
            $exists: false
          }
        },
        {
          $set: {
            placeOfOrder: "SCHOOL_CAMP",
            specializedStoreName: ""
          }
        }
      );

    console.log(
      `Set placeOfOrder for ${placeOfOrderResult.modifiedCount} invoices.`
    );

    const invoices = await InvoiceModel.find({});

    let updatedCount = 0;

    for (const invoice of invoices) {
      let changed = false;

      /*
       * Invoice-level defaults
       */
      if (!invoice.placeOfOrder) {
        invoice.placeOfOrder = "SCHOOL_CAMP";
        changed = true;
      }

      if (
        invoice.specializedStoreName === undefined ||
        invoice.specializedStoreName === null
      ) {
        invoice.specializedStoreName = "";
        changed = true;
      }

      let totalOrderedQuantity = 0;
      let totalDeliveredQuantity = 0;

      /*
       * Backfill invoice-item tracking fields
       */
      for (const item of invoice.items) {
        const orderedQuantity =
          Number(item.quantity) || 0;

        const deliveredQuantity = Math.min(
          Math.max(
            Number(item.deliveredQuantity ?? 0),
            0
          ),
          orderedQuantity
        );

        const pendingQuantity = Math.max(
          orderedQuantity - deliveredQuantity,
          0
        );

        const itemFulfilmentStatus =
          calculateFulfilmentStatus(
            orderedQuantity,
            deliveredQuantity
          );

        totalOrderedQuantity += orderedQuantity;
        totalDeliveredQuantity += deliveredQuantity;

        if (
          item.deliveredQuantity !==
          deliveredQuantity
        ) {
          item.deliveredQuantity =
            deliveredQuantity;

          changed = true;
        }

        if (
          item.pendingQuantity !==
          pendingQuantity
        ) {
          item.pendingQuantity =
            pendingQuantity;

          changed = true;
        }

        if (
          item.fulfilmentStatus !==
          itemFulfilmentStatus
        ) {
          item.fulfilmentStatus =
            itemFulfilmentStatus;

          changed = true;
        }

        /*
         * Clear the pending reason when the item
         * has been fully delivered.
         */
        if (pendingQuantity === 0) {
          if (item.pendingReason !== "") {
            item.pendingReason = "";
            changed = true;
          }

          if (
            item.pendingReasonRemarks !== ""
          ) {
            item.pendingReasonRemarks = "";
            changed = true;
          }
        } else {
          if (
            item.pendingReason === undefined ||
            item.pendingReason === null
          ) {
            item.pendingReason = "";
            changed = true;
          }

          if (
            item.pendingReasonRemarks ===
              undefined ||
            item.pendingReasonRemarks === null
          ) {
            item.pendingReasonRemarks = "";
            changed = true;
          }
        }
      }

      /*
       * Backfill distribution-history records
       */
      if (
        Array.isArray(
          invoice.distributionHistory
        )
      ) {
        for (
          const history of
          invoice.distributionHistory
        ) {
          if (!history.placeOfDistribution) {
            history.placeOfDistribution =
              "SCHOOL_CAMP";

            changed = true;
          }

          if (
            history.customDistributionPlace ===
              undefined ||
            history.customDistributionPlace ===
              null
          ) {
            history.customDistributionPlace = "";
            changed = true;
          }

          if (
            history.remarks === undefined ||
            history.remarks === null
          ) {
            history.remarks = "";
            changed = true;
          }

          if (!history.distributionDate) {
            history.distributionDate =
              history.createdAt ??
              invoice.invoiceDate ??
              new Date();

            changed = true;
          }

          if (Array.isArray(history.items)) {
            for (
              const historyItem of
              history.items
            ) {
              const deliveredNow = Math.max(
                Number(
                  historyItem.deliveredNow ?? 0
                ),
                0
              );

              const pendingAfterUpdate =
                Math.max(
                  Number(
                    historyItem.pendingAfterUpdate ??
                      0
                  ),
                  0
                );

              if (
                historyItem.deliveredNow !==
                deliveredNow
              ) {
                historyItem.deliveredNow =
                  deliveredNow;

                changed = true;
              }

              if (
                historyItem.pendingAfterUpdate !==
                pendingAfterUpdate
              ) {
                historyItem.pendingAfterUpdate =
                  pendingAfterUpdate;

                changed = true;
              }

              if (
                pendingAfterUpdate === 0
              ) {
                if (
                  historyItem.pendingReason !== ""
                ) {
                  historyItem.pendingReason = "";
                  changed = true;
                }

                if (
                  historyItem
                    .pendingReasonRemarks !== ""
                ) {
                  historyItem.pendingReasonRemarks =
                    "";

                  changed = true;
                }
              } else {
                if (
                  historyItem.pendingReason ===
                    undefined ||
                  historyItem.pendingReason ===
                    null
                ) {
                  historyItem.pendingReason = "";
                  changed = true;
                }

                if (
                  historyItem
                    .pendingReasonRemarks ===
                    undefined ||
                  historyItem
                    .pendingReasonRemarks === null
                ) {
                  historyItem.pendingReasonRemarks =
                    "";

                  changed = true;
                }
              }
            }
          }
        }
      } else {
        /*
         * Mongoose normally creates this because
         * the schema has default: [].
         */
        invoice.set(
          "distributionHistory",
          []
        );

        changed = true;
      }

      /*
       * Recalculate invoice-level tracking totals.
       */
      const totalPendingQuantity = Math.max(
        totalOrderedQuantity -
          totalDeliveredQuantity,
        0
      );

      const invoiceFulfilmentStatus =
        calculateFulfilmentStatus(
          totalOrderedQuantity,
          totalDeliveredQuantity
        );

      if (
        invoice.totalOrderedQuantity !==
        totalOrderedQuantity
      ) {
        invoice.totalOrderedQuantity =
          totalOrderedQuantity;

        changed = true;
      }

      if (
        invoice.totalDeliveredQuantity !==
        totalDeliveredQuantity
      ) {
        invoice.totalDeliveredQuantity =
          totalDeliveredQuantity;

        changed = true;
      }

      if (
        invoice.totalPendingQuantity !==
        totalPendingQuantity
      ) {
        invoice.totalPendingQuantity =
          totalPendingQuantity;

        changed = true;
      }

      if (
        invoice.fulfilmentStatus !==
        invoiceFulfilmentStatus
      ) {
        invoice.fulfilmentStatus =
          invoiceFulfilmentStatus;

        changed = true;
      }

      if (changed) {
        await invoice.save();
        updatedCount += 1;

        console.log(
          `Updated invoice: ${invoice.invoiceNumber}`
        );
      }
    }

    console.log(
      `${updatedCount} invoices updated successfully.`
    );

    console.log(
      "Order-tracking backfill completed successfully."
    );
  } catch (error) {
    console.error(
      "Order-tracking backfill failed:",
      error
    );

    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

void backfillOrderTracking();