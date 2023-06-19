const unflatten = (flatObject) => {
  const deepObject = {};

  for (const key in flatObject) {
    const value = flatObject[key];
    const keys = key.split('.');
    let currentObj = deepObject;

    for (let i = 0; i < keys.length; i++) {
      const currentKey = keys[i];

      if (!currentObj[currentKey]) {
        if (i === keys.length - 1) {
          currentObj[currentKey] = value;
        } else {
          currentObj[currentKey] = {};
        }
      }

      currentObj = currentObj[currentKey];
    }
  }

  return deepObject;
}

const flatten = (deepObject) => {
  const flatObject = {};

  function flatten(obj, prefix = '') {
    for (const key in obj) {
      if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
        flatten(obj[key], prefix + key + '.');
      } else {
        flatObject[prefix + key] = obj[key];
      }
    }
  }

  flatten(deepObject);
  return flatObject;
}

const shuffle = (targets) => {

  for (let i = targets.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [targets[i], targets[j]] = [targets[j], targets[i]];
  };

  return targets;
};

module.exports = { flatten, unflatten, shuffle };

//console.log(flatten ({a:{b:{c:"aa"}}}));
//console.log(unflatten ({"a.b.c":"aa"}));
