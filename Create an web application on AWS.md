# Create an web application on AWS

link:https://aws.amazon.com/getting-started/hands-on/build-web-app-s3-lambda-api-gateway-dynamodb/module-one/?e=gs2020&p=build-a-web-app-intro

```
npm create vite@latest profilesapp -- --template react
cd profilesapp
npm install
npm run dev
````

```
git remote add origin git@github.com:fabpimentel/profilesapp.git 
git branch -M main
```

npm create amplify@latest -y

npx ampx generate --profile field graphql-client-code --out /Users/fabricio/Documents/GitHub/profilesapp/amplify/auth/post-confirmation/graphql