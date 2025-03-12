import jwt, { JwtHeader, JwtPayload, Secret, VerifyErrors } from "jsonwebtoken";
import { signOut } from "next-auth/react";

interface DynamicJwtPayload extends JwtPayload {
  verified_credentials: {
    address?: string
    chain?: string
    format: string
  }[]
}

export const getKey = (
  _: JwtHeader,
  callback: (err: Error | null, key?: Secret) => void
): void => {
  // Define the options for the fetch request
  const options = {
    method: "GET",
    headers: {
      Authorization: `Bearer ${process.env.NEXT_DYNAMIC_BEARER_TOKEN}`,
    },
  };

  // Perform the fetch request asynchronously
  fetch(
    `https://app.dynamicauth.com/api/v0/environments/${process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID}/keys`,
    options,
  )
  .then((response) => {
    return response.json();
  })
  .then((json) => {
    const publicKey = json.key.publicKey;
    const pemPublicKey = Buffer.from(publicKey, "base64").toString("ascii");
    callback(null, pemPublicKey); // Pass the public key to the callback
  })
  .catch((err) => {
    console.error("Error fetching public key:", err);
    callback(err); // Pass the error to the callback
  });
};

const validateJWT = async (
  token: string
): Promise<DynamicJwtPayload | null> => {
  try {
    return await new Promise<DynamicJwtPayload | null>(
      (resolve, reject) => {
        jwt.verify(
          token.trim(),
          getKey,
          { algorithms: ["RS256"] },
          (
            err: VerifyErrors | null,
            decoded: string | JwtPayload | undefined
          ) => {
            if (err) {
              console.log("JWT verification error:", err);
              reject(err);
            } else {
              console.log("JWT successfully decoded");
              // Ensure that the decoded token is of type JwtPayload
              if (typeof decoded === "object" && decoded !== null) {
                resolve(decoded as DynamicJwtPayload);
              } else {
                reject(new Error("Invalid token"));
              }
            }
          }
        )
      }
    )
  } catch (error) {
    console.error("Invalid token:", error);
    return null;
  }
};

async function handleLogout() {
  await signOut({ redirectTo: '/' });
}

export {
  handleLogout,
  validateJWT,
}