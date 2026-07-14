import CDP from "chrome-remote-interface";

const defaultHost = "127.0.0.1";
const defaultPort = 9222;

function getCdpOptions(options = {}) {
  return {
    host: options.cdpHost ?? defaultHost,
    port: options.cdpPort ?? defaultPort,
  };
}

// Map<clientKey, Promise<CDP.Client>>
const clientPromiseMap = new Map();

export async function getClient(targetId, options = {}) {
  const clientKey = getClientKey(targetId, options);

  let clientPromise = clientPromiseMap.get(clientKey);

  if (!clientPromise) {
    clientPromise = createClient(targetId, options);

    clientPromise.catch(() => {
      clientPromiseMap.delete(clientKey);
    });

    clientPromiseMap.set(clientKey, clientPromise);
  }

  return await clientPromise;
}

export async function closeClients() {
  const clientPromises = [...clientPromiseMap.values()];

  clientPromiseMap.clear();

  await Promise.all(
    clientPromises.map((clientPromise) =>
      clientPromise.then((client) => client.close()).catch(() => {}),
    ),
  );
}

function getClientKey(targetId, options = {}) {
  const { host, port } = getCdpOptions(options);

  return `${host}:${port}:${targetId}`;
}

async function createClient(targetId, options = {}) {
  const { host, port } = getCdpOptions(options);

  const clientKey = getClientKey(targetId, options);

  const client = await CDP({
    host,
    port,
    target: targetId,
  });

  client.on("disconnect", () => {
    clientPromiseMap.delete(clientKey);
  });

  return client;
}
