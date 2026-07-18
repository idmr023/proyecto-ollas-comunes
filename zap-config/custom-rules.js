// ZAP Custom Scan Rule: SIGO-OLLAS Specific Checks
// This script adds custom checks during passive scanning

// Check 1: Verify JWT tokens are not exposed in URLs
function scanNode(node) {
  var url = node.getURI().toString();

  // Check for JWT-like tokens in URL parameters
  var jwtPattern = /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/;
  if (jwtPattern.test(url)) {
    var alert = new org.zaproxy.zap.extension.alert.ExtensionAlert();
    var source = new org.zaproxy.zap.model.Target(node);
    raiseAlert(
      "JWT Token in URL",
      "HIGH",
      "JWT tokens should never be passed as URL parameters as they may be logged in server access logs, browser history, and proxy logs.",
      node,
      "40014"
    );
  }

  // Check 2: Verify TOTP secrets are not in URLs
  var totpPattern = /secret=[A-Za-z0-9_-]{16,}/;
  if (totpPattern.test(url)) {
    raiseAlert(
      "Secret/TOTP in URL",
      "HIGH",
      "Sensitive secrets (TOTP, API keys) should not be passed as URL parameters.",
      node,
      "40024"
    );
  }

  // Check 3: Check for sensitive data in response body
  var responseHeader = node.getResponseHeader();
  var responseBody = node.getResponseBody().toString();

  if (responseHeader.getHeaderValue("Content-Type") &&
      responseHeader.getHeaderValue("Content-Type").indexOf("json") !== -1) {

    // Check for password hashes in response
    if (responseBody.indexOf("$2a$") !== -1 || responseBody.indexOf("$2b$") !== -1) {
      raiseAlert(
        "Password Hash in Response",
        "HIGH",
        "bcrypt password hashes should never be returned in API responses.",
        node,
        "40023"
      );
    }

    // Check for TOTP secrets in response
    if (responseBody.indexOf("totpSecret") !== -1 && responseBody.length < 5000) {
      raiseAlert(
        "TOTP Secret Exposed",
        "MEDIUM",
        "TOTP secrets should not be exposed in API responses.",
        node,
        "40024"
      );
    }

    // Check for database connection strings
    if (responseBody.indexOf("postgresql://") !== -1 || responseBody.indexOf("postgres://") !== -1) {
      raiseAlert(
        "Database Connection String in Response",
        "HIGH",
        "Database connection strings with credentials should never be returned to clients.",
        node,
        "40023"
      );
    }

    // Check for stack traces
    if (responseBody.indexOf("at Object.") !== -1 ||
        responseBody.indexOf("at Module._compile") !== -1 ||
        responseBody.indexOf("node_modules") !== -1) {
      raiseAlert(
        "Stack Trace in Response",
        "MEDIUM",
        "Server stack traces should not be exposed to clients in production.",
        node,
        "40023"
      );
    }
  }
}

function raiseAlert(title, risk, description, node, pluginId) {
  var alert = new org.zaproxy.zap.extension.alert.Alert();
  alert.setPluginId(parseInt(pluginId));
  alert.setName("SIGO-OLLAS: " + title);
  alert.setRisk(org.zaproxy.zap.model.Risk.valueOf(risk));
  alert.setConfidence(org.zaproxy.zap.model.Confidence.HIGH);
  alert.setDescription(description);
  alert.setUri(node.getURI().toString());
  alert.setEvidence(node.getName());
  alert.setCweId(200);
  alert.setWascId(0);

  org.zaproxy.zap.extension.alert.ExtensionAlert raiseAlert(alert);
}

function scanHttpResponseReceive(msg) {
  // Implemented above in scanNode for simplicity
}

function getMetadata() {
  return [
    "name:SIGO-OLLAS Custom Security Rules",
    "author:SIGO-OLLAS Security Team",
    "description:Custom security checks for SIGO-OLLAS specific vulnerabilities",
    "enabled:true"
  ];
}
