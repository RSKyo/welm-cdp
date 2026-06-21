import CDP from "chrome-remote-interface";

const defaultHost = "127.0.0.1";
const defaultPort = 9222;

// Map<clientKey, Promise<CDP.Client>>
const clientPromiseMap = new Map();

function getClientKey(id, options = {}) {
  const host = options.host ?? defaultHost;
  const port = options.port ?? defaultPort;

  return `${host}:${port}:${id}`;
}

async function createClient(id, options = {}) {
  const host = options.host ?? defaultHost;
  const port = options.port ?? defaultPort;
  const clientKey = getClientKey(id, options);

  const client = await CDP({
    host,
    port,
    target: id,
  });

  client.on("disconnect", () => {
    clientPromiseMap.delete(clientKey);
  });

  return client;
}

export async function getClient(id, options = {}) {
  const clientKey = getClientKey(id, options);

  let clientPromise = clientPromiseMap.get(clientKey);

  if (!clientPromise) {
    clientPromise = createClient(id, options);

    clientPromise.catch(() => {
      clientPromiseMap.delete(clientKey);
    });

    clientPromiseMap.set(clientKey, clientPromise);
  }

  return await clientPromise;
}

export async function closeClient(id, options = {}) {
  const clientKey = getClientKey(id, options);

  const clientPromise = clientPromiseMap.get(clientKey);
  
  if (!clientPromise) {
    return;
  }

  try {
    const client = await clientPromise;
    await client.close();
  } finally {
    clientPromiseMap.delete(clientKey);
  }
}

export async function closeAllClients() {
  const promises = [];

  for (const clientPromise of clientPromiseMap.values()) {
    promises.push(
      clientPromise.then((client) => client.close()).catch(() => {}),
    );
  }

  await Promise.all(promises);
  clientPromiseMap.clear();
}
