module.exports = { forceStringCode };

async function forceStringCode(requestContext, events) {
  if (requestContext.json && requestContext.json.code !== undefined) {
    requestContext.json.code = String(requestContext.json.code);
  }
}
