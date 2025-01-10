# AWS RDS Database Management Service

This serverless application automates the management of AWS RDS database instances, focusing on lifecycle operations such as starting, stopping, and snapshot management to optimize costs and resource usage. The service leverages AWS Lambda functions and is built using the NestJS framework.

## Overview

The service provides Lambda functions and RESTful endpoints to manage RDS databases effectively. These functions and endpoints support:

1. **Database Lifecycle Operations:**
   - Start and stop RDS instances.
   - Delete or restore snapshots as needed.
   - Optimize resource usage by cleaning up unnecessary snapshots.

2. **Development Environment Management:**
   - Specialized operations for development databases.
   - Cost-effective control of database states for non-production use cases.

## Architecture

- **Framework:** Built with the NestJS framework.
- **Cloud Provider:** Deployed as AWS Lambda functions using the Serverless Framework.
- **Database Management:** Utilizes AWS SDK for RDS to manage database instances and snapshots.
- **Serverless Execution:** Ensures cost-effective and scalable execution.
- **API Support:** Provides RESTful endpoints for managing databases.

## Configuration

### Environment Variables

Set the following environment variables in your `.env` file or in the `serverless.yml` configuration:

```plaintext
AWS_REGION=           # AWS region where RDS instances are located
DEBUG=true            # Enable/disable debug mode (true/false)
DB=                   # Comma-separated list of RDS database instance identifiers
DB_SUBNET_GROUP_NAME= # Name of the RDS subnet group
VPC_SECURITY_GROUP_ID=# VPC security group ID for database access
```

### Serverless Configuration

The `serverless.yml` file configures deployment settings and IAM permissions. It ensures the Lambda functions have the necessary access to manage RDS resources:

```yaml
resources:
  Resources:
    LambdaExecutionRole:
      Type: "AWS::IAM::Role"
      Properties:
        AssumeRolePolicyDocument:
          Version: "2012-10-17"
          Statement:
            - Action: "sts:AssumeRole"
              Effect: "Allow"
              Principal:
                Service: "lambda.amazonaws.com"
        Policies:
          - PolicyName: "LambdaRDSPolicy"
            PolicyDocument:
              Version: "2012-10-17"
              Statement:
                - Effect: "Allow"
                  Action:
                    - "rds:CreateDBSnapshot"
                    - "rds:DeleteDBSnapshot"
                    - "rds:DescribeDBSnapshots"
                    - "rds:DescribeDBInstances"
                    - "rds:CreateDBInstance"
                    - "rds:DeleteDBInstance"
                    - "rds:RestoreDBInstanceFromDBSnapshot"
                    - "rds:AddTagsToResource"
                    - "logs:CreateLogGroup"
                    - "logs:CreateLogStream"
                    - "logs:PutLogEvents"
                  Resource: "*"
```

## Local Development

### Prerequisites

- Install dependencies:
  ```bash
  npm install
  ```

- Set up your `.env` file with the required environment variables.

### Running Locally

Use `serverless-offline` to test the Lambda functions locally:

```bash
npm run lambda:local
```

To test the RESTful endpoints locally:

```bash
npm run start:dev
```

### Building the Application

To build the application, use:

```bash
npm run build
```

## Deployment

Deploy the service to AWS using the Serverless Framework:

```bash
serverless deploy --stage <stage>
```

### Stages

You can specify different deployment stages (e.g., `dev`, `prod`) to manage configurations for various environments.

## Lambda Functions and RESTful Endpoints Details

### Lambda Functions

#### dbActionsFunction

- **Purpose:** Handles development-specific RDS database operations, including snapshot and instance lifecycle management.
- **Configuration:**
  - **Memory:** 128MB
  - **Timeout:** 300 seconds
  - **Triggers:** Scheduled or manual invocation
- **Input:**
  - The Lambda function expects a JSON input with the following structure:
    ```json
    {
      "action": "databaseDown" | "databaseUp"
    }
    ```
  - Example:
    ```json
    {
      "action": "databaseDown"
    }
    ```
  - Valid actions are `databaseDown` to stop databases and `databaseUp` to start databases.

### RESTful Endpoints

#### `/`
- **Method:** GET
- **Description:** Returns a welcome message.

#### `/down-dbs`
- **Method:** GET
- **Description:** Shuts down development RDS databases.
- **Response:** `"down"` upon successful shutdown.

#### `/up-dbs`
- **Method:** GET
- **Description:** Starts development RDS databases.
- **Response:** `"up"` upon successful startup.

## Security

1. **IAM Roles:** The service uses a dedicated IAM role (`LambdaExecutionRole`) with permissions for RDS and CloudWatch Logs operations.
2. **Network Isolation:** Subnet groups and VPC security groups ensure secure access to RDS instances.
3. **Debugging:** Debug mode (`DEBUG=true`) logs detailed information for troubleshooting but should be disabled in production.

## Project Structure

```
.
├── src/
│   ├── lambdas/
│   │   └── db-actions.ts          # Main Lambda handler for RDS operations
│   ├── modules/
│   │   └── database/
│   │       ├── database.controller.ts
│   │       ├── database.module.ts
│   │       └── database.service.ts
│   ├── app.controller.spec.ts
│   ├── app.controller.ts
│   ├── app.module.ts
│   ├── app.service.ts
│   └── main.ts
├── .env
├── .eslintrc.js
├── .gitignore
├── .prettierrc
├── README.md
├── env.example
├── nest-cli.json
├── package-lock.json
├── package.json
├── serverless.yml
├── tsconfig.build.json
└── tsconfig.json
```

## Scripts

- `npm run build`: Builds the application for deployment.
- `npm run lambda:local`: Runs the Lambda functions locally using `serverless-offline`.
- `npm run start:dev`: Runs the RESTful API locally for development.

## Testing

Run the tests using:

```bash
npm test
```

## License

This project is licensed under the GNU General Public License v3.0. See the LICENSE file for details.