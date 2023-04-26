const fetch = require('cross-fetch');

const graphQL = async (operation, query, options) => {
  if (!options) options = {};
  if (!options.apiUrl)
    options.apiUrl =
      process.env.REACT_APP_API_URL || "https://api.proca.app/api";

  let data = null;
  let headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (options.authorization) {
    //    var auth = 'Basic ' + Buffer.from(options.authorization.username + ':' + options.authorization.username.password).toString('base64');
    headers.Authorization = "Basic " + options.authorization;
  }
  // console.debug("graphql: ", query, options.variables);
  await fetch(
    options.apiUrl +
      (options.variables.actionPage
        ? "?id=" + options.variables.actionPage
        : ""),
    {
      method: "POST",
      referrerPolicy: "no-referrer-when-downgrade",
      headers: headers,
      body: JSON.stringify({
        query: query,
        variables: options.variables,
        operationName: operation || "",
        extensions: options.extensions,
      }),
    }
  )
    .then((res) => {
      if (!res.ok) {
        return {
          errors: [
            { message: res.statusText, code: "http_error", status: res.status },
          ],
        };
      }
      return res.json();
    })
    .then((response) => {
      if (response.errors) {
        const toCamel = (s) =>
          s.replace(/([_][a-z])/gi, ($1) => $1.toUpperCase().replace("_", ""));

        response.errors.fields = [];
        response.errors.forEach((error) => {
          const field = error.path && error.path.slice(-1)[0];
          if (!field) return;
          let msg = error.message.split(":");
          if (msg.length === 2) {
            msg = msg[1];
          } else {
            msg = error.message;
          }
          response.errors.fields.push({
            name: toCamel(field),
            message: msg, // error.message,
          });
        });
        data = response;
        return;
      }
      data = response.data;
    })
    .catch((error) => {
      console.log(error);
      data = { errors: [{ code: "network", message: error }] };
      return;
    });
  return data;
}

const getStats = async (campaign) => {
  var query = `query getStats ($campaign: String!)
  {campaign (name:$campaign){
    stats {
      supporterCount, supporterCountByArea {area, count}
    }
  }
}`;
  let variables = {
    campaign: campaign
  };
  const response = await graphQL("getStats", query, {
    variables: variables,
  });
  if (response.errors) return response;
  let supporters = {
    total: response.campaign.stats.supporterCount,
    country: {}
  };
  response.campaign.stats.supporterCountByArea.forEach (d => {
     supporters.country[d.area] = d.count;
  });
console.log(supporters);
  return supporters;
}

module.exports = { getStats };
