import "dotenv/config";

import mongoose from "mongoose";

import { connectDatabase } from "../config/database.js";
import { InvoiceModel } from "../models/invoice.model.js";

async function removeExchangeRaised(): Promise<void> {
  try {
    await connectDatabase();

    console.log(
      "Removing old EXCHANGE_RAISED pending reasons..."
    );

    /*
     * Use the native MongoDB collection.
     * This bypasses Mongoose document validation.
     */
    const collection = InvoiceModel.collection;

    /*
     * Fix pendingReason inside invoice items.
     */
    const invoiceItemsResult =
      await collection.updateMany(
        {
          "items.pendingReason": "EXCHANGE_RAISED"
        },
        {
          $set: {
            "items.$[item].pendingReason":
              "ITEM_NOT_AVAILABLE",

            "items.$[item].pendingReasonRemarks":
              "Previous exchange request"
          }
        },
        {
          arrayFilters: [
            {
              "item.pendingReason":
                "EXCHANGE_RAISED"
            }
          ]
        }
      );

    console.log(
      `Updated invoice-item reasons in ${invoiceItemsResult.modifiedCount} invoices.`
    );

    /*
     * Fix pendingReason inside nested
     * distributionHistory.items arrays.
     */
    const historyItemsResult =
      await collection.updateMany(
        {
          "distributionHistory.items.pendingReason":
            "EXCHANGE_RAISED"
        },
        {
          $set: {
            "distributionHistory.$[].items.$[historyItem].pendingReason":
              "ITEM_NOT_AVAILABLE",

            "distributionHistory.$[].items.$[historyItem].pendingReasonRemarks":
              "Previous exchange request"
          }
        },
        {
          arrayFilters: [
            {
              "historyItem.pendingReason":
                "EXCHANGE_RAISED"
            }
          ]
        }
      );

    console.log(
      `Updated distribution-history reasons in ${historyItemsResult.modifiedCount} invoices.`
    );

    /*
     * Remove the old exchangeRequests property
     * completely from existing MongoDB documents.
     */
    const exchangeRequestsResult =
      await collection.updateMany(
        {
          exchangeRequests: {
            $exists: true
          }
        },
        {
          $unset: {
            exchangeRequests: ""
          }
        }
      );

    console.log(
      `Removed exchangeRequests from ${exchangeRequestsResult.modifiedCount} invoices.`
    );

    /*
     * Verify that no old value remains.
     */
    const remainingCount =
      await collection.countDocuments({
        $or: [
          {
            "items.pendingReason":
              "EXCHANGE_RAISED"
          },
          {
            "distributionHistory.items.pendingReason":
              "EXCHANGE_RAISED"
          }
        ]
      });

    if (remainingCount > 0) {
      throw new Error(
        `${remainingCount} invoices still contain EXCHANGE_RAISED.`
      );
    }

    console.log(
      "All EXCHANGE_RAISED values were removed successfully."
    );
  } catch (error) {
    console.error(
      "Exchange cleanup failed:",
      error
    );

    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

void removeExchangeRaised();