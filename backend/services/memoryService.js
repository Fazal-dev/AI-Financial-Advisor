const sessions = {};

exports.getSession = (sessionId) => {
  if (!sessions[sessionId]) {
    sessions[sessionId] = {
      lastIntent: null,
      lastAmount: null
    };
  }
  return sessions[sessionId];
};

exports.updateSession = (sessionId, data) => {
  const session = exports.getSession(sessionId);

  if (data.intent) session.lastIntent = data.intent;
  if (data.amount) session.lastAmount = data.amount;

  sessions[sessionId] = session;
};