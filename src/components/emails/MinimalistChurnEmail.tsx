import React from "react";

interface MinimalistChurnEmailProps {
  userName?: string;
  serviceName?: string;
  monthlyCost?: string;
  showsWatched?: number;
  showsCued?: number;
  pauseUrl?: string;
  addShowUrl?: string;
}

/**
 * Minimalist churn-alert email template.
 * Renders as inline-styled HTML safe for email clients.
 */
const MinimalistChurnEmail: React.FC<MinimalistChurnEmailProps> = ({
  userName = "there",
  serviceName = "Paramount+",
  monthlyCost = "$18.99",
  showsWatched = 0,
  showsCued = 0,
  pauseUrl = "#",
  addShowUrl = "#",
}) => {
  return (
    <div
      style={{
        backgroundColor: "#1a1625",
        fontFamily: "'Outfit', 'Helvetica Neue', Arial, sans-serif",
        margin: 0,
        padding: 0,
        width: "100%",
        minHeight: "100vh",
      }}
    >
      <table
        role="presentation"
        cellPadding={0}
        cellSpacing={0}
        style={{
          width: "100%",
          maxWidth: 560,
          margin: "0 auto",
          backgroundColor: "#1a1625",
        }}
      >
        {/* Spacer */}
        <tr>
          <td style={{ height: 48 }} />
        </tr>

        {/* Logo Header */}
        <tr>
          <td style={{ textAlign: "center", paddingBottom: 40 }}>
            <table role="presentation" cellPadding={0} cellSpacing={0} style={{ margin: "0 auto" }}>
              <tr>
                <td
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                  }}
                >
                  {/* Play icon */}
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      border: "2px solid #ffffff",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <div
                      style={{
                        width: 0,
                        height: 0,
                        borderLeft: "10px solid #ffffff",
                        borderTop: "6px solid transparent",
                        borderBottom: "6px solid transparent",
                        marginLeft: 3,
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: 28,
                      fontWeight: 700,
                      color: "#ffffff",
                      letterSpacing: 2,
                    }}
                  >
                    CUE IT
                  </span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        {/* Divider */}
        <tr>
          <td style={{ paddingLeft: 32, paddingRight: 32 }}>
            <div style={{ height: 1, backgroundColor: "#2d2640" }} />
          </td>
        </tr>

        {/* Greeting */}
        <tr>
          <td
            style={{
              padding: "40px 32px 8px",
              fontSize: 15,
              color: "#9b8fb8",
              lineHeight: 1.6,
            }}
          >
            Hey {userName},
          </td>
        </tr>

        {/* Monthly Waste — Hero number */}
        <tr>
          <td style={{ padding: "24px 32px 8px" }}>
            <div
              style={{
                backgroundColor: "#221d30",
                borderRadius: 12,
                border: "1px solid #2d2640",
                padding: "32px 24px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: 3,
                  textTransform: "uppercase" as const,
                  color: "#6b6087",
                  marginBottom: 12,
                }}
              >
                Monthly Waste
              </div>
              <div
                style={{
                  fontSize: 48,
                  fontWeight: 800,
                  color: "#ffffff",
                  lineHeight: 1,
                  marginBottom: 16,
                }}
              >
                {monthlyCost}
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: "#9b8fb8",
                  lineHeight: 1.5,
                }}
              >
                spent on a service you didn't use this month.
              </div>
            </div>
          </td>
        </tr>

        {/* Insight */}
        <tr>
          <td style={{ padding: "24px 32px 0" }}>
            <div
              style={{
                backgroundColor: "#221d30",
                borderRadius: 12,
                border: "1px solid #2d2640",
                padding: "24px",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: 3,
                  textTransform: "uppercase" as const,
                  color: "#6b6087",
                  marginBottom: 16,
                }}
              >
                The Breakdown
              </div>

              <table role="presentation" cellPadding={0} cellSpacing={0} style={{ width: "100%" }}>
                <tr>
                  <td style={{ fontSize: 15, color: "#ffffff", fontWeight: 600, paddingBottom: 6 }}>
                    {serviceName}
                  </td>
                </tr>
                <tr>
                  <td style={{ fontSize: 14, color: "#6b6087", paddingBottom: 4 }}>
                    <span style={{ color: "#9b8fb8" }}>{showsWatched}</span> shows watched
                  </td>
                </tr>
                <tr>
                  <td style={{ fontSize: 14, color: "#6b6087" }}>
                    <span style={{ color: "#9b8fb8" }}>{showsCued}</span> shows cued
                  </td>
                </tr>
              </table>
            </div>
          </td>
        </tr>

        {/* CTA Buttons */}
        <tr>
          <td style={{ padding: "32px 32px 0" }}>
            <table role="presentation" cellPadding={0} cellSpacing={0} style={{ width: "100%" }}>
              <tr>
                <td style={{ paddingBottom: 12 }}>
                  <a
                    href={pauseUrl}
                    style={{
                      display: "block",
                      textAlign: "center",
                      backgroundColor: "#ffffff",
                      color: "#1a1625",
                      fontSize: 14,
                      fontWeight: 700,
                      textDecoration: "none",
                      padding: "14px 24px",
                      borderRadius: 8,
                      letterSpacing: 0.5,
                    }}
                  >
                    Pause Subscription
                  </a>
                </td>
              </tr>
              <tr>
                <td>
                  <a
                    href={addShowUrl}
                    style={{
                      display: "block",
                      textAlign: "center",
                      backgroundColor: "transparent",
                      color: "#ffffff",
                      fontSize: 14,
                      fontWeight: 600,
                      textDecoration: "none",
                      padding: "14px 24px",
                      borderRadius: 8,
                      border: "1px solid #2d2640",
                      letterSpacing: 0.5,
                    }}
                  >
                    Add a Show to Queue
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        {/* Footer */}
        <tr>
          <td
            style={{
              padding: "48px 32px 16px",
              textAlign: "center",
              fontSize: 12,
              color: "#4a4162",
              lineHeight: 1.6,
            }}
          >
            You're receiving this because you enabled churn alerts.
            <br />
            <a href="#" style={{ color: "#6b6087", textDecoration: "underline" }}>
              Manage preferences
            </a>
          </td>
        </tr>

        {/* Bottom spacer */}
        <tr>
          <td style={{ height: 48 }} />
        </tr>
      </table>
    </div>
  );
};

export default MinimalistChurnEmail;
