import type { PostConfirmationTriggerHandler } from "aws-lambda";
import { type Schema } from "../../data/resource";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { fromSSO } from "@aws-sdk/credential-providers"; // Import AWS SSO credentials provider
import { AppSyncClient, ListGraphqlApisCommand } from "@aws-sdk/client-appsync"; // AWS AppSync SDK
import { createUserProfile } from "./graphql/mutations";

const region = process.env.AWS_REGION || "us-east-2"; // Set default region if not provided

// Retrieve AWS credentials dynamically from AWS SSO
const credentialsProvider = async () => {
  const credentials = await fromSSO({ profile: "field" })(); // Fetch SSO credentials from ~/.aws/config
  return {
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      sessionToken: credentials.sessionToken,
    },
  };
};

// Function to retrieve the GraphQL API endpoint from AWS AppSync
const getGraphQLEndpoint = async (): Promise<string> => {
    try {
      const appsyncClient = new AppSyncClient({ region, credentials: fromSSO({ profile: "default" }) });
  
      const response = await appsyncClient.send(new ListGraphqlApisCommand({}));
  
      if (!response.graphqlApis || response.graphqlApis.length === 0) {
        throw new Error("No GraphQL APIs found in AWS AppSync.");
      }
  
      return response.graphqlApis[0].uris?.GRAPHQL || "";
    } catch (error) {
      console.error("Error fetching AppSync GraphQL API endpoint:", error);
      throw error;
    }
  };

const graphQLEndpoint = await getGraphQLEndpoint()

// Configure Amplify
Amplify.configure(
  {
    API: {
      GraphQL: {
        endpoint: graphQLEndpoint, // process.env.AMPLIFY_DATA_GRAPHQL_ENDPOINT, // Use env for endpoint
        region,
        defaultAuthMode: "iam",
      },
    },
  },
  {
    Auth: {
      credentialsProvider: {
        getCredentialsAndIdentityId: credentialsProvider,
        clearCredentialsAndIdentityId: () => {
          /* noop */
        },
      },
    },
  }
);

// Generate GraphQL Client
const client = generateClient<Schema>({
  authMode: "iam",
});

export const handler: PostConfirmationTriggerHandler = async (event) => {
  await client.graphql({
    query: createUserProfile,
    variables: {
      input: {
        email: event.request.userAttributes.email,
        profileOwner: `${event.request.userAttributes.sub}::${event.userName}`,
      },
    },
  });

  return event;
};
