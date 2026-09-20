import React from "react";

export type ERPStartupStage =
  | "connecting"
  | "database"
  | "orders"
  | "schools"
  | "ready";

interface ERPStartupLoaderProps {
  stage: ERPStartupStage;
}

const stages: Array<{
  id: ERPStartupStage;
  label: string;
  description: string;
}> = [
  {
    id: "connecting",
    label: "ERP Server",
    description: "Establishing secure connection"
  },
  {
    id: "database",
    label: "Business Database",
    description: "Synchronizing business data"
  },
  {
    id: "orders",
    label: "Order Management",
    description: "Loading order information"
  },
  {
    id: "schools",
    label: "School Network",
    description: "Loading organization data"
  }
];

function stageNumber(stage: ERPStartupStage): number {
  switch (stage) {
    case "connecting":
      return 0;

    case "database":
      return 1;

    case "orders":
      return 2;

    case "schools":
      return 3;

    case "ready":
      return 4;

    default:
      return 0;
  }
}

export default function ERPStartupLoader({
  stage
}: ERPStartupLoaderProps) {
  const currentStage = stageNumber(stage);

  const progress =
    stage === "ready"
      ? 100
      : Math.min(
          95,
          Math.round(
            ((currentStage + 0.5) / stages.length) * 100
          )
        );

  return (
    <div className="erp-startup">
      <style>
        {`
          .erp-startup {
            min-height: 100vh;
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            background:
              radial-gradient(
                circle at 50% 35%,
                rgba(45, 112, 255, 0.16),
                transparent 34%
              ),
              linear-gradient(
                135deg,
                #07111f 0%,
                #0b1628 45%,
                #08101d 100%
              );
            color: #ffffff;
            font-family:
              Inter,
              system-ui,
              -apple-system,
              BlinkMacSystemFont,
              "Segoe UI",
              sans-serif;
            overflow: hidden;
            position: relative;
          }

          .erp-startup::before {
            content: "";
            position: absolute;
            width: 600px;
            height: 600px;
            border-radius: 50%;
            border: 1px solid rgba(255,255,255,0.05);
            animation: erpPulse 4s ease-in-out infinite;
          }

          .erp-startup::after {
            content: "";
            position: absolute;
            width: 900px;
            height: 900px;
            border-radius: 50%;
            border: 1px solid rgba(255,255,255,0.035);
          }

          .erp-loader-card {
            width: min(720px, 92vw);
            position: relative;
            z-index: 2;
            text-align: center;
          }

          .erp-logo {
            width: 76px;
            height: 76px;
            margin: 0 auto 22px;
            border-radius: 22px;
            display: flex;
            align-items: center;
            justify-content: center;
            background:
              linear-gradient(
                135deg,
                #2563eb,
                #06b6d4
              );
            box-shadow:
              0 0 50px rgba(37,99,235,0.35);
            font-size: 27px;
            font-weight: 800;
            letter-spacing: -2px;
            animation: erpFloat 3s ease-in-out infinite;
          }

          .erp-title {
            margin: 0;
            font-size: clamp(30px, 5vw, 48px);
            font-weight: 800;
            letter-spacing: -1.5px;
          }

          .erp-title span {
            background:
              linear-gradient(
                90deg,
                #60a5fa,
                #22d3ee
              );
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }

          .erp-subtitle {
            margin: 10px 0 40px;
            color: rgba(255,255,255,0.58);
            font-size: 14px;
            letter-spacing: 0.4px;
          }

          .erp-network {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0;
            margin: 0 auto 42px;
            max-width: 620px;
          }

          .erp-node-wrapper {
            display: flex;
            align-items: center;
            flex: 1;
          }

          .erp-node {
            width: 48px;
            height: 48px;
            flex-shrink: 0;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #111d31;
            border: 1px solid rgba(255,255,255,0.12);
            color: rgba(255,255,255,0.35);
            font-size: 16px;
            font-weight: 700;
            transition: all 0.5s ease;
          }

          .erp-node.active {
            background: #2563eb;
            border-color: #60a5fa;
            color: #ffffff;
            box-shadow:
              0 0 0 6px rgba(37,99,235,0.12),
              0 0 30px rgba(37,99,235,0.4);
          }

          .erp-node.completed {
            background: #059669;
            border-color: #34d399;
            color: #ffffff;
          }

          .erp-line {
            height: 2px;
            flex: 1;
            background: rgba(255,255,255,0.08);
            position: relative;
            overflow: hidden;
          }

          .erp-line.completed {
            background: #059669;
          }

          .erp-line.active::after {
            content: "";
            position: absolute;
            left: -30%;
            top: 0;
            width: 30%;
            height: 100%;
            background: #60a5fa;
            box-shadow: 0 0 12px #60a5fa;
            animation: erpFlow 1.2s linear infinite;
          }

          .erp-status-card {
            background: rgba(255,255,255,0.055);
            border: 1px solid rgba(255,255,255,0.09);
            border-radius: 18px;
            padding: 22px;
            text-align: left;
            backdrop-filter: blur(18px);
          }

          .erp-status-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 15px;
          }

          .erp-status-title {
            font-size: 14px;
            font-weight: 700;
          }

          .erp-percent {
            font-size: 13px;
            color: #60a5fa;
            font-weight: 700;
          }

          .erp-progress {
            height: 7px;
            border-radius: 99px;
            background: rgba(255,255,255,0.08);
            overflow: hidden;
            margin-bottom: 18px;
          }

          .erp-progress-bar {
            height: 100%;
            border-radius: inherit;
            background:
              linear-gradient(
                90deg,
                #2563eb,
                #22d3ee
              );
            box-shadow:
              0 0 18px rgba(34,211,238,0.4);
            transition: width 0.6s ease;
          }

          .erp-stage-list {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }

          .erp-stage {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px;
            border-radius: 10px;
            color: rgba(255,255,255,0.42);
            font-size: 12px;
            transition: all 0.3s ease;
          }

          .erp-stage.active {
            color: #ffffff;
            background: rgba(37,99,235,0.12);
          }

          .erp-stage.completed {
            color: #86efac;
          }

          .erp-dot {
            width: 9px;
            height: 9px;
            border-radius: 50%;
            background: rgba(255,255,255,0.18);
            flex-shrink: 0;
          }

          .erp-stage.active .erp-dot {
            background: #60a5fa;
            box-shadow: 0 0 12px #60a5fa;
            animation: erpBlink 1s ease-in-out infinite;
          }

          .erp-stage.completed .erp-dot {
            background: #34d399;
          }

          .erp-message {
            margin-top: 24px;
            color: rgba(255,255,255,0.48);
            font-size: 12px;
          }

          @keyframes erpFlow {
            from {
              left: -30%;
            }
            to {
              left: 100%;
            }
          }

          @keyframes erpPulse {
            0%, 100% {
              transform: scale(0.95);
              opacity: 0.3;
            }
            50% {
              transform: scale(1.05);
              opacity: 0.65;
            }
          }

          @keyframes erpFloat {
            0%, 100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-7px);
            }
          }

          @keyframes erpBlink {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.35;
            }
          }

          @media (max-width: 600px) {
            .erp-network {
              padding: 0 10px;
            }

            .erp-node {
              width: 38px;
              height: 38px;
              font-size: 13px;
            }

            .erp-stage-list {
              grid-template-columns: 1fr;
            }

            .erp-status-card {
              padding: 16px;
            }
          }
        `}
      </style>

      <div className="erp-loader-card">
        <div className="erp-logo">S</div>

        <h1 className="erp-title">
          SCHOOLAY <span>ERP</span>
        </h1>

        <p className="erp-subtitle">
          Connecting your business management environment
        </p>

        <div className="erp-network">
          {stages.map((item, index) => {
            const completed =
              currentStage > index;

            const active =
              currentStage === index;

            return (
              <React.Fragment key={item.id}>
                <div className="erp-node-wrapper">
                  <div
                    className={[
                      "erp-node",
                      completed ? "completed" : "",
                      active ? "active" : ""
                    ].join(" ")}
                  >
                    {completed ? "✓" : index + 1}
                  </div>
                </div>

                {index < stages.length - 1 && (
                  <div
                    className={[
                      "erp-line",
                      currentStage > index
                        ? "completed"
                        : "",
                      active ? "active" : ""
                    ].join(" ")}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        <div className="erp-status-card">
          <div className="erp-status-top">
            <span className="erp-status-title">
              Initializing ERP workspace
            </span>

            <span className="erp-percent">
              {progress}%
            </span>
          </div>

          <div className="erp-progress">
            <div
              className="erp-progress-bar"
              style={{
                width: `${progress}%`
              }}
            />
          </div>

          <div className="erp-stage-list">
            {stages.map((item, index) => {
              const completed =
                currentStage > index;

              const active =
                currentStage === index;

              return (
                <div
                  key={item.id}
                  className={[
                    "erp-stage",
                    active ? "active" : "",
                    completed ? "completed" : ""
                  ].join(" ")}
                >
                  <span className="erp-dot" />

                  <span>
                    {completed
                      ? `✓ ${item.label}`
                      : item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="erp-message">
          {stage === "connecting" &&
            "Establishing connection with ERP server..."}

          {stage === "database" &&
            "Business environment is online. Synchronizing data..."}

          {stage === "orders" &&
            "Loading orders, invoices and fulfilment information..."}

          {stage === "schools" &&
            "Loading school and organization information..."}

          {stage === "ready" &&
            "Workspace ready. Launching Order Management..."}
        </div>
      </div>
    </div>
  );
}