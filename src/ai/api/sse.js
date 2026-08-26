// Incremental Server-Sent Events parser over raw text chunks. Handles chunk boundaries
// that split lines (or the blank-line separator) arbitrarily, since fetch's ReadableStream
// gives no guarantee chunks align with SSE frame boundaries.
export function createSseParser(onEvent) {
  let buffer = "";
  let eventName = "message";
  let dataLines = [];

  function dispatch() {
    if (dataLines.length === 0) {
      eventName = "message";
      return;
    }
    const raw = dataLines.join("\n");
    dataLines = [];
    const name = eventName;
    eventName = "message";

    let data = raw;
    try {
      data = JSON.parse(raw);
    } catch {
      // not JSON — deliver the raw string
    }
    onEvent({ event: name, data });
  }

  function consumeLine(line) {
    if (line === "") {
      dispatch();
      return;
    }
    if (line.startsWith(":")) return; // comment / heartbeat

    const sepIdx = line.indexOf(":");
    let field = line;
    let value = "";
    if (sepIdx !== -1) {
      field = line.slice(0, sepIdx);
      value = line.slice(sepIdx + 1);
      if (value.startsWith(" ")) value = value.slice(1);
    }

    if (field === "event") eventName = value;
    else if (field === "data") dataLines.push(value);
  }

  return {
    push(chunk) {
      buffer += chunk;
      let idx;
      while ((idx = buffer.indexOf("\n")) !== -1) {
        let line = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        consumeLine(line);
      }
    },
    flush() {
      if (buffer) {
        consumeLine(buffer);
        buffer = "";
      }
      dispatch();
    },
  };
}
