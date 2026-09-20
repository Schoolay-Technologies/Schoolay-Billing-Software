import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode
} from "react";

import ERPStartupLoader, {
  type ERPStartupStage
} from "./ERPStartupLoader";

import { getOrderTrackingList } from "../../api/orderTracking.api";
import { getSchools } from "../../api/school.api";

interface ERPStartupProviderProps {
  children: ReactNode;
}

interface ERPStartupContextValue {
  isReady: boolean;
  initialOrders: any[];
  initialSchools: any[];
  initialPagination: any | null;
}

const ERPStartupContext =
  createContext<ERPStartupContextValue | undefined>(
    undefined
  );

export default function ERPStartupProvider({
  children
}: ERPStartupProviderProps) {
  const [isReady, setIsReady] = useState(false);

  const [stage, setStage] =
    useState<ERPStartupStage>("connecting");

  const [initialOrders, setInitialOrders] =
    useState<any[]>([]);

  const [initialSchools, setInitialSchools] =
    useState<any[]>([]);

  const [initialPagination, setInitialPagination] =
    useState<any | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function startup() {
      /*
       * ------------------------------------------
       * KEEP TRYING UNTIL BACKEND RESPONDS
       * ------------------------------------------
       */

      while (!cancelled) {
        try {
          console.log(
            "🚀 SCHOOLAY ERP: Starting backend connection..."
          );

          setStage("connecting");

          /*
           * Small delay allows the loader to render
           * before the request starts.
           */
          await new Promise((resolve) =>
            setTimeout(resolve, 300)
          );

          if (cancelled) {
            return;
          }

          /*
           * ----------------------------------------
           * REAL BACKEND REQUEST
           * ----------------------------------------
           *
           * This request will wake Render if the
           * backend is sleeping.
           */

          console.log(
            "📡 SCHOOLAY ERP: Calling backend..."
          );

          setStage("database");

          const ordersPromise =
            getOrderTrackingList({
              searchType: "both",
              page: 1,
              limit: 10
            });

          const schoolsPromise =
            getSchools({
              page: 1,
              limit: 100
            });

          /*
           * WAIT FOR BOTH REAL RESPONSES
           */

          const [
            ordersResult,
            schoolsResult
          ] = await Promise.all([
            ordersPromise,
            schoolsPromise
          ]);

          if (cancelled) {
            return;
          }

          console.log(
            "✅ SCHOOLAY ERP: Backend responded"
          );

          /*
           * ----------------------------------------
           * ORDERS LOADED
           * ----------------------------------------
           */

          setStage("orders");

          setInitialOrders(
            ordersResult.data ?? []
          );

          setInitialPagination(
            ordersResult.pagination ?? null
          );

          /*
           * ----------------------------------------
           * SCHOOLS LOADED
           * ----------------------------------------
           */

          setStage("schools");

          setInitialSchools(
            schoolsResult.data ?? []
          );

          /*
           * Give the loader a small completion
           * animation.
           */

          await new Promise((resolve) =>
            setTimeout(resolve, 700)
          );

          if (cancelled) {
            return;
          }

          /*
           * ----------------------------------------
           * ERP READY
           * ----------------------------------------
           */

          setStage("ready");

          await new Promise((resolve) =>
            setTimeout(resolve, 700)
          );

          if (cancelled) {
            return;
          }

          /*
           * If user opened another ERP page,
           * send them to Dashboard after startup.
           *
           * IMPORTANT:
           * Do NOT reload the browser.
           */

          if (
            window.location.pathname !== "/" &&
            !window.location.pathname.startsWith(
              "/camp/"
            )
          ) {
            window.history.replaceState(
              {},
              "",
              "/"
            );
          }

          /*
           * ONLY NOW does the actual ERP render.
           */

          setIsReady(true);

          console.log(
            "🎉 SCHOOLAY ERP: READY"
          );

          return;

        } catch (error) {
          /*
           * ----------------------------------------
           * BACKEND FAILED
           * ----------------------------------------
           *
           * DO NOT set isReady(true).
           *
           * This is the important fix.
           */

          console.error(
            "❌ SCHOOLAY ERP: Backend unavailable",
            error
          );

          if (cancelled) {
            return;
          }

          /*
           * Keep loader visible.
           */

          setStage("connecting");

          /*
           * Wait 3 seconds and try again.
           */

          console.log(
            "🔄 SCHOOLAY ERP: Retrying in 3 seconds..."
          );

          await new Promise((resolve) =>
            setTimeout(resolve, 3000)
          );
        }
      }
    }

    void startup();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * ============================================
   * BACKEND NOT READY
   * ============================================
   *
   * RouterProvider is NOT rendered.
   *
   * Therefore Dashboard cannot appear and
   * cannot show "Request failed".
   */

  if (!isReady) {
    return (
      <ERPStartupLoader
        stage={stage}
      />
    );
  }

  /*
   * ============================================
   * BACKEND READY
   * ============================================
   */

  return (
    <ERPStartupContext.Provider
      value={{
        isReady,
        initialOrders,
        initialSchools,
        initialPagination
      }}
    >
      {children}
    </ERPStartupContext.Provider>
  );
}

export function useERPStartup() {
  const context =
    useContext(ERPStartupContext);

  if (!context) {
    throw new Error(
      "useERPStartup must be used inside ERPStartupProvider"
    );
  }

  return context;
}