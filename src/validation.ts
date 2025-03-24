export const parseHHMM = (input: string) => {
  const parts = input.split(":");
  if (parts.length === 2) {
    const [minutes, seconds] = parts;
    return parseInt(minutes) * 60 + parseInt(seconds);
  } else if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    return (
      parseInt(hours) * 60 * 60 + parseInt(minutes) * 60 + parseInt(seconds)
    );
  }
  throw new Error("Invalid input");
};

export const isValidHHMM = (input: string) => {
  try {
    if (input) {
      parseHHMM(input);
    }
    return true;
  } catch {
    return false;
  }
};

export const isValidUrl = (url: string) => {
  if (typeof url !== "string") {
    throw new TypeError("Expected a string");
  }

  url = url.trim();
  if (url.includes(" ")) {
    console.log("URLs cannot contain spaces");
    console.log("url: ", url);

    return false;
  }

  try {
    new URL(url); // eslint-disable-line no-new
    return true;
  } catch {
    return false;
  }
};

export const validateUrl = (url: string) => {
  if (!isValidUrl(url)) {
    throw new Error("Invalid URL");
  }
};
