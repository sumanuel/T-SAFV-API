const sent = [];

function createTransport() {
  return {
    sendMail: (opts, cb) => {
      sent.push(opts);
      if (cb) cb(null, { response: "250 OK" });
      return Promise.resolve({ response: "250 OK" });
    },
  };
}

module.exports = { createTransport, sent };
